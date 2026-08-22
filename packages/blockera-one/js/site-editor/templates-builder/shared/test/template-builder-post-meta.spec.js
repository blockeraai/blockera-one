/**
 * Post Meta pattern lint: List View names, space fillers, and row grow.
 */

import fs from 'fs';
import path from 'path';

import { isMetaRowId } from '../ops/meta/ids';
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
});
