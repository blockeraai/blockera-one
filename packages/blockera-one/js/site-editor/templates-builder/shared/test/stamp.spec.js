/**
 * stamp.ts + metadata.ts: `role/id:variant` stamp grammar and the
 * metadata.blockeraOne.stamp read/write helpers.
 */

import { formatStamp, parseStamp, stampDictionaryToMap } from '../stamp';
import {
	getBlockeraOneMeta,
	getMetaName,
	getStamp,
	withBlockeraOneMeta,
	withStamp,
} from '../metadata';

describe('parseStamp', () => {
	it('parses role/id and role/id:variant stamps', () => {
		expect(parseStamp('area/content')).toEqual({
			role: 'area',
			id: 'content',
		});
		expect(parseStamp('section/posts-listing:grid-2')).toEqual({
			role: 'section',
			id: 'posts-listing',
			variant: 'grid-2',
		});
		expect(parseStamp('layout/main:no-sidebar')).toEqual({
			role: 'layout',
			id: 'main',
			variant: 'no-sidebar',
		});
		expect(parseStamp('container/chrome-rail:vertical-rail')).toEqual({
			role: 'container',
			id: 'chrome-rail',
			variant: 'vertical-rail',
		});
	});

	it('rejects role-less and legacy id@variant stamps', () => {
		expect(parseStamp('content')).toBeNull();
		expect(parseStamp('posts-listing@grid-2')).toBeNull();
		expect(parseStamp('section/posts-listing@grid-2')).toBeNull();
	});

	it('rejects unknown roles and malformed separators', () => {
		expect(parseStamp('widget/content')).toBeNull();
		expect(parseStamp('a/b/c')).toBeNull();
		expect(parseStamp('section/a:b:c')).toBeNull();
		expect(parseStamp('section/')).toBeNull();
		expect(parseStamp('section/content:')).toBeNull();
		expect(parseStamp('/content')).toBeNull();
		expect(parseStamp(':variant')).toBeNull();
	});

	it('rejects values outside the kebab-case grammar', () => {
		expect(parseStamp('')).toBeNull();
		expect(parseStamp('area/Content')).toBeNull();
		expect(parseStamp('area/has space')).toBeNull();
		expect(parseStamp(42)).toBeNull();
		expect(parseStamp(null)).toBeNull();
		expect(parseStamp({ role: 'area', id: 'content' })).toBeNull();
	});
});

describe('formatStamp', () => {
	it('formats with and without a variant', () => {
		expect(formatStamp('area', 'content')).toBe('area/content');
		expect(formatStamp('area', 'content', null)).toBe('area/content');
		expect(formatStamp('section', 'posts-listing', 'list')).toBe(
			'section/posts-listing:list'
		);
	});
});

describe('stampDictionaryToMap', () => {
	it('maps role/id entries to id → role', () => {
		expect(
			stampDictionaryToMap([
				'area/content',
				'section/header',
				'layout/main',
			])
		).toEqual({
			content: 'area',
			header: 'section',
			main: 'layout',
		});
	});

	it('skips malformed and variant-bearing entries', () => {
		expect(
			stampDictionaryToMap([
				'area/content',
				'section/posts-listing:list',
				'not-a-stamp',
				'widget/x',
			])
		).toEqual({ content: 'area' });
	});
});

describe('getStamp', () => {
	it('reads a valid stamp from metadata.blockeraOne.stamp', () => {
		expect(
			getStamp({
				name: 'core/group',
				attributes: {
					metadata: {
						blockeraOne: { stamp: 'layout/main:no-sidebar' },
					},
				},
			})
		).toEqual({
			role: 'layout',
			id: 'main',
			variant: 'no-sidebar',
		});
	});

	it('returns null for missing/invalid metadata or blocks', () => {
		expect(getStamp(null)).toBeNull();
		expect(getStamp(undefined)).toBeNull();
		expect(getStamp({ name: 'core/group' })).toBeNull();
		expect(
			getStamp({ name: 'core/group', attributes: { metadata: 'str' } })
		).toBeNull();
		expect(
			getStamp({
				name: 'core/group',
				attributes: { metadata: { blockeraOne: 'NOT VALID' } },
			})
		).toBeNull();
		expect(
			getStamp({
				name: 'core/group',
				attributes: {
					metadata: { blockeraOne: { stamp: 'NOT VALID' } },
				},
			})
		).toBeNull();
	});
});

describe('getMetaName', () => {
	it('reads a trimmed metadata.name', () => {
		expect(
			getMetaName({
				name: 'core/column',
				attributes: { metadata: { name: '  Media Column  ' } },
			})
		).toBe('Media Column');
	});

	it('returns empty when the name is missing or not a string', () => {
		expect(getMetaName(null)).toBe('');
		expect(getMetaName({ name: 'core/group' })).toBe('');
		expect(
			getMetaName({
				name: 'core/group',
				attributes: {
					metadata: { blockeraOne: { stamp: 'container/x' } },
				},
			})
		).toBe('');
		expect(
			getMetaName({
				name: 'core/group',
				attributes: { metadata: { name: 12 } },
			})
		).toBe('');
	});
});

describe('withStamp', () => {
	const original = {
		name: 'core/group',
		attributes: {
			className: 'keep',
			metadata: {
				name: 'Custom label',
				blockeraOne: { stamp: 'section/old:stamp' },
			},
		},
		innerBlocks: [
			{ name: 'core/paragraph', attributes: {}, innerBlocks: [] },
		],
	};

	it('re-stamps while preserving other attributes and metadata keys', () => {
		const stamped = withStamp(original, 'area', 'content');

		expect(stamped.attributes.metadata.blockeraOne).toEqual({
			stamp: 'area/content',
		});
		expect(stamped.attributes.metadata.name).toBe('Custom label');
		expect(stamped.attributes.className).toContain('keep');
		expect(stamped.attributes.className).toContain('blockera-block');
		expect(stamped.attributes.blockeraPropsId).toBeTruthy();
		expect(stamped.attributes.blockeraCompatId).toBeTruthy();
		// Input stays untouched.
		expect(original.attributes.metadata.blockeraOne).toEqual({
			stamp: 'section/old:stamp',
		});
	});

	it('formats role/id:variant and normalizes innerBlocks to a new array', () => {
		const stamped = withStamp(
			original,
			'section',
			'posts-listing',
			'grid-3'
		);

		expect(stamped.attributes.metadata.blockeraOne).toEqual({
			stamp: 'section/posts-listing:grid-3',
		});
		expect(stamped.innerBlocks).not.toBe(original.innerBlocks);
		expect(stamped.innerBlocks).toEqual(original.innerBlocks);

		const bare = withStamp({ name: 'core/spacer' }, 'section', 'x');
		expect(bare.innerBlocks).toEqual([]);
		expect(bare.attributes.metadata).toEqual({
			blockeraOne: { stamp: 'section/x' },
		});
	});

	it('keeps extra keys when restamping and drops metaParts', () => {
		const block = {
			name: 'core/group',
			attributes: {
				metadata: {
					blockeraOne: {
						stamp: 'section/old:stamp',
						metaParts: { prefix: 'By' },
						future: 1,
					},
				},
			},
			innerBlocks: [],
		};
		const stamped = withStamp(block, 'section', 'post-meta-author-name');
		expect(stamped.attributes.metadata.blockeraOne).toEqual({
			stamp: 'section/post-meta-author-name',
			future: 1,
		});
	});
});

describe('withBlockeraOneMeta', () => {
	const block = {
		name: 'core/group',
		attributes: {
			metadata: {
				blockeraOne: {
					stamp: 'section/post-meta:default',
					metaParts: { prefix: 'By' },
					metaSeparator: 'bullet',
				},
			},
		},
		innerBlocks: [],
	};

	it('never stores metaParts and drops keys patched to undefined', () => {
		const other = {
			name: 'core/group',
			attributes: {
				metadata: {
					blockeraOne: {
						stamp: 'section/article:default',
						metaParts: { prefix: 'By' },
						metaSeparator: 'bullet',
					},
				},
			},
			innerBlocks: [],
		};
		const cleared = withBlockeraOneMeta(other, {
			metaParts: {},
			metaSeparator: undefined,
		});
		expect(getBlockeraOneMeta(cleared)).toEqual({
			stamp: 'section/article:default',
		});
	});

	it('does not store metaParts on post-meta items', () => {
		const item = withStamp(
			{ name: 'core/group', attributes: {}, innerBlocks: [] },
			'section',
			'post-meta-author-name',
			'default'
		);
		expect(getBlockeraOneMeta(item)).toEqual({
			stamp: 'section/post-meta-author-name:default',
		});
	});

	it('always stores metaSeparator on post-meta rows', () => {
		const row = withStamp(
			{ name: 'core/group', attributes: {}, innerBlocks: [] },
			'section',
			'post-meta',
			'default'
		);
		expect(getBlockeraOneMeta(row)).toEqual({
			stamp: 'section/post-meta:default',
			metaSeparator: 'none',
		});
		const cleared = withBlockeraOneMeta(block, {
			metaParts: {},
			metaSeparator: undefined,
		});
		expect(getBlockeraOneMeta(cleared)).toEqual({
			stamp: 'section/post-meta:default',
			metaSeparator: 'none',
		});
	});

	it('never stores metaParts or metaSeparator on space fillers', () => {
		const filler = withBlockeraOneMeta(
			withStamp(
				{ name: 'core/paragraph', attributes: {}, innerBlocks: [] },
				'section',
				'post-meta-space-filler',
				'default'
			),
			{
				metaParts: { prefix: 'By' },
				metaSeparator: 'bullet',
			}
		);
		expect(getBlockeraOneMeta(filler)).toEqual({
			stamp: 'section/post-meta-space-filler:default',
		});
	});
});
