/**
 * ops/meta: icon/prefix/suffix parts, separator rebuild, and
 * Items Design presets. Pure tree ops — no WP, no React.
 */

import { getStamp } from '../metadata';
import {
	META_ITEM_DEFAULTS,
	adoptMetaItemDesign,
	applyListingMetaItemsPreset,
	deriveMetaItemsDesign,
	ensureSpaceFiller,
	getMetaItemSuffix,
	getMetaRowIdForSection,
	isEmptyIconValue,
	isMetaRowId,
	isSpaceFillerId,
	readMetaItemPart,
	readMetaSeparatorOption,
	setMetaItemPart,
	setMetaItemsDesign,
	syncMetaSeparators,
} from '../ops/meta';
import {
	block,
	findStamp as find,
	row,
	stamped,
} from './helpers/block-fixtures';

function prefix(text) {
	return stamped('core/paragraph', 'container/meta-item-prefix:default', {
		content: text,
	});
}

function suffix(text) {
	return stamped('core/paragraph', 'container/meta-item-suffix:default', {
		content: text,
	});
}

function separator(text) {
	return stamped('core/paragraph', 'container/meta-separator:default', {
		content: text,
	});
}

function metaBlock(name = 'core/post-date') {
	return stamped(name, 'container/meta-item-block:default');
}

function iconBlock(icon = 'user', library = 'feather') {
	return stamped('core/icon', 'container/meta-item-icon:default', {
		blockeraIcon: {
			value: {
				icon,
				library,
				uploadSVG: '',
				svgString: '',
				renderedIcon: '',
			},
		},
		className: 'wp-block-icon-blockera',
		style: { dimensions: { width: '1em' } },
	});
}

function wrapper(sectionId, innerBlocks = [metaBlock()]) {
	return stamped(
		'core/group',
		`section/${sectionId}:default`,
		{},
		innerBlocks
	);
}

function filler(sectionId) {
	return stamped('core/paragraph', `section/${sectionId}:default`, {
		blockeraFlexChildSizing: { value: 'grow' },
		blockeraWidth: { value: 'stretch' },
		className: 'blockera-block blockera-block-filler',
		content: '\u00a0',
	});
}

function idsOf(node) {
	return (node.innerBlocks || []).map((child) => getStamp(child)?.id);
}

const AUTHOR = 'post-meta-author-name';
const DATE = 'post-meta-post-date';
const TAGS = 'post-meta-tags';
const FILLER = 'post-meta-space-filler';
const FILLER_2 = 'post-meta-space-filler-2';

describe('setMetaItemPart', () => {
	it('inserts prefix/suffix/icon at canonical order and parks live values', () => {
		let tree = [
			row([wrapper(AUTHOR, [metaBlock('core/post-author-name')])]),
		];

		tree = setMetaItemPart(tree, {
			sectionId: AUTHOR,
			part: 'suffix',
			value: 'end',
		});
		tree = setMetaItemPart(tree, {
			sectionId: AUTHOR,
			part: 'icon',
			value: { icon: 'user', library: 'feather' },
		});
		tree = setMetaItemPart(tree, {
			sectionId: AUTHOR,
			part: 'prefix',
			value: 'By',
		});

		const inner = find(tree, AUTHOR).block.innerBlocks;
		expect(inner.map((child) => getStamp(child)?.id)).toEqual([
			'meta-item-icon',
			'meta-item-prefix',
			'meta-item-block',
			'meta-item-suffix',
		]);
		expect(inner[0].name).toBe('core/icon');
		expect(inner[0].attributes.className).toContain(
			'wp-block-icon-blockera'
		);
		expect(inner[0].attributes.className).toContain('blockera-block');
		expect(inner[0].attributes.blockeraPropsId).toBeTruthy();
		expect(inner[0].attributes.blockeraCompatId).toBeTruthy();
		expect(inner[1].attributes.className).toContain('blockera-block');
		expect(inner[1].attributes.blockeraPropsId).toBeTruthy();
		expect(inner[0].attributes.style.dimensions.width).toBe('1em');
		expect(inner[0].attributes.blockeraIcon.value.icon).toBe('user');
		expect(inner[1].attributes.content).toBe('By');
		expect(inner[3].attributes.content).toBe('end');
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe('By');
		expect(readMetaItemPart(tree, AUTHOR, 'suffix')).toBe('end');
		expect(readMetaItemPart(tree, AUTHOR, 'icon')).toMatchObject({
			icon: 'user',
			library: 'feather',
		});
	});

	it('removes empty parts and parks the previous value', () => {
		let tree = [
			row([
				wrapper(AUTHOR, [
					prefix('Written by'),
					metaBlock('core/post-author-name'),
				]),
			]),
		];
		tree = setMetaItemPart(tree, {
			sectionId: AUTHOR,
			part: 'prefix',
			value: '',
		});
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe('');
		expect(idsOf(find(tree, AUTHOR).block)).toEqual(['meta-item-block']);
		expect(
			find(tree, AUTHOR).block.attributes.metadata.blockeraOneMetaParts
				.prefix
		).toBe('Written by');
	});
});

describe('syncMetaSeparators', () => {
	function twoItems(sepText) {
		const inner = [
			wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
			wrapper(DATE),
		];
		if (sepText) {
			inner.splice(1, 0, separator(sepText));
		}
		return [row(inner)];
	}

	it.each([
		['slash', '/'],
		['dash', '\u2014'],
		['bullet', '\u2022'],
	])('rebuilds %s separators between adjacent items', (option, char) => {
		const tree = syncMetaSeparators(twoItems(), 'post-meta', option);
		const inner = find(tree, 'post-meta').block.innerBlocks;
		expect(idsOf({ innerBlocks: inner })).toEqual([
			AUTHOR,
			'meta-separator',
			DATE,
		]);
		expect(inner[1].attributes.content).toBe(char);
		expect(inner[1].originalContent).toBe(`<p>${char}</p>`);
		expect(readMetaSeparatorOption(tree, 'post-meta')).toBe(option);
	});

	it('none removes every separator', () => {
		const tree = syncMetaSeparators(
			twoItems('\u2022'),
			'post-meta',
			'none'
		);
		expect(idsOf(find(tree, 'post-meta').block)).toEqual([AUTHOR, DATE]);
		expect(readMetaSeparatorOption(tree, 'post-meta')).toBe('none');
	});

	it('returns null when the separator character is not a known option', () => {
		const tree = twoItems('|');
		expect(readMetaSeparatorOption(tree, 'post-meta')).toBeNull();
	});

	it('re-syncs after reorder and preserves the current character', () => {
		const tree = syncMetaSeparators(
			[
				row([
					wrapper(DATE),
					wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
				]),
			],
			'post-meta',
			'bullet'
		);
		expect(idsOf(find(tree, 'post-meta').block)).toEqual([
			DATE,
			'meta-separator',
			AUTHOR,
		]);
		expect(
			find(tree, 'post-meta').block.innerBlocks[1].attributes.content
		).toBe('\u2022');
	});

	it('never places a separator next to either Space Filler', () => {
		const tree = syncMetaSeparators(
			[
				row([
					wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
					filler(FILLER),
					wrapper(DATE),
					filler(FILLER_2),
					wrapper(TAGS, [metaBlock('core/post-terms')]),
				]),
			],
			'post-meta',
			'bullet'
		);
		expect(idsOf(find(tree, 'post-meta').block)).toEqual([
			AUTHOR,
			FILLER,
			DATE,
			FILLER_2,
			TAGS,
		]);
		expect(find(tree, FILLER).block.name).toBe('core/paragraph');
		expect(
			find(tree, FILLER).block.attributes.blockeraFlexChildSizing
		).toEqual({ value: 'grow' });
		expect(find(tree, FILLER).block.attributes.blockeraWidth).toEqual({
			value: 'stretch',
		});
		expect(readMetaSeparatorOption(tree, 'post-meta')).toBe('bullet');
	});

	it('keeps the separator setting after a filler splits two items, then restores glyphs', () => {
		let tree = syncMetaSeparators(
			[
				row([
					wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
					wrapper(DATE),
				]),
			],
			'post-meta',
			'slash'
		);
		const withSlash = find(tree, 'post-meta').block;
		tree = syncMetaSeparators(
			[
				{
					...withSlash,
					innerBlocks: [
						wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
						filler(FILLER),
						wrapper(DATE),
					],
				},
			],
			'post-meta'
		);
		expect(idsOf(find(tree, 'post-meta').block)).toEqual([
			AUTHOR,
			FILLER,
			DATE,
		]);
		expect(readMetaSeparatorOption(tree, 'post-meta')).toBe('slash');
		const split = find(tree, 'post-meta').block;
		tree = syncMetaSeparators(
			[
				{
					...split,
					innerBlocks: [
						wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
						filler(FILLER),
						wrapper(DATE),
						wrapper(TAGS, [metaBlock('core/post-terms')]),
					],
				},
			],
			'post-meta'
		);
		expect(idsOf(find(tree, 'post-meta').block)).toEqual([
			AUTHOR,
			FILLER,
			DATE,
			'meta-separator',
			TAGS,
		]);
		expect(readMetaSeparatorOption(tree, 'post-meta')).toBe('slash');
	});

	it('ensures a space filler has stretch width and one space', () => {
		const tree = ensureSpaceFiller(
			[
				row([
					stamped('core/paragraph', `section/${FILLER}:default`, {
						content: '',
					}),
				]),
			],
			FILLER
		);
		const block = find(tree, FILLER).block;
		expect(block.attributes.blockeraFlexChildSizing).toEqual({
			value: 'grow',
		});
		expect(block.attributes.blockeraWidth).toEqual({ value: 'stretch' });
		expect(block.attributes.content).toBe('\u00a0');
		expect(block.originalContent).toBe('<p>&nbsp;</p>');
		expect(block.attributes.blockeraPropsId).toBeTruthy();
		expect(block.attributes.blockeraCompatId).toBeTruthy();
		expect(block.attributes.className).toContain('blockera-block');
		expect(block.attributes.className).toContain(
			`blockera-block-${block.attributes.blockeraCompatId}`
		);
	});

	it('keeps separators between non-filler neighbors around a filler', () => {
		const tree = syncMetaSeparators(
			[
				row([
					wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
					wrapper(DATE),
					filler(FILLER),
					wrapper(TAGS, [metaBlock('core/post-terms')]),
				]),
			],
			'post-meta',
			'slash'
		);
		expect(idsOf(find(tree, 'post-meta').block)).toEqual([
			AUTHOR,
			'meta-separator',
			DATE,
			FILLER,
			TAGS,
		]);
	});
});

describe('setMetaItemsDesign', () => {
	function labeledRow() {
		return [
			row([
				wrapper(AUTHOR, [
					prefix('By'),
					metaBlock('core/post-author-name'),
				]),
				separator('\u2022'),
				wrapper(DATE, [prefix('Published:'), metaBlock()]),
			]),
		];
	}

	it('Simple removes icon, prefix, and suffix from every item', () => {
		const tree = setMetaItemsDesign(labeledRow(), 'post-meta', 'simple');
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe('');
		expect(readMetaItemPart(tree, DATE, 'prefix')).toBe('');
		expect(deriveMetaItemsDesign(tree, 'post-meta')).toBe('simple');
	});

	it('Labels applies default prefixes and removes icons', () => {
		const tree = setMetaItemsDesign(
			[
				row([
					wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
					wrapper(DATE),
					wrapper(TAGS, [metaBlock('core/post-terms')]),
				]),
			],
			'post-meta',
			'labels'
		);
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe(
			META_ITEM_DEFAULTS['author-name'].labels.prefix
		);
		expect(readMetaItemPart(tree, DATE, 'prefix')).toBe(
			META_ITEM_DEFAULTS['post-date'].labels.prefix
		);
		expect(readMetaItemPart(tree, TAGS, 'prefix')).toBe(
			META_ITEM_DEFAULTS.tags.labels.prefix
		);
		expect(isEmptyIconValue(readMetaItemPart(tree, AUTHOR, 'icon'))).toBe(
			true
		);
		expect(deriveMetaItemsDesign(tree, 'post-meta')).toBe('labels');
	});

	it('Icons applies default wp icons and removes prefixes', () => {
		const tree = setMetaItemsDesign(labeledRow(), 'post-meta', 'icons');
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe('');
		expect(readMetaItemPart(tree, AUTHOR, 'icon')).toMatchObject(
			META_ITEM_DEFAULTS['author-name'].icons.icon
		);
		expect(readMetaItemPart(tree, DATE, 'icon')).toMatchObject(
			META_ITEM_DEFAULTS['post-date'].icons.icon
		);
		expect(deriveMetaItemsDesign(tree, 'post-meta')).toBe('icons');
	});

	it('Labels config may include an icon; empty icon is omitted', () => {
		const previous = window.blockeraOneTemplateBuilder;
		window.blockeraOneTemplateBuilder = {
			metaItemsDesign: {
				default: {
					items: {
						...META_ITEM_DEFAULTS,
						'author-name': {
							...META_ITEM_DEFAULTS['author-name'],
							labels: {
								icon: {
									library: 'wp',
									icon: 'comment-author-avatar',
								},
								prefix: 'By',
								suffix: '.',
							},
						},
					},
				},
				listings: {},
			},
		};
		try {
			const withIcon = setMetaItemsDesign(
				[row([wrapper(AUTHOR, [metaBlock('core/post-author-name')])])],
				'post-meta',
				'labels'
			);
			expect(readMetaItemPart(withIcon, AUTHOR, 'prefix')).toBe('By');
			expect(readMetaItemPart(withIcon, AUTHOR, 'suffix')).toBe('.');
			expect(readMetaItemPart(withIcon, AUTHOR, 'icon')).toMatchObject({
				library: 'wp',
				icon: 'comment-author-avatar',
			});
			expect(deriveMetaItemsDesign(withIcon, 'post-meta')).toBe('labels');

			const withoutIcon = setMetaItemsDesign(
				[row([wrapper(AUTHOR, [metaBlock('core/post-author-name')])])],
				'post-meta',
				'simple'
			);
			expect(
				isEmptyIconValue(readMetaItemPart(withoutIcon, AUTHOR, 'icon'))
			).toBe(true);
			expect(readMetaItemPart(withoutIcon, AUTHOR, 'prefix')).toBe('');
		} finally {
			window.blockeraOneTemplateBuilder = previous;
		}
	});

	it('parks a custom prefix through Labels → Icons → Labels', () => {
		let tree = [
			row([
				wrapper(AUTHOR, [
					prefix('Written by'),
					metaBlock('core/post-author-name'),
				]),
			]),
		];
		tree = setMetaItemsDesign(tree, 'post-meta', 'icons');
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe('');
		tree = setMetaItemsDesign(tree, 'post-meta', 'labels');
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe('Written by');
	});

	it('skips Space Fillers', () => {
		const tree = setMetaItemsDesign(
			[
				row([
					wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
					filler(FILLER),
				]),
			],
			'post-meta',
			'labels'
		);
		expect(idsOf(find(tree, FILLER).block)).toEqual([]);
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe('By');
	});

	it('returns null for mixed custom items', () => {
		const tree = [
			row([
				wrapper(AUTHOR, [
					prefix('By'),
					metaBlock('core/post-author-name'),
				]),
				wrapper(DATE, [iconBlock('calendar'), metaBlock()]),
			]),
		];
		expect(deriveMetaItemsDesign(tree, 'post-meta')).toBeNull();
	});

	it('adopts the current row design onto a newly enabled item', () => {
		const tree = adoptMetaItemDesign(
			[
				row([
					wrapper(AUTHOR, [
						prefix('By'),
						metaBlock('core/post-author-name'),
					]),
					wrapper(TAGS, [metaBlock('core/post-terms')]),
				]),
			],
			TAGS
		);
		expect(readMetaItemPart(tree, TAGS, 'prefix')).toBe(
			META_ITEM_DEFAULTS.tags.labels.prefix
		);
		expect(deriveMetaItemsDesign(tree, 'post-meta')).toBe('labels');
	});

	it('applies Labels and Icons defaults for every known meta item', () => {
		const ids = Object.keys(META_ITEM_DEFAULTS).map(
			(suffix) => `post-meta-${suffix}`
		);
		const labeled = setMetaItemsDesign(
			[row(ids.map((id) => wrapper(id)))],
			'post-meta',
			'labels'
		);
		const icons = setMetaItemsDesign(
			[row(ids.map((id) => wrapper(id)))],
			'post-meta',
			'icons'
		);
		for (const [suffix, defaults] of Object.entries(META_ITEM_DEFAULTS)) {
			const id = `post-meta-${suffix}`;
			expect(readMetaItemPart(labeled, id, 'prefix')).toBe(
				defaults.labels.prefix
			);
			expect(readMetaItemPart(icons, id, 'icon')).toMatchObject(
				defaults.icons.icon
			);
		}
	});

	it('skips adopt when siblings are mixed or the target is a filler', () => {
		const mixed = adoptMetaItemDesign(
			[
				row([
					wrapper(AUTHOR, [
						prefix('By'),
						metaBlock('core/post-author-name'),
					]),
					wrapper(DATE, [iconBlock('calendar'), metaBlock()]),
					wrapper(TAGS, [metaBlock('core/post-terms')]),
				]),
			],
			TAGS
		);
		expect(readMetaItemPart(mixed, TAGS, 'prefix')).toBe('');
		expect(readMetaItemPart(mixed, TAGS, 'icon')).toMatchObject({
			icon: '',
		});
		const fillerTree = adoptMetaItemDesign(
			[row([wrapper(AUTHOR, [prefix('By')]), filler(FILLER)])],
			FILLER
		);
		expect(idsOf(find(fillerTree, FILLER).block)).toEqual([]);
	});

	it('adopts Icons onto a newly enabled item', () => {
		const tree = adoptMetaItemDesign(
			[
				row([
					wrapper(AUTHOR, [
						iconBlock('user'),
						metaBlock('core/post-author-name'),
					]),
					wrapper(TAGS, [metaBlock('core/post-terms')]),
				]),
			],
			TAGS
		);
		expect(readMetaItemPart(tree, TAGS, 'icon')).toMatchObject(
			META_ITEM_DEFAULTS.tags.icons.icon
		);
	});

	it('merges listing item overlays onto the shared defaults', () => {
		const previous = window.blockeraOneTemplateBuilder;
		window.blockeraOneTemplateBuilder = {
			metaItemsDesign: {
				default: { items: META_ITEM_DEFAULTS },
				listings: {
					'section/posts-listing:full-width': {
						preset: 'labels',
						items: {
							'author-name': {
								labels: {
									icon: '',
									prefix: 'Written by',
									suffix: '',
								},
							},
						},
					},
				},
			},
		};
		try {
			const tree = applyListingMetaItemsPreset([
				stamped('core/query', 'section/posts-listing:full-width', {}, [
					row([
						wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
					]),
				]),
			]);
			expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe('Written by');
			expect(
				isEmptyIconValue(readMetaItemPart(tree, AUTHOR, 'icon'))
			).toBe(true);
		} finally {
			window.blockeraOneTemplateBuilder = previous;
		}
	});

	it('applies Icons for full-width and leaves listings without a preset', () => {
		const fullWidth = applyListingMetaItemsPreset([
			stamped('core/query', 'section/posts-listing:full-width', {}, [
				row([wrapper(DATE, [metaBlock()])]),
			]),
		]);
		expect(readMetaItemPart(fullWidth, DATE, 'icon')).toMatchObject(
			META_ITEM_DEFAULTS['post-date'].icons.icon
		);

		const list = [
			stamped('core/query', 'section/posts-listing:list', {}, [
				row([wrapper(DATE, [metaBlock()])]),
			]),
		];
		expect(applyListingMetaItemsPreset(list)).toBe(list);
		expect(isEmptyIconValue(readMetaItemPart(list, DATE, 'icon'))).toBe(
			true
		);
	});
});

describe('meta item id helpers and no-ops', () => {
	it('maps item stamps to the matching row without prefix collisions', () => {
		expect(isMetaRowId('post-meta')).toBe(true);
		expect(isMetaRowId('post-meta-2')).toBe(true);
		expect(getMetaRowIdForSection('post-meta-2-author-name')).toBe(
			'post-meta-2'
		);
		expect(getMetaRowIdForSection('post-meta-author-name')).toBe(
			'post-meta'
		);
		expect(getMetaItemSuffix('post-meta-2-space-filler-2')).toBe(
			'space-filler-2'
		);
		expect(isSpaceFillerId('post-meta-2-space-filler')).toBe(true);
		expect(getMetaRowIdForSection('post-title')).toBeNull();
	});

	it('no-ops when the wrapper or row is missing', () => {
		expect(
			setMetaItemPart([], {
				sectionId: AUTHOR,
				part: 'prefix',
				value: 'By',
			})
		).toEqual([]);
		expect(syncMetaSeparators([], 'post-meta', 'bullet')).toEqual([]);
		expect(setMetaItemsDesign([], 'post-meta', 'labels')).toEqual([]);
		expect(readMetaItemPart([], AUTHOR, 'prefix')).toBe('');
		expect(readMetaItemPart([], AUTHOR, 'icon')).toMatchObject({
			icon: '',
			library: '',
		});
		expect(readMetaSeparatorOption([], 'post-meta')).toBe('none');
		expect(deriveMetaItemsDesign([], 'post-meta')).toBe('simple');
	});

	it('derives Labels when prefix content is a rich-text object', () => {
		const tree = [
			row([
				wrapper(DATE, [
					stamped(
						'core/paragraph',
						'container/meta-item-prefix:default',
						{ content: { text: 'Published:' } }
					),
					metaBlock(),
				]),
			]),
		];
		expect(readMetaItemPart(tree, DATE, 'prefix')).toBe('Published:');
		expect(deriveMetaItemsDesign(tree, 'post-meta')).toBe('labels');
	});

	it('reads a rich-text separator character', () => {
		const tree = [
			row([
				wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
				stamped('core/paragraph', 'container/meta-separator:default', {
					content: { text: '\u2022' },
				}),
				wrapper(DATE),
			]),
		];
		expect(readMetaSeparatorOption(tree, 'post-meta')).toBe('bullet');
	});

	it('treats whitespace prefix and empty icon objects as removals', () => {
		let tree = [
			row([
				wrapper(AUTHOR, [
					prefix('By'),
					iconBlock('user'),
					metaBlock('core/post-author-name'),
				]),
			]),
		];
		tree = setMetaItemPart(tree, {
			sectionId: AUTHOR,
			part: 'prefix',
			value: '   ',
		});
		tree = setMetaItemPart(tree, {
			sectionId: AUTHOR,
			part: 'icon',
			value: { icon: '', library: '', uploadSVG: '' },
		});
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe('');
		expect(isEmptyIconValue(readMetaItemPart(tree, AUTHOR, 'icon'))).toBe(
			true
		);
		expect(idsOf(find(tree, AUTHOR).block)).toEqual(['meta-item-block']);
	});

	it('sets core/icon for the wp library and parks suffix/icon round trips', () => {
		let tree = [
			row([wrapper(AUTHOR, [metaBlock('core/post-author-name')])]),
		];
		tree = setMetaItemPart(tree, {
			sectionId: AUTHOR,
			part: 'icon',
			value: { icon: 'star', library: 'wp' },
		});
		expect(find(tree, 'meta-item-icon').block.attributes.icon).toBe(
			'core/star'
		);
		tree = setMetaItemPart(tree, {
			sectionId: AUTHOR,
			part: 'suffix',
			value: 'says',
		});
		tree = setMetaItemsDesign(tree, 'post-meta', 'simple');
		tree = setMetaItemsDesign(tree, 'post-meta', 'icons');
		expect(readMetaItemPart(tree, AUTHOR, 'icon')).toMatchObject({
			icon: 'star',
			library: 'wp',
		});
		tree = setMetaItemsDesign(tree, 'post-meta', 'labels');
		expect(readMetaItemPart(tree, AUTHOR, 'prefix')).toBe(
			META_ITEM_DEFAULTS['author-name'].labels.prefix
		);
		expect(
			find(tree, AUTHOR).block.attributes.metadata.blockeraOneMetaParts
				.suffix
		).toBe('says');
	});
});

describe('separator edge cases', () => {
	it('does not insert a separator for a single item', () => {
		const tree = syncMetaSeparators(
			[row([wrapper(AUTHOR, [metaBlock('core/post-author-name')])])],
			'post-meta',
			'bullet'
		);
		expect(idsOf(find(tree, 'post-meta').block)).toEqual([AUTHOR]);
	});

	it('rebuilds with the live custom character when no option is passed', () => {
		const tree = syncMetaSeparators(
			[
				row([
					wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
					separator('|'),
					wrapper(DATE),
				]),
			],
			'post-meta'
		);
		expect(idsOf(find(tree, 'post-meta').block)).toEqual([
			AUTHOR,
			'meta-separator',
			DATE,
		]);
		expect(
			find(tree, 'post-meta').block.innerBlocks[1].attributes.content
		).toBe('|');
		expect(readMetaSeparatorOption(tree, 'post-meta')).toBeNull();
	});

	it('keeps post-meta-2 separators independent of post-meta', () => {
		const tree = syncMetaSeparators(
			[
				row(
					[
						wrapper(AUTHOR, [metaBlock('core/post-author-name')]),
						wrapper(DATE),
					],
					'post-meta'
				),
				row(
					[
						wrapper('post-meta-2-author-name', [
							metaBlock('core/post-author-name'),
						]),
						wrapper('post-meta-2-post-date'),
					],
					'post-meta-2'
				),
			],
			'post-meta-2',
			'dash'
		);
		expect(idsOf(find(tree, 'post-meta').block)).toEqual([AUTHOR, DATE]);
		expect(idsOf(find(tree, 'post-meta-2').block)).toEqual([
			'post-meta-2-author-name',
			'meta-separator',
			'post-meta-2-post-date',
		]);
		expect(readMetaSeparatorOption(tree, 'post-meta-2')).toBe('dash');
		expect(
			find(tree, 'post-meta-2').block.innerBlocks[1].originalContent
		).toBe('<p>\u2014</p>');
		expect(readMetaSeparatorOption(tree, 'post-meta')).toBe('none');
	});

	it('wraps a void post-date section before Labels can insert a prefix', () => {
		const tree = setMetaItemsDesign(
			[
				row([
					stamped(
						'core/post-date',
						'section/post-meta-post-date:default',
						{ isLink: true }
					),
				]),
			],
			'post-meta',
			'labels'
		);
		const item = find(tree, DATE).block;
		expect(item.name).toBe('core/group');
		expect(idsOf(item)).toEqual(['meta-item-prefix', 'meta-item-block']);
		expect(item.innerBlocks[1].name).toBe('core/post-date');
		expect(getStamp(item.innerBlocks[1]).id).toBe('meta-item-block');
		expect(readMetaItemPart(tree, DATE, 'prefix')).toBe(
			META_ITEM_DEFAULTS['post-date'].labels.prefix
		);
	});

	it('wraps a void post-date section before Icons can insert an icon', () => {
		const tree = setMetaItemsDesign(
			[
				row([
					stamped(
						'core/post-date',
						'section/post-meta-post-date:default',
						{ isLink: true }
					),
				]),
			],
			'post-meta',
			'icons'
		);
		const item = find(tree, DATE).block;
		expect(item.name).toBe('core/group');
		expect(idsOf(item)).toEqual(['meta-item-icon', 'meta-item-block']);
		expect(readMetaItemPart(tree, DATE, 'icon')).toMatchObject(
			META_ITEM_DEFAULTS['post-date'].icons.icon
		);
	});
});

describe('META_ITEM_DEFAULTS catalog drift', () => {
	const fixture = require('../../../../../php/tests/fixtures/template-builder-catalog.json');

	it('covers every post-meta item suffix in the catalog fixture', () => {
		const suffixes = new Set();
		for (const poolId of Object.keys(fixture.archive || {})) {
			if ('post-meta' === poolId || 'post-meta-2' === poolId) {
				continue;
			}
			let suffix = null;
			if (poolId.startsWith('post-meta-2-')) {
				suffix = poolId.slice('post-meta-2-'.length);
			} else if (poolId.startsWith('post-meta-')) {
				suffix = poolId.slice('post-meta-'.length);
			}
			if (suffix && !suffix.includes('space-filler')) {
				suffixes.add(suffix);
			}
		}
		const missing = [...suffixes].filter(
			(suffix) => !META_ITEM_DEFAULTS[suffix]
		);
		expect(missing).toEqual([]);
	});
});
