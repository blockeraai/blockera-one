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
 * - Stamps are validated in every `.patterns.config.js` `patternsDirs`
 *   folder (`patterns/**`, `patterns-woocommerce/**`, …) AND
 *   `templates/*.html` (all ship `metadata.blockeraOne` anchors).
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
import { flattenPanelControls } from '../resolve/resolve-options-panel';

const fixture = require('../../../../../php/tests/fixtures/template-builder-catalog.json');

const themeRoot = path.resolve(__dirname, '../../../../../../..');
const patternsConfig = require(path.join(themeRoot, '.patterns.config.js'));
const patternsDirs = (
	patternsConfig.patternsDirs ??
	patternsConfig.patternsDir ?? ['patterns']
).map((dir) => (path.isAbsolute(dir) ? dir : path.join(themeRoot, dir)));
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

// --- Filesystem index (patternsDirs + templates/* + catalogs) ---

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
		// Type folder under a patterns dir (e.g. "archive"); the dir name
		// itself for files living at that patterns root.
		typeDir: path.basename(path.dirname(file)),
		slug: header(/^\s*\*\s*Slug:\s*(\S+)/m),
		categories: header(/^\s*\*\s*Categories:\s*(.+)$/m),
		inserter: header(/^\s*\*\s*Inserter:\s*(\S+)/m),
		stamps: extractStamps(source),
	};
}

const allPatterns = patternsDirs.flatMap((dir) =>
	collectFiles(dir, (name) => name.endsWith('.php')).map(parsePatternFile)
);

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

		it('finds pattern PHP files in every configured patterns directory', () => {
			const empty = patternsDirs.filter(
				(dir) =>
					collectFiles(dir, (name) => name.endsWith('.php'))
						.length === 0
			);
			expect(empty.map((dir) => path.relative(themeRoot, dir))).toEqual(
				[]
			);
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
			// Inner-region slots are opt-in per template. They belong in
			// the shared dictionary so markup can stamp them; they do
			// not have to appear in every (or any current) pattern.
			// Meta item suffix is inserted by builder ops. The icon stamp
			// is also baked into full-width listing markup.
			const optInInnerSlots = new Set([
				'start',
				'end',
				'comments',
				'meta-item-icon',
				'meta-item-suffix',
			]);
			const dead = Object.keys(ALL_STAMPS).filter(
				(id) => !usedIds.has(id) && !optInInnerSlots.has(id)
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
					if (
						kind === 'container' &&
						ALL_STAMPS[id] !== 'container'
					) {
						offenders.push(
							`${config.type}/${control.id}: container target "${id}"`
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
				if (!entry.slug) {
					offenders.push(`${entry.file}: missing Slug header`);
					continue;
				}
				const folderPrefix = `blockera-one/${BUILDER_PREFIX}${entry.typeDir}`;
				if (
					entry.slug !== folderPrefix &&
					!entry.slug.startsWith(`${folderPrefix}-`)
				) {
					offenders.push(
						`${entry.file}: slug "${entry.slug}" must be "${folderPrefix}" or start with "${folderPrefix}-"`
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

	describe('blockeraCompatId uniqueness', () => {
		it('is unique within each builder pattern file', () => {
			const offenders = [];
			for (const entry of builderPatterns) {
				const source = fs.readFileSync(
					path.join(themeRoot, entry.file),
					'utf8'
				);
				const counts = new Map();
				const idRe = /"blockeraCompatId"\s*:\s*"([^"]+)"/g;
				let match;
				while ((match = idRe.exec(source))) {
					const id = match[1];
					counts.set(id, (counts.get(id) || 0) + 1);
				}
				for (const [id, count] of counts) {
					if (count > 1) {
						offenders.push(
							`${entry.file}: "${id}" appears ${count} times`
						);
					}
				}
			}
			expect(offenders).toEqual([]);
		});
	});

	describe('loop-item parent metadata.name', () => {
		const LOOP_PARENT_STAMPS = new Set([
			'container/media',
			'container/body',
		]);
		const LOOP_PARENT_NAMES = {
			'builder-listing-full-width.php': {
				'container/media': 'Media Column',
				'container/body': 'Content Column',
			},
			'builder-listing-grid-2.php': {
				'container/body': 'Content Blocks',
			},
			'builder-listing-grid-3.php': {
				'container/body': 'Content Blocks',
			},
			'builder-listing-list.php': {
				'container/body': 'Content Blocks',
			},
		};

		function extractLoopParentNames(source) {
			const names = {};
			const metaRe = /"metadata"\s*:\s*\{([^}]*)\}/g;
			let match;
			while ((match = metaRe.exec(source))) {
				const body = match[1];
				const name = body.match(/"name"\s*:\s*"([^"]*)"/);
				const stamp = body.match(/"blockeraOne"\s*:\s*"([^"]*)"/);
				if (name && stamp && LOOP_PARENT_STAMPS.has(stamp[1])) {
					names[stamp[1]] = name[1];
				}
			}
			return names;
		}

		it('uses Media Column / Content Column / Content Blocks on listing parents', () => {
			const mismatches = [];
			for (const [fileName, expected] of Object.entries(
				LOOP_PARENT_NAMES
			)) {
				const entry = builderPatterns.find(
					(pattern) => pattern.name === fileName
				);
				if (!entry) {
					mismatches.push(`missing pattern file ${fileName}`);
					continue;
				}
				const source = fs.readFileSync(
					path.join(themeRoot, entry.file),
					'utf8'
				);
				const actual = extractLoopParentNames(source);
				expect(actual).toEqual(expected);
			}
			expect(mismatches).toEqual([]);
		});
	});

	describe('post-meta space fillers', () => {
		it('are grow paragraphs, not flex rows', () => {
			const fillers = builderPatterns.filter((entry) =>
				entry.name.includes('space-filler')
			);
			expect(fillers.length).toBe(4);
			for (const entry of fillers) {
				const source = fs.readFileSync(
					path.join(themeRoot, entry.file),
					'utf8'
				);
				expect(source).toContain('wp:paragraph');
				expect(source).toContain(
					'"blockeraFlexChildSizing":{"value":"grow"}'
				);
				expect(source).toContain('"blockeraWidth":{"value":"stretch"}');
				expect(source).toContain('\\u{00A0}');
				expect(source).not.toContain('<p></p>');
				expect(source).not.toContain('wp:group');
			}
		});

		it('parent meta rows use flex-child grow and stretch width', () => {
			const stamps = [
				'section/post-meta:default',
				'section/post-meta-2:default',
			];
			const rowEntries = stampedEntries.filter((entry) =>
				entry.stamps.some((stamp) => stamps.includes(stamp))
			);
			expect(rowEntries.length).toBeGreaterThan(0);
			for (const entry of rowEntries) {
				const source = fs.readFileSync(
					path.join(themeRoot, entry.file),
					'utf8'
				);
				const expected = stamps.filter((stamp) =>
					source.includes(`"blockeraOne":"${stamp}"`)
				);
				expect(expected.length).toBeGreaterThan(0);
				for (const stamp of expected) {
					const idx = source.indexOf(`"blockeraOne":"${stamp}"`);
					expect(idx).toBeGreaterThan(-1);
					const window = source.slice(idx, idx + 500);
					expect(window).toContain(
						'"blockeraFlexChildSizing":{"value":"grow"}'
					);
					expect(window).toContain(
						'"blockeraWidth":{"value":"stretch"}'
					);
				}
			}
		});
	});
});
