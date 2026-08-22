/**
 * Shared filesystem index for Templates Builder pattern / template lint specs.
 */

import fs from 'fs';
import path from 'path';

const {
	loadBlockMarkupConfig,
} = require('../../../../../../../global-packages/packages/dev-tools/js/block-markup/load-config');

export const themeRoot = path.resolve(__dirname, '..', '../../../../../../..');
export const fixture = require('../../../../../../php/tests/fixtures/template-builder-catalog.json');

const { patternsDirs, templatesDirs } = loadBlockMarkupConfig(
	{ quiet: true },
	themeRoot
);

export { patternsDirs, templatesDirs };

export const hasPatterns = patternsDirs.length > 0;
export const hasTemplates = templatesDirs.length > 0;
export const describePatterns = hasPatterns ? describe : describe.skip;
export const describeTemplates = hasTemplates ? describe : describe.skip;
export const describeMarkup =
	hasPatterns || hasTemplates ? describe : describe.skip;

export const catalogsRoot = path.join(
	themeRoot,
	'packages/blockera-one/php/Theme/TemplateBuilder'
);

export const BUILDER_PREFIX = 'builder-';
export const LAYOUT_MARKER = '-layout-';
export const BUILDER_CATEGORY = 'blockera-one/template-builder';
export const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STAMP_SHAPE =
	/^(layout|section|area|container)\/([a-z0-9-]+)(?::([a-z0-9-]+))?$/;
export const DICTIONARY_ENTRY_SHAPE =
	/^(layout|section|area|container)\/([a-z0-9-]+)$/;

/**
 * Recursively collect files matching a predicate.
 *
 * @param {string} dir Directory to walk.
 * @param {(name: string) => boolean} matches Filename predicate.
 * @return {string[]} Absolute file paths.
 */
export function collectFiles(dir, matches) {
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
export function extractStamps(source) {
	const stamps = [];
	const stampRe = /"blockeraOne"\s*:\s*"([^"]*)"/g;
	let match;
	while ((match = stampRe.exec(source))) {
		stamps.push(match[1]);
	}
	return stamps;
}

/**
 * Parse balanced `{...}` JSON starting at `openIdx`.
 *
 * @param {string} source File contents.
 * @param {number} openIdx Index of the opening `{`.
 * @return {{ json: Object|null, end: number }}
 */
function readJsonObject(source, openIdx) {
	let depth = 0;
	for (let i = openIdx; i < source.length; i++) {
		const ch = source[i];
		if (ch === '{') {
			depth++;
		} else if (ch === '}') {
			depth--;
			if (0 === depth) {
				const raw = source.slice(openIdx, i + 1);
				try {
					return { json: JSON.parse(raw), end: i + 1 };
				} catch {
					return { json: null, end: i + 1 };
				}
			}
		}
	}
	return { json: null, end: source.length };
}

/**
 * Every Gutenberg `metadata` object in a pattern/template source.
 *
 * @param {string} source File contents.
 * @return {Object[]} Parsed metadata objects.
 */
export function extractMetadataObjects(source) {
	const entries = [];
	const needle = '"metadata"';
	let cursor = 0;
	while (cursor < source.length) {
		const start = source.indexOf(needle, cursor);
		if (start === -1) {
			break;
		}
		const brace = source.indexOf('{', start);
		if (brace === -1) {
			break;
		}
		const { json, end } = readJsonObject(source, brace);
		if (json && typeof json === 'object') {
			entries.push(json);
		}
		cursor = end;
	}
	return entries;
}

/**
 * Parse a pattern PHP file into headers + raw stamps.
 *
 * @param {string} file Absolute file path.
 * @return {Object} Parsed pattern entry.
 */
export function parsePatternFile(file) {
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

export const allPatterns = patternsDirs.flatMap((dir) =>
	collectFiles(dir, (name) => name.endsWith('.php')).map(parsePatternFile)
);

export const templateEntries = templatesDirs.flatMap((dir) =>
	collectFiles(dir, (name) => name.endsWith('.html')).map((file) => ({
		file: path.relative(themeRoot, file),
		stamps: extractStamps(fs.readFileSync(file, 'utf8')),
	}))
);

export const builderPatterns = allPatterns.filter((entry) =>
	entry.name.startsWith(BUILDER_PREFIX)
);

export const layoutPatterns = builderPatterns.filter((entry) =>
	entry.name.includes(LAYOUT_MARKER)
);

export const stampedEntries = [...allPatterns, ...templateEntries].filter(
	(entry) => entry.stamps.length > 0
);

export const registeredSlugs = new Set();
for (const entry of allPatterns) {
	if (entry.slug) {
		registeredSlugs.add(entry.slug);
	}
}

export const fixtureSlugs = new Set();
for (const pools of Object.values(fixture)) {
	for (const variants of Object.values(pools)) {
		for (const variant of variants) {
			if ('pattern' === variant.kind && variant.patternSlug) {
				fixtureSlugs.add(variant.patternSlug);
			}
		}
	}
}

export const catalogFiles = collectFiles(
	catalogsRoot,
	(name) => name.endsWith('Catalog.php') && 'AbstractCatalog.php' !== name
);

export const phpCatalogSlugs = new Set();
for (const file of catalogFiles) {
	const source = fs.readFileSync(file, 'utf8');
	const slugRe = /'([a-z0-9-]+\/builder-[a-z0-9-]+)'/g;
	let match;
	while ((match = slugRe.exec(source))) {
		phpCatalogSlugs.add(match[1]);
	}
}
