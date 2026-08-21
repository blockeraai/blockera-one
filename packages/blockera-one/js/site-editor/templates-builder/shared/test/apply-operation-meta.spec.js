/**
 * applyOperation setMetaItemPart / setMetaSeparator / setMetaItemsDesign.
 * The WP parse/serialize adapter is mocked with an internal markup map
 * so no @wordpress/blocks registration is needed.
 */

jest.mock('../blocks-adapter', () => {
	const markup = {};
	return {
		defaultOpsContext: {
			parse: (html) => JSON.parse(JSON.stringify(markup[html] ?? [])),
			serialize: () => '',
		},
		__setMarkup: (key, tree) => {
			markup[key] = tree;
		},
	};
});

import { apply } from './helpers/apply-operation-setup';
import { __setMarkup } from '../blocks-adapter';
import { getStamp } from '../metadata';
import { deriveMetaItemsDesign } from '../ops/meta';
import { findStampById } from '../stamp-lookup';
import { findStamp, stamped } from './helpers/block-fixtures';

describe('independent Post Meta instances', () => {
	it('toggling a Meta 2 child does not remove Meta 1 children', () => {
		__setMarkup('meta-2-author', [
			stamped(
				'core/group',
				'section/post-meta-2-author-name:default',
				{},
				[
					stamped(
						'core/post-author-name',
						'container/meta-item-block:default'
					),
				]
			),
		]);
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				stamped(
					'core/group',
					'section/post-meta-post-date:default',
					{},
					[
						stamped(
							'core/post-date',
							'container/meta-item-block:default'
						),
					]
				),
				stamped(
					'core/group',
					'section/post-meta-author-name:default',
					{},
					[
						stamped(
							'core/post-author-name',
							'container/meta-item-block:default'
						),
					]
				),
			]),
			stamped('core/group', 'section/post-meta-2:default', {}, [
				stamped(
					'core/group',
					'section/post-meta-2-post-date:default',
					{},
					[
						stamped(
							'core/post-date',
							'container/meta-item-block:default'
						),
					]
				),
			]),
		];
		const result = apply(
			{
				id: 'post-meta-2-author-name',
				type: 'toggle',
				label: 'Author Name',
				target: { kind: 'section', id: 'post-meta-2-author-name' },
				operation: 'toggleSection',
				variants: [
					{
						id: 'default',
						label: 'Author',
						html: 'meta-2-author',
					},
				],
				insert: {
					relativeTo: 'post-meta-2',
					position: 'inside-end',
				},
				innerOrder: {
					parentId: 'post-meta-2',
					ids: ['post-meta-2-author-name', 'post-meta-2-post-date'],
				},
			},
			true,
			{ blocks }
		);
		expect(
			findStamp(result.blocks, 'post-meta-author-name')
		).not.toBeNull();
		expect(findStamp(result.blocks, 'post-meta-post-date')).not.toBeNull();
		expect(
			findStamp(result.blocks, 'post-meta-2-author-name')
		).not.toBeNull();
		expect(
			findStamp(result.blocks, 'post-meta-2').block.innerBlocks.map(
				(b) => getStamp(b)?.id
			)
		).toEqual(['post-meta-2-post-date', 'post-meta-2-author-name']);
	});
});

describe('post meta wrapped items', () => {
	function metaWrapper(sectionId, name, inner = []) {
		return stamped('core/group', `section/${sectionId}:default`, {}, [
			...inner,
			stamped(name, 'container/meta-item-block:default'),
		]);
	}

	it('re-syncs bullet separators after toggling a child on', () => {
		__setMarkup('meta-tags', [
			metaWrapper('post-meta-tags', 'core/post-terms'),
		]);
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				metaWrapper('post-meta-author-name', 'core/post-author-name', [
					stamped(
						'core/paragraph',
						'container/meta-item-prefix:default',
						{ content: 'By' }
					),
				]),
				stamped('core/paragraph', 'container/meta-separator:default', {
					content: '\u2022',
				}),
				metaWrapper('post-meta-post-date', 'core/post-date', [
					stamped(
						'core/paragraph',
						'container/meta-item-prefix:default',
						{ content: 'Published:' }
					),
				]),
			]),
		];
		const result = apply(
			{
				id: 'post-meta-tags',
				type: 'toggle',
				label: 'Tags',
				target: { kind: 'section', id: 'post-meta-tags' },
				operation: 'toggleSection',
				variants: [{ id: 'default', label: 'Tags', html: 'meta-tags' }],
				insert: {
					relativeTo: 'post-meta',
					position: 'inside-end',
				},
				innerOrder: {
					parentId: 'post-meta',
					ids: [
						'post-meta-author-name',
						'post-meta-post-date',
						'post-meta-tags',
					],
				},
			},
			true,
			{ blocks }
		);
		expect(
			findStamp(result.blocks, 'post-meta').block.innerBlocks.map(
				(b) => getStamp(b)?.id
			)
		).toEqual([
			'post-meta-author-name',
			'meta-separator',
			'post-meta-post-date',
			'meta-separator',
			'post-meta-tags',
		]);
		const tags = findStamp(result.blocks, 'post-meta-tags').block;
		expect(
			tags.innerBlocks.find(
				(child) => getStamp(child)?.id === 'meta-item-prefix'
			).attributes.content
		).toBe('Tagged');
	});

	it('re-syncs separators after reordering meta children', () => {
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				metaWrapper('post-meta-author-name', 'core/post-author-name'),
				stamped('core/paragraph', 'container/meta-separator:default', {
					content: '/',
				}),
				metaWrapper('post-meta-post-date', 'core/post-date'),
			]),
		];
		const result = apply(
			{
				id: 'reorder-post-meta',
				type: 'button',
				label: '',
				target: { kind: 'section', id: 'post-meta' },
				operation: 'reorderInnerSections',
				innerOrder: {
					parentId: 'post-meta',
					ids: ['post-meta-author-name', 'post-meta-post-date'],
				},
			},
			['post-meta-post-date', 'post-meta-author-name'],
			{ blocks }
		);
		expect(
			findStamp(result.blocks, 'post-meta').block.innerBlocks.map(
				(b) => getStamp(b)?.id
			)
		).toEqual([
			'post-meta-post-date',
			'meta-separator',
			'post-meta-author-name',
		]);
		expect(
			findStamp(result.blocks, 'post-meta').block.innerBlocks[1]
				.attributes.content
		).toBe('/');
	});

	it('writes isLink onto the inner meta-item-block', () => {
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				metaWrapper('post-meta-post-date', 'core/post-date'),
			]),
		];
		const result = apply(
			{
				id: 'post-meta-post-date-is-link',
				type: 'toggle',
				label: 'Link to post',
				target: { kind: 'container', id: 'meta-item-block' },
				operation: 'setSectionAttribute',
				attributePath: 'isLink',
				defaultValue: true,
				innerOrder: { parentId: 'post-meta-post-date', ids: [] },
			},
			false,
			{ blocks }
		);
		expect(
			findStamp(result.blocks, 'meta-item-block').block.attributes.isLink
		).toBe(false);
		expect(
			findStamp(result.blocks, 'post-meta-post-date').block.attributes
				.isLink
		).toBeUndefined();
	});

	it('dispatches setMetaSeparator and setMetaItemsDesign', () => {
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				metaWrapper('post-meta-author-name', 'core/post-author-name'),
				metaWrapper('post-meta-post-date', 'core/post-date'),
			]),
		];
		const sep = apply(
			{
				id: 'post-meta-separator',
				type: 'toggle-select',
				label: 'Separator',
				target: { kind: 'section', id: 'post-meta' },
				operation: 'setMetaSeparator',
				defaultValue: 'bullet',
			},
			'slash',
			{ blocks }
		);
		expect(
			findStamp(sep.blocks, 'post-meta').block.innerBlocks.map(
				(b) => getStamp(b)?.id
			)
		).toEqual([
			'post-meta-author-name',
			'meta-separator',
			'post-meta-post-date',
		]);
		expect(
			findStamp(sep.blocks, 'meta-separator').block.attributes.content
		).toBe('/');

		const design = apply(
			{
				id: 'post-meta-items-design',
				type: 'toggle-select',
				label: 'Items Design',
				target: { kind: 'section', id: 'post-meta' },
				operation: 'setMetaItemsDesign',
				defaultValue: 'labels',
			},
			'labels',
			{ blocks }
		);
		expect(
			findStamp(
				design.blocks,
				'post-meta-author-name'
			).block.innerBlocks.find(
				(child) => getStamp(child)?.id === 'meta-item-prefix'
			).attributes.content
		).toBe('By');
	});

	it('dispatches setMetaItemPart for prefix and empty icon', () => {
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				metaWrapper('post-meta-author-name', 'core/post-author-name'),
			]),
		];
		const prefixed = apply(
			{
				id: 'post-meta-author-name-prefix',
				type: 'input',
				label: 'Prefix',
				target: { kind: 'section', id: 'post-meta-author-name' },
				operation: 'setMetaItemPart',
				attributePath: 'prefix',
			},
			'By',
			{ blocks }
		);
		expect(
			findStamp(prefixed.blocks, 'meta-item-prefix').block.attributes
				.content
		).toBe('By');

		const cleared = apply(
			{
				id: 'post-meta-author-name-prefix',
				type: 'input',
				label: 'Prefix',
				target: { kind: 'section', id: 'post-meta-author-name' },
				operation: 'setMetaItemPart',
				attributePath: 'prefix',
			},
			'',
			{ blocks: prefixed.blocks }
		);
		expect(findStamp(cleared.blocks, 'meta-item-prefix')).toBeNull();
	});

	it('rejects unknown meta ops and separator none', () => {
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				metaWrapper('post-meta-author-name', 'core/post-author-name'),
				stamped('core/paragraph', 'container/meta-separator:default', {
					content: '\u2022',
				}),
				metaWrapper('post-meta-post-date', 'core/post-date'),
			]),
		];
		expect(
			apply(
				{
					id: 'post-meta-author-name-prefix',
					type: 'input',
					target: { kind: 'section', id: 'post-meta-author-name' },
					operation: 'setMetaItemPart',
					attributePath: 'block',
				},
				'x'
			)
		).toBeNull();
		expect(
			apply(
				{
					id: 'post-meta-items-design',
					type: 'toggle-select',
					target: { kind: 'section', id: 'post-meta' },
					operation: 'setMetaItemsDesign',
				},
				'fancy'
			)
		).toBeNull();
		const none = apply(
			{
				id: 'post-meta-separator',
				type: 'toggle-select',
				target: { kind: 'section', id: 'post-meta' },
				operation: 'setMetaSeparator',
			},
			'none',
			{ blocks }
		);
		expect(
			findStamp(none.blocks, 'post-meta').block.innerBlocks.map(
				(b) => getStamp(b)?.id
			)
		).toEqual(['post-meta-author-name', 'post-meta-post-date']);
	});

	it('rebuilds separators after toggling a child off', () => {
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				metaWrapper('post-meta-author-name', 'core/post-author-name'),
				stamped('core/paragraph', 'container/meta-separator:default', {
					content: '/',
				}),
				metaWrapper('post-meta-post-date', 'core/post-date'),
				stamped('core/paragraph', 'container/meta-separator:default', {
					content: '/',
				}),
				metaWrapper('post-meta-tags', 'core/post-terms'),
			]),
		];
		const result = apply(
			{
				id: 'post-meta-tags',
				type: 'toggle',
				label: 'Tags',
				target: { kind: 'section', id: 'post-meta-tags' },
				operation: 'toggleSection',
				insert: {
					relativeTo: 'post-meta',
					position: 'inside-end',
				},
				innerOrder: {
					parentId: 'post-meta',
					ids: [
						'post-meta-author-name',
						'post-meta-post-date',
						'post-meta-tags',
					],
				},
			},
			false,
			{ blocks }
		);
		expect(
			findStamp(result.blocks, 'post-meta').block.innerBlocks.map(
				(b) => getStamp(b)?.id
			)
		).toEqual([
			'post-meta-author-name',
			'meta-separator',
			'post-meta-post-date',
		]);
		expect(findStamp(result.blocks, 'post-meta-tags')).toBeNull();
	});

	it('does not apply article Items Design to page-header Post Meta', () => {
		const labeledItem = stamped(
			'core/group',
			'section/post-meta-author-name:default',
			{},
			[
				stamped(
					'core/paragraph',
					'container/meta-item-prefix:default',
					{
						content: 'By',
					}
				),
				stamped(
					'core/post-author-name',
					'container/meta-item-block:default'
				),
			]
		);
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped('core/group', 'container/body:default', {}, [
					stamped('core/group', 'section/post-meta:default', {}, [
						labeledItem,
					]),
				]),
			]),
			stamped('core/group', 'section/article:default', {}, [
				stamped('core/group', 'container/body:default', {}, [
					stamped('core/group', 'section/post-meta:default', {}, [
						JSON.parse(JSON.stringify(labeledItem)),
					]),
				]),
			]),
		];
		const result = apply(
			{
				id: 'post-meta-items-design',
				type: 'toggle-select',
				target: { kind: 'section', id: 'post-meta' },
				operation: 'setMetaItemsDesign',
				innerOrder: {
					parentId: 'post-meta',
					ids: [],
					within: 'article',
				},
			},
			'icons',
			{ blocks }
		);
		expect(
			deriveMetaItemsDesign(
				result.blocks,
				'post-meta',
				undefined,
				undefined,
				{ within: 'page-header' }
			)
		).toBe('labels');
		expect(
			deriveMetaItemsDesign(
				result.blocks,
				'post-meta',
				undefined,
				undefined,
				{ within: 'article' }
			)
		).toBe('icons');
		expect(
			findStampById(result.blocks, 'post-meta', { within: 'page-header' })
				.path
		).not.toEqual(
			findStampById(result.blocks, 'post-meta', { within: 'article' })
				.path
		);
	});
});
