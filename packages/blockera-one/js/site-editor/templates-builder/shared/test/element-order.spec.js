/**
 * element-order.ts: derive list order from the live parent and remaining
 * config ids.
 */

import {
	findLiveParentStampId,
	getGroupInnerOrder,
	isSortableElementControl,
	normalizeElementOrder,
	overlayFrozenBuckets,
	overlayFrozenIds,
	partitionOffIdsToEnd,
	resolveBucketInsertParent,
	resolveDisplayBuckets,
	resolveElementBuckets,
	resolveElementOrder,
	resolveParentStampName,
} from '../element-order';
import { block, stamped } from './helpers/block-fixtures';

const RULE = {
	parentId: 'page-header',
	ids: [
		'page-header-title',
		'page-header-description',
		'page-header-breadcrumbs',
	],
};

function header(children, extraMeta = {}) {
	return [
		stamped(
			'core/group',
			'section/page-header:default',
			{ metadata: extraMeta },
			children
		),
	];
}

describe('resolveElementOrder', () => {
	it('reads live child stamps and appends missing config ids', () => {
		const blocks = header([
			stamped('core/query-title', 'section/page-header-title:default'),
			stamped(
				'core/term-description',
				'section/page-header-description:default'
			),
		]);
		expect(resolveElementOrder(blocks, RULE)).toEqual([
			'page-header-title',
			'page-header-description',
			'page-header-breadcrumbs',
		]);
	});

	it('follows a custom live order (canvas / previous drag in the tree)', () => {
		const blocks = header([
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
			stamped('core/query-title', 'section/page-header-title:default'),
			stamped(
				'core/term-description',
				'section/page-header-description:default'
			),
		]);
		expect(resolveElementOrder(blocks, RULE)).toEqual([
			'page-header-breadcrumbs',
			'page-header-title',
			'page-header-description',
		]);
	});

	it('ignores leftover inner-order metadata and follows live children', () => {
		const blocks = header(
			[
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			],
			{
				blockeraOneInnerOrder: [
					'page-header-breadcrumbs',
					'page-header-title',
					'page-header-description',
				],
			}
		);
		expect(resolveElementOrder(blocks, RULE)).toEqual([
			'page-header-title',
			'page-header-description',
			'page-header-breadcrumbs',
		]);
	});

	it('falls back to config ids when the parent is missing', () => {
		expect(resolveElementOrder([], RULE)).toEqual(RULE.ids);
	});
});

describe('normalizeElementOrder', () => {
	it('dedupes, drops unknown ids, and appends missing config ids', () => {
		expect(
			normalizeElementOrder(
				['page-header-breadcrumbs', 'page-header-breadcrumbs', 'nope'],
				RULE.ids
			)
		).toEqual([
			'page-header-breadcrumbs',
			'page-header-title',
			'page-header-description',
		]);
	});
});

describe('group helpers', () => {
	it('reads innerOrder from the first sortable control', () => {
		expect(
			getGroupInnerOrder({
				id: 'elements',
				title: 'Elements',
				sortable: true,
				controls: [
					{
						id: 'page-header-title',
						type: 'toggle',
						label: 'Title',
						target: { kind: 'section', id: 'page-header-title' },
						operation: 'toggleSection',
						innerOrder: RULE,
						nestedPanel: {
							id: 'title',
							title: 'Title',
							groups: [],
						},
					},
				],
			})
		).toEqual(RULE);
	});

	it('detects toggle + nestedPanel + innerOrder rows', () => {
		expect(
			isSortableElementControl({
				id: 'page-header-title',
				type: 'toggle',
				label: 'Title',
				target: { kind: 'section', id: 'page-header-title' },
				operation: 'toggleSection',
				innerOrder: RULE,
				nestedPanel: { id: 'title', title: 'Title', groups: [] },
			})
		).toBe(true);
		expect(
			isSortableElementControl({
				id: 'page-header-gap',
				type: 'input',
				label: 'Gap',
				target: { kind: 'section', id: 'page-header' },
				operation: 'setSectionAttribute',
			})
		).toBe(false);
	});
});

const LOOP_RULE = {
	parentId: 'body',
	within: 'posts-listing',
	bucketParents: ['media', 'body'],
	ids: [
		'post-featured-image',
		'post-title',
		'post-excerpt',
		'post-content',
		'post-read-more',
		'post-meta',
		'post-meta-2',
	],
};

function fullWidthLoop() {
	return [
		stamped('core/query', 'section/posts-listing:full-width', {}, [
			block('core/post-template', {}, [
				block('core/columns', {}, [
					stamped(
						'core/column',
						'container/media',
						{ metadata: { name: 'Media' } },
						[
							stamped(
								'core/post-featured-image',
								'section/post-featured-image:default'
							),
						]
					),
					stamped(
						'core/column',
						'container/body',
						{ metadata: { name: 'Body' } },
						[
							stamped(
								'core/post-title',
								'section/post-title:default'
							),
							stamped(
								'core/post-excerpt',
								'section/post-excerpt:default'
							),
							stamped('core/group', 'section/post-meta:default'),
						]
					),
				]),
			]),
		]),
	];
}

describe('resolveElementBuckets', () => {
	it('splits live stamps by immediate parent in document order', () => {
		expect(resolveElementBuckets(fullWidthLoop(), LOOP_RULE)).toEqual([
			{ parentId: 'media', ids: ['post-featured-image'] },
			{
				parentId: 'body',
				ids: [
					'post-title',
					'post-excerpt',
					'post-meta',
					'post-content',
					'post-read-more',
					'post-meta-2',
				],
			},
		]);
	});

	it('reads listing buckets under posts-listing, not the page-header body', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped(
					'core/group',
					'container/body',
					{ metadata: { name: 'Header Body' } },
					[
						stamped(
							'core/query-title',
							'section/page-header-title:default'
						),
					]
				),
			]),
			...fullWidthLoop(),
		];
		expect(resolveElementBuckets(blocks, LOOP_RULE)).toEqual([
			{ parentId: 'media', ids: ['post-featured-image'] },
			{
				parentId: 'body',
				ids: [
					'post-title',
					'post-excerpt',
					'post-meta',
					'post-content',
					'post-read-more',
					'post-meta-2',
				],
			},
		]);
		expect(
			resolveParentStampName(blocks, 'body', {
				within: 'posts-listing',
				parentId: 'body',
			})
		).toBe('Body');
	});

	it('assigns off items to the last existing parent', () => {
		const blocks = fullWidthLoop();
		const content = blocks[0].innerBlocks[0].innerBlocks[0].innerBlocks[1];
		content.innerBlocks = content.innerBlocks.filter(
			(child) =>
				child.attributes.metadata.blockeraOne !==
				'section/post-excerpt:default'
		);
		const buckets = resolveElementBuckets(blocks, LOOP_RULE);
		expect(buckets[0].ids).toEqual(['post-featured-image']);
		expect(buckets[1].ids).toContain('post-excerpt');
	});

	it('falls back to a single parent when bucketParents is empty', () => {
		expect(resolveElementBuckets(header([]), RULE)).toEqual([
			{
				parentId: 'page-header',
				ids: [
					'page-header-title',
					'page-header-description',
					'page-header-breadcrumbs',
				],
			},
		]);
	});
});

describe('resolveParentStampName', () => {
	it('reads the live metadata.name on a stamped parent', () => {
		expect(resolveParentStampName(fullWidthLoop(), 'media')).toBe('Media');
		expect(resolveParentStampName(fullWidthLoop(), 'body')).toBe('Body');
	});

	it('returns empty when the parent is missing or unnamed', () => {
		expect(resolveParentStampName(fullWidthLoop(), 'missing-parent')).toBe(
			''
		);
		expect(resolveParentStampName(header([]), 'page-header')).toBe('');
	});

	it('reads Body from a single-parent listing', () => {
		const grid = [
			stamped('core/query', 'section/posts-listing:grid-2', {}, [
				block('core/post-template', {}, [
					stamped(
						'core/group',
						'container/body',
						{ metadata: { name: 'Body' } },
						[]
					),
				]),
			]),
		];
		expect(resolveParentStampName(grid, 'body')).toBe('Body');
	});
});

describe('partitionOffIdsToEnd / overlayFrozenBuckets', () => {
	const isOn = (id) => id === 'post-content' || id === 'post-meta';

	it('keeps on/off relative order and moves off items to the end', () => {
		expect(
			partitionOffIdsToEnd(
				[
					'post-title',
					'post-excerpt',
					'post-content',
					'post-read-more',
					'post-meta',
					'post-meta-2',
				],
				isOn
			)
		).toEqual([
			'post-content',
			'post-meta',
			'post-title',
			'post-excerpt',
			'post-read-more',
			'post-meta-2',
		]);
	});

	it('partitions each bucket without moving ids across parents', () => {
		const resolved = [
			{ parentId: 'media', ids: ['post-featured-image'] },
			{
				parentId: 'body',
				ids: [
					'post-title',
					'post-excerpt',
					'post-content',
					'post-read-more',
					'post-meta',
					'post-meta-2',
				],
			},
		];
		const { buckets, seeded } = resolveDisplayBuckets(
			resolved,
			undefined,
			isOn
		);
		expect(seeded).toBe(true);
		expect(buckets).toEqual([
			{ parentId: 'media', ids: ['post-featured-image'] },
			{
				parentId: 'body',
				ids: [
					'post-content',
					'post-meta',
					'post-title',
					'post-excerpt',
					'post-read-more',
					'post-meta-2',
				],
			},
		]);
	});

	it('overlays a frozen id list the same way as a single bucket', () => {
		expect(
			overlayFrozenIds(
				['post-content', 'post-title', 'post-excerpt', 'post-meta'],
				['post-title', 'post-content', 'post-excerpt'],
				isOn
			)
		).toEqual(['post-title', 'post-content', 'post-excerpt', 'post-meta']);
	});

	it('keeps a frozen mixed order and appends new ids on-then-off', () => {
		const frozen = [
			{
				parentId: 'body',
				ids: ['post-title', 'post-content', 'post-excerpt'],
			},
		];
		expect(
			overlayFrozenBuckets(
				[
					{
						parentId: 'body',
						ids: [
							'post-content',
							'post-title',
							'post-excerpt',
							'post-meta',
							'post-meta-2',
						],
					},
				],
				frozen,
				isOn
			)
		).toEqual([
			{
				parentId: 'body',
				ids: [
					'post-title',
					'post-content',
					'post-excerpt',
					'post-meta',
					'post-meta-2',
				],
			},
		]);
	});

	it('keeps a frozen off item in media even when resolved leftover is body', () => {
		expect(
			overlayFrozenBuckets(
				[
					{ parentId: 'media', ids: ['post-featured-image'] },
					{
						parentId: 'body',
						ids: ['post-title', 'post-excerpt', 'post-content'],
					},
				],
				[
					{
						parentId: 'media',
						ids: ['post-title', 'post-featured-image'],
					},
					{
						parentId: 'body',
						ids: ['post-content', 'post-excerpt'],
					},
				],
				isOn
			)
		).toEqual([
			{
				parentId: 'media',
				ids: ['post-title', 'post-featured-image'],
			},
			{
				parentId: 'body',
				ids: ['post-content', 'post-excerpt'],
			},
		]);
	});
});

describe('findLiveParentStampId / resolveBucketInsertParent', () => {
	it('reads the stamped immediate parent', () => {
		expect(
			findLiveParentStampId(fullWidthLoop(), 'post-featured-image')
		).toBe('media');
		expect(findLiveParentStampId(fullWidthLoop(), 'post-title')).toBe(
			'body'
		);
	});

	it('inserts into the last existing parent', () => {
		expect(
			resolveBucketInsertParent(
				fullWidthLoop(),
				'post-excerpt',
				LOOP_RULE.bucketParents,
				'body'
			)
		).toBe('body');
		expect(
			resolveBucketInsertParent(
				[],
				'post-featured-image',
				LOOP_RULE.bucketParents,
				'body'
			)
		).toBe('body');
	});
});
