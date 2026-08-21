/**
 * element-order.ts: derive list order from the live parent, stored
 * metadata, and remaining config ids.
 */

import {
	INNER_ORDER_META_KEY,
	clearStoredElementOrder,
	findLiveParentStampId,
	getGroupInnerOrder,
	isSortableElementControl,
	normalizeElementOrder,
	persistElementOrder,
	resolveBucketInsertParent,
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

	it('prefers stored metadata over the live child order', () => {
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
				[INNER_ORDER_META_KEY]: [
					'page-header-breadcrumbs',
					'page-header-title',
					'page-header-description',
				],
			}
		);
		expect(resolveElementOrder(blocks, RULE)).toEqual([
			'page-header-breadcrumbs',
			'page-header-title',
			'page-header-description',
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

describe('persistElementOrder / clearStoredElementOrder', () => {
	it('writes and clears metadata.blockeraOneInnerOrder on the parent', () => {
		const blocks = header([
			stamped('core/query-title', 'section/page-header-title:default'),
		]);
		const ordered = [
			'page-header-description',
			'page-header-title',
			'page-header-breadcrumbs',
		];
		const persisted = persistElementOrder(blocks, 'page-header', ordered);
		expect(persisted[0].attributes.metadata[INNER_ORDER_META_KEY]).toEqual(
			ordered
		);
		expect(resolveElementOrder(persisted, RULE)).toEqual(ordered);

		const cleared = clearStoredElementOrder(persisted, 'page-header');
		expect(
			cleared[0].attributes.metadata[INNER_ORDER_META_KEY]
		).toBeUndefined();
		expect(resolveElementOrder(cleared, RULE)).toEqual([
			'page-header-title',
			'page-header-description',
			'page-header-breadcrumbs',
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

	it('keeps off items on the last stored parent', () => {
		const blocks = persistElementOrder(fullWidthLoop(), 'media', [
			'post-featured-image',
			'post-excerpt',
		]);
		const content = blocks[0].innerBlocks[0].innerBlocks[0].innerBlocks[1];
		content.innerBlocks = content.innerBlocks.filter(
			(child) =>
				child.attributes.metadata.blockeraOne !==
				'section/post-excerpt:default'
		);
		const buckets = resolveElementBuckets(blocks, LOOP_RULE);
		expect(buckets[0].ids).toEqual(['post-featured-image', 'post-excerpt']);
		expect(buckets[1].ids).not.toContain('post-excerpt');
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

describe('findLiveParentStampId / resolveBucketInsertParent', () => {
	it('reads the stamped immediate parent', () => {
		expect(
			findLiveParentStampId(fullWidthLoop(), 'post-featured-image')
		).toBe('media');
		expect(findLiveParentStampId(fullWidthLoop(), 'post-title')).toBe(
			'body'
		);
	});

	it('inserts into the stored home, else the last existing parent', () => {
		const stored = persistElementOrder(fullWidthLoop(), 'media', [
			'post-excerpt',
		]);
		expect(
			resolveBucketInsertParent(
				stored,
				'post-excerpt',
				LOOP_RULE.bucketParents,
				'body'
			)
		).toBe('media');
		expect(
			resolveBucketInsertParent(
				fullWidthLoop(),
				'post-content',
				LOOP_RULE.bucketParents,
				'body'
			)
		).toBe('body');
	});
});
