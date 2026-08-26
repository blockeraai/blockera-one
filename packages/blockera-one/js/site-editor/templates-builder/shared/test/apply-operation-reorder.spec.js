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
import { getStamp } from '../metadata';
import { block, findStamp, stamped } from './helpers/block-fixtures';

describe('reorderInnerSections', () => {
	it('reorders present children', () => {
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
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/term-description',
			'core/query-title',
		]);
	});

	it('returns null when the managed order is already correct', () => {
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
		const result = apply(
			{
				id: 'reorder-page-header',
				type: 'button',
				label: '',
				target: { kind: 'section', id: 'page-header' },
				operation: 'reorderInnerSections',
				innerOrder,
			},
			[
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
			{ blocks }
		);
		expect(result).toBeNull();
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

	it('attaches a reorder payload when page-header body children have clientIds', () => {
		const title = stamped(
			'core/query-title',
			'section/page-header-title:default',
			{ clientId: 'title-live' }
		);
		const desc = stamped(
			'core/term-description',
			'section/page-header-description:default',
			{ clientId: 'desc-live' }
		);
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped(
					'core/group',
					'container/body',
					{ clientId: 'body-live' },
					[title, desc]
				),
			]),
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
			['page-header-description', 'page-header-title'],
			{ blocks }
		);
		expect(result.localReplace).toEqual({
			reorderParentClientId: 'body-live',
			blocks: [desc, title],
		});
	});
});
describe('reorderInnerSections buckets', () => {
	it('attaches innerPatches when a loop-item moves across media and body', () => {
		const image = stamped(
			'core/post-featured-image',
			'section/post-featured-image:default',
			{ clientId: 'image-live' }
		);
		const title = stamped('core/post-title', 'section/post-title:default', {
			clientId: 'title-live',
		});
		const media = stamped(
			'core/column',
			'container/media',
			{
				clientId: 'media-live',
			},
			[image]
		);
		const body = stamped(
			'core/column',
			'container/body',
			{
				clientId: 'body-live',
			},
			[title]
		);
		const columns = block('core/columns', {}, [media, body]);
		columns.clientId = 'cols-live';
		const template = block('core/post-template', {}, [columns]);
		template.clientId = 'tpl-live';
		const blocks = [
			stamped(
				'core/query',
				'section/posts-listing:full-width',
				{ clientId: 'listing-live' },
				[template]
			),
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
						ids: ['post-featured-image', 'post-title'],
					},
				],
			},
			{ blocks }
		);
		expect(
			result.localReplace.innerPatches.map((item) => item.clientId).sort()
		).toEqual(['body-live', 'media-live']);
	});

	it('moves a loop-item across parents', () => {
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
