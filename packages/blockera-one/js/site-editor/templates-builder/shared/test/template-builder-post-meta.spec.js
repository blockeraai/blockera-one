/**
 * Post Meta pattern lint: List View names, space fillers, and row grow.
 */

import fs from 'fs';
import path from 'path';

import {
	getMetaRowIdForSection,
	isMetaRowId,
	isSpaceFillerId,
} from '../ops/meta/ids';
import { META_ITEM_PART_IDS, META_SEPARATOR_ID } from '../ops/meta/constants';
import {
	getMetaItemListName,
	META_PART_LIST_NAMES,
	META_ROW_LIST_NAME,
} from '../ops/meta/names';
import {
	builderPatterns,
	describePatterns,
	extractMetadataObjects,
	STAMP_SHAPE,
	stampedEntries,
	themeRoot,
} from './helpers/pattern-lint';

const ROW_STAMPS = new Set([
	'section/post-meta:default',
	'section/post-meta-2:default',
]);

const PART_NAMES = {
	'meta-item-prefix': META_PART_LIST_NAMES.prefix,
	'meta-item-icon': META_PART_LIST_NAMES.icon,
	'meta-item-suffix': META_PART_LIST_NAMES.suffix,
	'meta-separator': META_PART_LIST_NAMES.separator,
};

function isPostMetaSectionStamp(stamp) {
	const match = stamp.match(STAMP_SHAPE);
	if (!match || 'section' !== match[1]) {
		return false;
	}
	const id = match[2];
	return id === 'post-meta' || id.startsWith('post-meta-');
}

function isPostMetaItemId(id) {
	return (
		!!getMetaRowIdForSection(id) && !isMetaRowId(id) && !isSpaceFillerId(id)
	);
}

function stampFromCommentBody(body) {
	const match = body.match(/"blockeraOne"\s*:\s*"([^"]*)"/);
	if (!match) {
		return null;
	}
	const parsed = match[1].match(STAMP_SHAPE);
	if (!parsed) {
		return null;
	}
	return parsed[2];
}

/**
 * Nest Gutenberg serializer comments so row/item checks can see children.
 * Attribute JSON is not fully parsed — PHP-in-attrs comments still nest.
 *
 * @param {string} source Pattern PHP/HTML.
 * @return {Object[]} Root serialized nodes `{ id, children }`.
 */
function parseSerializedBlocks(source) {
	const root = { id: '', children: [] };
	const stack = [root];
	let cursor = 0;

	while (cursor < source.length) {
		const start = source.indexOf('<!--', cursor);
		if (start === -1) {
			break;
		}
		const end = source.indexOf('-->', start + 4);
		if (end === -1) {
			break;
		}
		const body = source.slice(start + 4, end).trim();
		cursor = end + 3;

		if (body.startsWith('/wp:')) {
			if (stack.length > 1) {
				const node = stack.pop();
				node.inner = source.slice(node.innerStart, start);
			}
			continue;
		}
		if (!body.startsWith('wp:')) {
			continue;
		}
		const selfClosing = /\/$/.test(body);
		const stampId = stampFromCommentBody(body);
		const node = {
			id: stampId || '',
			children: [],
			innerStart: cursor,
			inner: '',
		};
		stack[stack.length - 1].children.push(node);
		if (!selfClosing) {
			stack.push(node);
		}
	}

	return root.children;
}

function walkSerialized(nodes, visit) {
	for (const node of nodes) {
		visit(node);
		if (node.children.length > 0) {
			walkSerialized(node.children, visit);
		}
	}
}

function descendantHasId(node, id) {
	for (const child of node.children) {
		if (child.id === id || descendantHasId(child, id)) {
			return true;
		}
	}
	return false;
}

function descendantHasItem(node) {
	for (const child of node.children) {
		if (isPostMetaItemId(child.id) || descendantHasItem(child)) {
			return true;
		}
	}
	return false;
}

/**
 * Visible separator glyph. Literal HTML or a non-empty i18n string argument
 * counts; whitespace-only and `&nbsp;` do not.
 *
 * @param {string} inner Markup between the paragraph comments.
 * @return {boolean} True when the separator has a real character.
 */
function separatorHasText(inner) {
	if (!inner) {
		return false;
	}
	const translated = inner.match(
		/(?:esc_html_e|esc_html__|esc_attr_e|esc_attr__|_e|__)\s*\(\s*(['"])((?:\\.|[^\\])*?)\1/
	);
	if (translated) {
		return translated[2].replace(/\\./g, '.').trim().length > 0;
	}
	const paragraph = inner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
	if (!paragraph) {
		return false;
	}
	const text = paragraph[1]
		.replace(/<\?php[\s\S]*?\?>/g, '')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/gi, '')
		.replace(/\u00a0/g, '')
		.trim();
	return text.length > 0;
}

/**
 * @param {string} inner Markup between the paragraph comments.
 * @return {boolean} True when separator copy is wrapped for translation.
 */
function separatorUsesI18n(inner) {
	return /(?:esc_html_e|esc_html__|esc_attr_e|esc_attr__|_e|__)\s*\(/.test(
		inner || ''
	);
}

describe('templates-builder post-meta patterns lint', () => {
	describePatterns('space fillers', () => {
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
			const stamps = [...ROW_STAMPS];
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

	describePatterns('List View metadata.name', () => {
		it('uses the canonical names for items, parts, rows, and fillers', () => {
			const offenders = [];
			const phpEntries = stampedEntries.filter((entry) =>
				entry.file.endsWith('.php')
			);

			for (const entry of phpEntries) {
				const source = fs.readFileSync(
					path.join(themeRoot, entry.file),
					'utf8'
				);
				const metas = extractMetadataObjects(source);
				for (const meta of metas) {
					const stamp =
						typeof meta.blockeraOne === 'string'
							? meta.blockeraOne
							: '';
					if (!stamp) {
						continue;
					}
					const match = stamp.match(STAMP_SHAPE);
					if (!match) {
						continue;
					}
					const id = match[2];
					const name = typeof meta.name === 'string' ? meta.name : '';

					if (id === 'meta-item-block') {
						if (name) {
							offenders.push(
								`${entry.file}: inner meta-item-block must be unnamed, got "${name}"`
							);
						}
						continue;
					}

					const partName = PART_NAMES[id];
					if (partName) {
						if (name !== partName) {
							offenders.push(
								`${entry.file}: stamp ${stamp} name "${name}" != "${partName}"`
							);
						}
						continue;
					}

					if (!isPostMetaSectionStamp(stamp)) {
						continue;
					}

					if (isMetaRowId(id)) {
						if (name !== META_ROW_LIST_NAME) {
							offenders.push(
								`${entry.file}: stamp ${stamp} name "${name}" != "${META_ROW_LIST_NAME}"`
							);
						}
						continue;
					}

					const expected = getMetaItemListName(id);
					if (!expected) {
						offenders.push(
							`${entry.file}: no List View name for stamp ${stamp}`
						);
						continue;
					}
					if (name !== expected) {
						offenders.push(
							`${entry.file}: stamp ${stamp} name "${name}" != "${expected}"`
						);
					}
				}
			}

			expect(offenders).toEqual([]);
		});
	});

	describePatterns('structure', () => {
		function phpEntriesWithSource() {
			const out = [];
			for (const entry of stampedEntries) {
				if (!entry.file.endsWith('.php')) {
					continue;
				}
				out.push({
					file: entry.file,
					tree: parseSerializedBlocks(
						fs.readFileSync(
							path.join(themeRoot, entry.file),
							'utf8'
						)
					),
				});
			}
			return out;
		}

		it('every Post Meta row contains at least one post-meta item', () => {
			const offenders = [];
			let rows = 0;
			for (const entry of phpEntriesWithSource()) {
				walkSerialized(entry.tree, (node) => {
					if (!isMetaRowId(node.id)) {
						return;
					}
					rows += 1;
					if (!descendantHasItem(node)) {
						offenders.push(
							`${entry.file}: ${node.id} has no post-meta item`
						);
					}
				});
			}
			expect(rows).toBeGreaterThan(0);
			expect(offenders).toEqual([]);
		});

		it('every post-meta item contains its main meta-item-block', () => {
			const offenders = [];
			let items = 0;
			for (const entry of phpEntriesWithSource()) {
				walkSerialized(entry.tree, (node) => {
					if (!isPostMetaItemId(node.id)) {
						return;
					}
					items += 1;
					if (!descendantHasId(node, META_ITEM_PART_IDS.block)) {
						offenders.push(
							`${entry.file}: ${node.id} is missing container/meta-item-block`
						);
					}
				});
			}
			expect(items).toBeGreaterThan(0);
			expect(offenders).toEqual([]);
		});

		it('does not put a separator beside a space filler', () => {
			const offenders = [];
			for (const entry of phpEntriesWithSource()) {
				walkSerialized(entry.tree, (node) => {
					if (!isMetaRowId(node.id)) {
						return;
					}
					const kids = node.children;
					let hasSeparator = false;
					let hasFiller = false;
					for (let i = 0; i < kids.length; i++) {
						if (kids[i].id === META_SEPARATOR_ID) {
							hasSeparator = true;
						}
						if (isSpaceFillerId(kids[i].id)) {
							hasFiller = true;
						}
					}
					if (!hasSeparator || !hasFiller) {
						return;
					}
					for (let i = 0; i < kids.length; i++) {
						if (!isSpaceFillerId(kids[i].id)) {
							continue;
						}
						const prev = i > 0 ? kids[i - 1] : null;
						const next = i < kids.length - 1 ? kids[i + 1] : null;
						if (prev && prev.id === META_SEPARATOR_ID) {
							offenders.push(
								`${entry.file}: ${node.id} has a separator before ${kids[i].id}`
							);
						}
						if (next && next.id === META_SEPARATOR_ID) {
							offenders.push(
								`${entry.file}: ${node.id} has a separator after ${kids[i].id}`
							);
						}
					}
				});
			}
			expect(offenders).toEqual([]);
		});

		it('does not leave a separator with empty text', () => {
			const offenders = [];
			let separators = 0;
			for (const entry of phpEntriesWithSource()) {
				walkSerialized(entry.tree, (node) => {
					if (node.id !== META_SEPARATOR_ID) {
						return;
					}
					separators += 1;
					if (!separatorHasText(node.inner)) {
						offenders.push(
							`${entry.file}: meta-separator has empty text`
						);
					}
				});
			}
			expect(separators).toBeGreaterThan(0);
			expect(offenders).toEqual([]);
		});

		it('does not wrap separator text in PHP i18n', () => {
			const offenders = [];
			let separators = 0;
			for (const entry of phpEntriesWithSource()) {
				walkSerialized(entry.tree, (node) => {
					if (node.id !== META_SEPARATOR_ID) {
						return;
					}
					separators += 1;
					if (separatorUsesI18n(node.inner)) {
						offenders.push(
							`${entry.file}: meta-separator text must not be translatable`
						);
					}
				});
			}
			expect(separators).toBeGreaterThan(0);
			expect(offenders).toEqual([]);
		});
	});
});
