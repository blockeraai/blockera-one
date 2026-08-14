/**
 * Build-time lint for Templates Builder markup and the PHP catalog, run
 * as part of the Jest suite so CI fails the PR when they diverge (replaces
 * the old `bin/lint-builder-patterns.js` CLI).
 *
 * Sources of truth (nothing hardcoded here):
 * - Stamp ids/roles come from the source dictionaries (`shared/stamps.ts` +
 *   `<type>/stamps.ts`) via `registry.ts` `ALL_STAMPS` / `STAMP_DICTIONARIES`
 *   (`role/id` lists aggregated into an id → role map),
 *   so markup validation can never drift from the reference data.
 * - Stamps are validated in `patterns/**` AND `templates/*.html` (both ship
 *   `metadata.blockeraOne` anchors).
 * - Catalog pattern slugs come from the shared PHP fixture
 *   (`php/tests/fixtures/template-builder-catalog.json`, asserted equal to
 *   the real PHP output by PHPUnit) plus a regex sweep of the
 *   `php/Theme/TemplateBuilder/*Catalog.php` sources as a cross-check for
 *   Catalog.php edits that skipped the fixture.
 */

// templates/constants (pulled via archive/config) imports the nested-panels
// barrel whose module graph reaches @wordpress/block-editor UI. Only
// readPanelStack is consumed there — stub it to keep this suite light.
jest.mock('../../../nested-panels', () => ({
	readPanelStack: () => [],
}));

import fs from 'fs';
import path from 'path';

import { ALL_STAMPS, CONFIGS, STAMP_DICTIONARIES } from '../../registry';
import { STAMP_ROLES } from '../stamp';
import { flattenPanelControls } from '../resolve-options-panel';

const fixture = require('../../../../../php/tests/fixtures/template-builder-catalog.json');

const themeRoot = path.resolve(__dirname, '../../../../../../..');
const patternsRoot = path.join(themeRoot, 'patterns');
const templatesRoot = path.join(themeRoot, 'templates');
const catalogsRoot = path.join(
	themeRoot,
	'packages/blockera-one/php/Theme/TemplateBuilder'
);

const BUILDER_PREFIX = 'builder-';
const LAYOUT_MARKER = '-layout-';
const BUILDER_CATEGORY = 'blockera-one/template-builder';
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Stamp strings are `role/id` or `role/id:variant`, kebab-case throughout. */
const STAMP_SHAPE =
	/^(layout|section|area|container)\/([a-z0-9-]+)(?::([a-z0-9-]+))?$/;
/** Dictionary entries are `role/id` only (no variant). */
const DICTIONARY_ENTRY_SHAPE =
	/^(layout|section|area|container)\/([a-z0-9-]+)$/;

// --- Role ids derived from the source dictionaries --------------------------

const layoutIds = new Set();
const areaIds = new Set();

for (const [id, role] of Object.entries(ALL_STAMPS)) {
	if ('layout' === role) {
		layoutIds.add(id);
	} else if ('area' === role) {
		areaIds.add(id);
	}
}

// --- Filesystem index (one pass over patterns/**, templates/*, catalogs) ---

/**
 * Recursively collect files matching a predicate.
 *
 * @param {string} dir Directory to walk.
 * @param {(name: string) => boolean} matches Filename predicate.
 * @return {string[]} Absolute file paths.
 */
function collectFiles(dir, matches) {
	const out = [];
	if (!fs.existsSync(dir)) {
		return out;
	}
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...collectFiles(full, matches));
			continue;
		}
		if (entry.isFile() && matches(entry.name)) {
			out.push(full);
		}
	}
	return out;
}

/** Extract every raw `metadata.blockeraOne` stamp string from a source. */
function extractStamps(source) {
	const stamps = [];
	const stampRe = /"blockeraOne"\s*:\s*"([^"]*)"/g;
	let match;
	while ((match = stampRe.exec(source))) {
		stamps.push(match[1]);
	}
	return stamps;
}

/**
 * Parse a pattern PHP file into headers + raw stamps.
 *
 * @param {string} file Absolute file path.
 * @return {Object} Parsed pattern entry.
 */
function parsePatternFile(file) {
	const source = fs.readFileSync(file, 'utf8');
	const header = (re) => {
		const match = source.match(re);
		return match ? match[1].trim() : null;
	};

	return {
		file: path.relative(themeRoot, file),
		name: path.basename(file),
		// Type folder under patterns/ (e.g. "archive"); "patterns" itself
		// for files living at the patterns root.
		typeDir: path.basename(path.dirname(file)),
		slug: header(/^\s*\*\s*Slug:\s*(\S+)/m),
		categories: header(/^\s*\*\s*Categories:\s*(.+)$/m),
		inserter: header(/^\s*\*\s*Inserter:\s*(\S+)/m),
		stamps: extractStamps(source),
	};
}

const allPatterns = collectFiles(patternsRoot, (name) =>
	name.endsWith('.php')
).map(parsePatternFile);

/** WordPress template files also carry stamps (e.g. templates/archive.html). */
const templateEntries = collectFiles(templatesRoot, (name) =>
	name.endsWith('.html')
).map((file) => ({
	file: path.relative(themeRoot, file),
	stamps: extractStamps(fs.readFileSync(file, 'utf8')),
}));

const builderPatterns = allPatterns.filter((entry) =>
	entry.name.startsWith(BUILDER_PREFIX)
);

const layoutPatterns = builderPatterns.filter((entry) =>
	entry.name.includes(LAYOUT_MARKER)
);

/** Every file entry that carries stamps (patterns + templates). */
const stampedEntries = [...allPatterns, ...templateEntries].filter(
	(entry) => entry.stamps.length > 0
);

/** Every `Slug:` header registered by theme pattern files. */
const registeredSlugs = new Set();
for (const entry of allPatterns) {
	if (entry.slug) {
		registeredSlugs.add(entry.slug);
	}
}

/** patternSlug references from the shared fixture (kind: "pattern" rows). */
const fixtureSlugs = new Set();
for (const pools of Object.values(fixture)) {
	for (const variants of Object.values(pools)) {
		for (const variant of variants) {
			if ('pattern' === variant.kind && variant.patternSlug) {
				fixtureSlugs.add(variant.patternSlug);
			}
		}
	}
}

/** patternSlug references regex-swept from the PHP catalog sources. */
const catalogFiles = collectFiles(
	catalogsRoot,
	(name) => name.endsWith('Catalog.php') && 'AbstractCatalog.php' !== name
);
const phpCatalogSlugs = new Set();
for (const file of catalogFiles) {
	const source = fs.readFileSync(file, 'utf8');
	const slugRe = /'([a-z0-9-]+\/builder-[a-z0-9-]+)'/g;
	let match;
	while ((match = slugRe.exec(source))) {
		phpCatalogSlugs.add(match[1]);
	}
}

describe('templates-builder patterns lint', () => {
	// Broken globs must never pass silently (ported from the old CLI).
	describe('non-empty guards', () => {
		it('finds builder layout patterns', () => {
			expect(layoutPatterns.length).toBeGreaterThan(0);
		});

		it('finds stamped template files', () => {
			expect(templateEntries.length).toBeGreaterThan(0);
		});

		it('finds PHP type catalogs', () => {
			expect(catalogFiles.length).toBeGreaterThan(0);
		});

		it('finds patternSlug references in the PHP catalogs', () => {
			expect(phpCatalogSlugs.size).toBeGreaterThan(0);
		});

		it('finds pattern rows in the shared fixture', () => {
			expect(fixtureSlugs.size).toBeGreaterThan(0);
		});

		it('derives layout and area ids from the stamp dictionaries', () => {
			expect(layoutIds.size).toBeGreaterThan(0);
			expect(areaIds.size).toBeGreaterThan(0);
		});
	});

	describe('stamp dictionaries', () => {
		it('declares role/id entries (no variant) with kebab-case ids', () => {
			const invalid = [];
			for (const dictionary of STAMP_DICTIONARIES) {
				for (const entry of dictionary) {
					const match = entry.match(DICTIONARY_ENTRY_SHAPE);
					if (!match) {
						invalid.push(`malformed dictionary entry "${entry}"`);
						continue;
					}
					expect(STAMP_ROLES).toContain(match[1]);
					expect(match[2]).toMatch(KEBAB);
				}
			}
			expect(invalid).toEqual([]);
		});

		it('never declares an id in two dictionaries (globally unique ids)', () => {
			const seen = new Map();
			const conflicts = [];
			STAMP_DICTIONARIES.forEach((dictionary, index) => {
				for (const entry of dictionary) {
					const match = entry.match(DICTIONARY_ENTRY_SHAPE);
					if (!match) {
						continue;
					}
					const [, role, id] = match;
					if (seen.has(id)) {
						conflicts.push(
							`id "${id}" declared in dictionaries ${
								seen.get(id).index
							} and ${index} (entries "${
								seen.get(id).entry
							}" / "${entry}")`
						);
						continue;
					}
					seen.set(id, { index, entry, role });
				}
			});
			expect(conflicts).toEqual([]);
		});

		it('has no dead entries: every dictionary id is stamped in markup', () => {
			const usedIds = new Set();
			for (const entry of stampedEntries) {
				for (const stamp of entry.stamps) {
					const match = stamp.match(STAMP_SHAPE);
					if (match) {
						usedIds.add(match[2]);
					}
				}
			}
			const dead = Object.keys(ALL_STAMPS).filter(
				(id) => !usedIds.has(id)
			);
			expect(dead).toEqual([]);
		});
	});

	describe('stamp validation', () => {
		it('every stamp in patterns/templates is "role/id(:variant)" with a dictionary id + matching role', () => {
			const invalid = [];
			for (const entry of stampedEntries) {
				for (const stamp of entry.stamps) {
					const match = stamp.match(STAMP_SHAPE);
					if (!match) {
						invalid.push(
							`${entry.file}: malformed stamp "${stamp}"`
						);
						continue;
					}
					const [, role, id] = match;
					const dictionaryRole = ALL_STAMPS[id];
					if (!dictionaryRole) {
						invalid.push(
							`${entry.file}: stamp id "${id}" is not declared in any stamp dictionary`
						);
					} else if (dictionaryRole !== role) {
						invalid.push(
							`${entry.file}: stamp "${stamp}" uses role "${role}" but the dictionary declares "${dictionaryRole}"`
						);
					}
				}
			}
			expect(invalid).toEqual([]);
		});
	});

	describe('config <-> dictionary cross-checks', () => {
		it('registers every config layoutId with the layout role', () => {
			for (const config of CONFIGS) {
				expect(ALL_STAMPS[config.layoutId]).toBe('layout');
			}
		});

		it('targets, insert anchors, heuristics and sibling sections use dictionary ids', () => {
			const offenders = [];
			for (const config of CONFIGS) {
				const controls = flattenPanelControls(config.groups);
				for (const control of controls) {
					const { kind, id } = control.target;
					if (kind === 'section' && ALL_STAMPS[id] !== 'section') {
						offenders.push(
							`${config.type}/${control.id}: section target "${id}"`
						);
					}
					if (kind === 'layout' && ALL_STAMPS[id] !== 'layout') {
						offenders.push(
							`${config.type}/${control.id}: layout target "${id}"`
						);
					}
					// Insert anchors must be detectable stamps.
					if (
						control.insert &&
						!ALL_STAMPS[control.insert.relativeTo]
					) {
						offenders.push(
							`${config.type}/${control.id}: insert anchor "${control.insert.relativeTo}"`
						);
					}
				}
				for (const id of Object.keys(config.sectionHeuristics || {})) {
					if (!ALL_STAMPS[id]) {
						offenders.push(`${config.type}: heuristic key "${id}"`);
					}
				}
				for (const id of config.layoutSiblingSections || []) {
					if (ALL_STAMPS[id] !== 'section') {
						offenders.push(
							`${config.type}: sibling section "${id}"`
						);
					}
				}
			}
			expect(offenders).toEqual([]);
		});
	});

	describe('layout area consistency', () => {
		it('every layout pattern stamps a known layout id', () => {
			const missing = layoutPatterns
				.filter(
					(entry) =>
						!entry.stamps.some((stamp) => {
							const match = stamp.match(STAMP_SHAPE);
							return match && layoutIds.has(match[2]);
						})
				)
				.map((entry) => entry.file);
			expect(missing).toEqual([]);
		});

		it('every layout pattern exposes the required "content" area', () => {
			const missing = layoutPatterns
				.filter((entry) => !entry.stamps.includes('area/content'))
				.map((entry) => entry.file);
			expect(missing).toEqual([]);
		});

		it('layout variant stamps match the filename variant suffix', () => {
			// builder-layout-sidebar-right.php must stamp
			// layout/<layout-id>:sidebar-right on its layout root.
			const mismatched = [];
			for (const entry of layoutPatterns) {
				const fileVariant = entry.name
					.slice(
						entry.name.indexOf(LAYOUT_MARKER) + LAYOUT_MARKER.length
					)
					.replace(/\.php$/, '');
				let stampVariant = null;
				for (const stamp of entry.stamps) {
					const match = stamp.match(STAMP_SHAPE);
					if (match && layoutIds.has(match[2])) {
						stampVariant = match[3] || null;
						break;
					}
				}
				if (stampVariant !== fileVariant) {
					mismatched.push(
						`${entry.file}: stamp variant "${stampVariant}" != filename variant "${fileVariant}"`
					);
				}
			}
			expect(mismatched).toEqual([]);
		});
	});

	describe('header contract', () => {
		it('every builder pattern declares the builder category', () => {
			const offenders = builderPatterns
				.filter(
					(entry) =>
						!(entry.categories || '')
							.split(',')
							.map((category) => category.trim())
							.includes(BUILDER_CATEGORY)
				)
				.map((entry) => entry.file);
			expect(offenders).toEqual([]);
		});

		it('every builder pattern is hidden from the inserter', () => {
			const offenders = builderPatterns
				.filter((entry) => 'no' !== entry.inserter)
				.map((entry) => entry.file);
			expect(offenders).toEqual([]);
		});

		it('every builder pattern slug is shaped blockera-one/builder-<type>-… matching its folder', () => {
			const offenders = [];
			for (const entry of builderPatterns) {
				const expectedPrefix = `blockera-one/${BUILDER_PREFIX}${entry.typeDir}-`;
				if (!entry.slug || !entry.slug.startsWith(expectedPrefix)) {
					offenders.push(
						`${entry.file}: slug "${entry.slug}" must start with "${expectedPrefix}"`
					);
				}
			}
			expect(offenders).toEqual([]);
		});
	});

	describe('catalog <-> pattern files', () => {
		it('every fixture patternSlug maps to a pattern file Slug header', () => {
			const missing = [...fixtureSlugs].filter(
				(slug) => !registeredSlugs.has(slug)
			);
			expect(missing).toEqual([]);
		});

		it('every PHP catalog patternSlug maps to a pattern file Slug header', () => {
			const missing = [...phpCatalogSlugs].filter(
				(slug) => !registeredSlugs.has(slug)
			);
			expect(missing).toEqual([]);
		});

		it('every builder pattern file is referenced by a catalog (no orphans)', () => {
			const orphans = builderPatterns
				.filter(
					(entry) =>
						!fixtureSlugs.has(entry.slug) &&
						!phpCatalogSlugs.has(entry.slug)
				)
				.map((entry) => `${entry.file} (${entry.slug})`);
			expect(orphans).toEqual([]);
		});
	});
});
