/**
 * applyOperation reorderInnerSections / inner order.
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

import {
	apply,
	LOOP_BLOCK_ORDER,
	fullWidthListing,
} from './helpers/apply-operation-setup';
import { INNER_ORDER_META_KEY } from '../element-order';
import { getStamp } from '../metadata';
import { findStamp, stamped } from './helpers/block-fixtures';

describe('reorderInnerSections', () => {
	it('writes stored order and reorders present children', () => {
		const innerOrder = {
			parentId: 'page-header',
			ids: [
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
		};
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		];
		const control = {
			id: 'reorder-page-header',
			type: 'button',
			label: '',
			target: { kind: 'section', id: 'page-header' },
			operation: 'reorderInnerSections',
			innerOrder,
		};

		const result = apply(
			control,
			[
				'page-header-breadcrumbs',
				'page-header-description',
				'page-header-title',
			],
			{ blocks }
		);
		expect(
			result.blocks[0].attributes.metadata[INNER_ORDER_META_KEY]
		).toEqual([
			'page-header-breadcrumbs',
			'page-header-description',
			'page-header-title',
		]);
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/term-description',
			'core/query-title',
		]);
	});

	it('reorders page-header body via synthetic reorder-body, not the listing', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped('core/group', 'container/body', {}, [
					stamped(
						'core/query-title',
						'section/page-header-title:default'
					),
					stamped(
						'core/term-description',
						'section/page-header-description:default'
					),
				]),
			]),
			...fullWidthListing(),
		];
		const result = apply(
			{
				id: 'reorder-body',
				type: 'button',
				label: '',
				target: { kind: 'section', id: 'body' },
				operation: 'reorderInnerSections',
				innerOrder: {
					parentId: 'body',
					within: 'page-header',
					ids: [
						'page-header-title',
						'page-header-description',
						'page-header-breadcrumbs',
					],
				},
			},
			[
				'page-header-description',
				'page-header-title',
				'page-header-breadcrumbs',
			],
			{ blocks }
		);
		const headerBody = findStamp(
			findStamp(result.blocks, 'page-header').block.innerBlocks,
			'body'
		);
		expect(
			headerBody.block.innerBlocks.map((b) => getStamp(b)?.id)
		).toEqual(['page-header-description', 'page-header-title']);
		const listingBody = findStamp(
			findStamp(result.blocks, 'posts-listing').block.innerBlocks,
			'body'
		);
		expect(
			listingBody.block.innerBlocks.map((b) => getStamp(b)?.id)
		).not.toContain('page-header-description');
	});
});
describe('reorderInnerSections buckets', () => {
	it('moves a loop-item across parents and persists both orders', () => {
		const result = apply(
			{
				id: 'reorder-body',
				type: 'button',
				label: '',
				target: { kind: 'section', id: 'body' },
				operation: 'reorderInnerSections',
				innerOrder: LOOP_BLOCK_ORDER,
			},
			{
				move: {
					sectionId: 'post-featured-image',
					toParentId: 'body',
					index: 0,
				},
				buckets: [
					{ parentId: 'media', ids: [] },
					{
						parentId: 'body',
						ids: ['post-featured-image', 'post-title', 'post-meta'],
					},
				],
			},
			{ blocks: fullWidthListing() }
		);
		const media = findStamp(result.blocks, 'media').block;
		const content = findStamp(result.blocks, 'body').block;
		expect(media.innerBlocks).toEqual([]);
		expect(content.innerBlocks.map((b) => getStamp(b)?.id)).toEqual([
			'post-featured-image',
			'post-title',
			'post-meta',
		]);
		expect(media.attributes.metadata[INNER_ORDER_META_KEY]).toEqual([]);
		expect(content.attributes.metadata[INNER_ORDER_META_KEY]).toEqual([
			'post-featured-image',
			'post-title',
			'post-meta',
		]);
	});

	it('does not move a listing featured image into the page-header body', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped('core/group', 'container/body', {}, [
					stamped(
						'core/query-title',
						'section/page-header-title:default'
					),
				]),
			]),
			...fullWidthListing(),
		];
		const result = apply(
			{
				id: 'reorder-body',
				type: 'button',
				label: '',
				target: { kind: 'section', id: 'body' },
				operation: 'reorderInnerSections',
				innerOrder: LOOP_BLOCK_ORDER,
			},
			{
				move: {
					sectionId: 'post-featured-image',
					toParentId: 'body',
					index: 0,
				},
				buckets: [
					{ parentId: 'media', ids: [] },
					{
						parentId: 'body',
						ids: ['post-featured-image', 'post-title', 'post-meta'],
					},
				],
			},
			{ blocks }
		);
		const header = findStamp(result.blocks, 'page-header').block;
		expect(
			header.innerBlocks[0].innerBlocks.map((b) => getStamp(b)?.id)
		).toEqual(['page-header-title']);
		const listingBody = findStamp(
			findStamp(result.blocks, 'posts-listing').block.innerBlocks,
			'body'
		);
		expect(
			listingBody.block.innerBlocks.map((b) => getStamp(b)?.id)
		).toEqual(['post-featured-image', 'post-title', 'post-meta']);
	});
});
