/**
 * applyOperation toggleSection.
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
	CONTROLS,
	LAYOUT_ID,
	LOOP_BLOCK_ORDER,
	elementsConfig,
	fullWidthListing,
	paginationTree,
} from './helpers/apply-operation-setup';
import { __setMarkup } from '../blocks-adapter';
import { INNER_ORDER_META_KEY } from '../element-order';
import { getStamp } from '../metadata';
import { findStampById } from '../stamp-lookup';
import { block, findStamp, stamped } from './helpers/block-fixtures';

describe('toggleSection', () => {
	it('removes the section when toggled off (with chrome unwrap preparation)', () => {
		// Header inside a vertical rail: hiding must unwrap the rail first so
		// the layout is not left trapped inside columns.
		const rail = [
			stamped('core/columns', 'container/chrome-rail:vertical-rail', {}, [
				block('core/column', {}, [
					stamped('core/template-part', 'section/header:vertical', {
						slug: 'header-vertical',
					}),
				]),
				block('core/column', {}, [
					stamped(
						'core/group',
						`layout/${LAYOUT_ID}:no-sidebar`,
						{},
						[stamped('core/group', 'area/content')]
					),
				]),
			]),
		];

		const result = apply(CONTROLS.headerToggle, false, { blocks: rail });
		expect(findStamp(result.blocks, 'header')).toBeNull();
		expect(findStamp(result.blocks, 'chrome-rail')).toBeNull();
		expect(findStamp(result.blocks, LAYOUT_ID).path).toEqual([0]);
	});

	it('honors invertPresence (true means remove)', () => {
		const control = { ...CONTROLS.headerToggle, invertPresence: true };
		const result = apply(control, true);
		expect(findStamp(result.blocks, 'header')).toBeNull();
	});

	it('appends a restored title after present children when no stored order exists', () => {
		__setMarkup('page-header-title', [
			stamped('core/query-title', 'section/page-header-title:default'),
		]);
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
					'core/breadcrumbs',
					'section/page-header-breadcrumbs:default'
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		];
		const control = {
			id: 'page-header-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-header-title' },
			],
			insert: { relativeTo: 'page-header', position: 'inside-start' },
			innerOrder,
		};

		const result = apply(control, true, { blocks });
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/breadcrumbs',
			'core/term-description',
			'core/query-title',
		]);
	});

	it('persists pre-toggle order so a hidden title keeps its list slot', () => {
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
			id: 'page-header-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-header-title' },
			],
			insert: { relativeTo: 'page-header', position: 'inside-start' },
			innerOrder,
		};

		const result = apply(control, false, { blocks });
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/term-description',
		]);
		expect(
			result.blocks[0].attributes.metadata[INNER_ORDER_META_KEY]
		).toEqual([
			'page-header-title',
			'page-header-description',
			'page-header-breadcrumbs',
		]);
	});

	it('restores a toggled-on title at its stored list slot', () => {
		__setMarkup('page-header-title', [
			stamped('core/query-title', 'section/page-header-title:default'),
		]);
		const innerOrder = {
			parentId: 'page-header',
			ids: [
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
		};
		const blocks = [
			stamped(
				'core/group',
				'section/page-header:default',
				{
					metadata: {
						blockeraOne: 'section/page-header:default',
						[INNER_ORDER_META_KEY]: [
							'page-header-breadcrumbs',
							'page-header-title',
							'page-header-description',
						],
					},
				},
				[
					stamped(
						'core/breadcrumbs',
						'section/page-header-breadcrumbs:default'
					),
					stamped(
						'core/term-description',
						'section/page-header-description:default'
					),
				]
			),
		];
		const control = {
			id: 'page-header-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-header-title' },
			],
			insert: { relativeTo: 'page-header', position: 'inside-start' },
			innerOrder,
		};

		const result = apply(control, true, { blocks });
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/breadcrumbs',
			'core/query-title',
			'core/term-description',
		]);
	});

	it('uses frozen orderBuckets so toggle-on inserts at the visual slot', () => {
		__setMarkup('page-header-title', [
			stamped('core/query-title', 'section/page-header-title:default'),
		]);
		const innerOrder = {
			parentId: 'page-header',
			ids: [
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
		};
		const blocks = [
			stamped(
				'core/group',
				'section/page-header:default',
				{
					metadata: {
						blockeraOne: 'section/page-header:default',
						[INNER_ORDER_META_KEY]: [
							'page-header-title',
							'page-header-description',
							'page-header-breadcrumbs',
						],
					},
				},
				[
					stamped(
						'core/term-description',
						'section/page-header-description:default'
					),
					stamped(
						'core/breadcrumbs',
						'section/page-header-breadcrumbs:default'
					),
				]
			),
		];
		const control = {
			id: 'page-header-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-header-title' },
			],
			insert: { relativeTo: 'page-header', position: 'inside-start' },
			innerOrder,
		};

		const result = apply(control, true, {
			blocks,
			orderBuckets: [
				{
					parentId: 'page-header',
					ids: [
						'page-header-description',
						'page-header-breadcrumbs',
						'page-header-title',
					],
				},
			],
		});
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/term-description',
			'core/breadcrumbs',
			'core/query-title',
		]);
	});
});
describe('pagination elements and requireAtLeastOneOf', () => {
	it('removes previous without touching next', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-previous',
				'section/pagination-previous:default'
			),
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
			stamped(
				'core/query-pagination-next',
				'section/pagination-next:default'
			),
		]);
		const result = apply(CONTROLS.paginationPrevious, false, {
			blocks,
			config: elementsConfig(),
		});
		expect(findStamp(result.blocks, 'pagination-previous')).toBeNull();
		expect(findStamp(result.blocks, 'pagination-next')).not.toBeNull();
		expect(findStamp(result.blocks, 'pagination-numbers')).not.toBeNull();
	});

	it('refuses to turn off the last required element', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
		]);
		const result = apply(CONTROLS.paginationNumbers, false, {
			blocks,
			config: elementsConfig(),
		});
		expect(findStamp(result.blocks, 'pagination-numbers')).not.toBeNull();
	});

	it('allows turning off a non-required sibling when one required remains', () => {
		const filler = {
			id: 'space-filler',
			type: 'toggle',
			label: 'Space Filler',
			target: { kind: 'section', id: 'space-filler' },
			operation: 'toggleSection',
			requireAtLeastOneOf: CONTROLS.paginationNumbers.requireAtLeastOneOf,
		};
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
			stamped('core/group', 'section/space-filler:default'),
		]);
		const result = apply(filler, false, {
			blocks,
			config: elementsConfig(),
		});
		expect(findStamp(result.blocks, 'space-filler')).toBeNull();
		expect(findStamp(result.blocks, 'pagination-numbers')).not.toBeNull();
	});

	it('inserts previous independently of next', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
		]);
		const result = apply(CONTROLS.paginationPrevious, true, {
			blocks,
			config: elementsConfig(),
		});
		expect(findStamp(result.blocks, 'pagination-previous')).not.toBeNull();
		expect(findStamp(result.blocks, 'pagination-next')).toBeNull();
		expect(findStamp(result.blocks, 'pagination-numbers')).not.toBeNull();
	});

	it('writes style onto alsoSetOn companions', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-previous',
				'section/pagination-previous:default',
				{ className: 'blockera-block' }
			),
			stamped(
				'core/query-pagination-next',
				'section/pagination-next:default',
				{ className: 'blockera-block' }
			),
		]);
		const style = {
			id: 'pagination-prev-style',
			type: 'select',
			label: 'Style',
			target: { kind: 'section', id: 'pagination-previous' },
			operation: 'setBlockStyle',
			alsoSetOn: ['pagination-next'],
		};
		const result = apply(style, 'underline', { blocks });
		expect(
			findStamp(result.blocks, 'pagination-previous').block.attributes
				.className
		).toContain('is-style-underline');
		expect(
			findStamp(result.blocks, 'pagination-next').block.attributes
				.className
		).toContain('is-style-underline');
	});
});
describe('toggleSection bucket home', () => {
	it('toggles a media-column item back into media, not content', () => {
		__setMarkup('listing-featured-image', [
			stamped(
				'core/post-featured-image',
				'section/post-featured-image:default'
			),
		]);
		const control = {
			id: 'post-featured-image',
			type: 'toggle',
			label: 'Featured Image',
			target: { kind: 'section', id: 'post-featured-image' },
			operation: 'toggleSection',
			variants: [
				{
					id: 'default',
					label: 'Featured Image',
					html: 'listing-featured-image',
				},
			],
			insert: {
				relativeTo: 'body',
				position: 'inside-end',
			},
			innerOrder: LOOP_BLOCK_ORDER,
		};
		const off = apply(control, false, { blocks: fullWidthListing() });
		expect(findStamp(off.blocks, 'post-featured-image')).toBeNull();
		const on = apply(control, true, { blocks: off.blocks });
		expect(
			getStamp(findStamp(on.blocks, 'post-featured-image').block)
		).toEqual({
			role: 'section',
			id: 'post-featured-image',
			variant: 'default',
		});
		expect(
			getStamp(findStamp(on.blocks, 'media').block.innerBlocks[0])?.id
		).toBe('post-featured-image');
	});

	it('toggles excerpt only inside the selected listing card body', () => {
		const card = (clientId, titleId, excerptId) => ({
			...stamped('core/group', 'container/body', {}, [
				{
					...stamped('core/post-title', 'section/post-title:default'),
					clientId: titleId,
				},
				{
					...stamped(
						'core/post-excerpt',
						'section/post-excerpt:default'
					),
					clientId: excerptId,
				},
			]),
			clientId,
		});
		const blocks = [
			{
				...stamped('core/query', 'section/posts-listing:list', {}, [
					card('card-a', 'title-a', 'excerpt-a'),
					card('card-b', 'title-b', 'excerpt-b'),
				]),
				clientId: 'listing',
			},
		];
		const control = {
			id: 'post-excerpt',
			type: 'toggle',
			label: 'Excerpt',
			target: { kind: 'section', id: 'post-excerpt' },
			operation: 'toggleSection',
			insert: { relativeTo: 'body', position: 'inside-end' },
			innerOrder: LOOP_BLOCK_ORDER,
		};
		const result = apply(control, false, {
			blocks,
			selectedClientId: 'title-b',
		});
		const listing = findStamp(result.blocks, 'posts-listing').block;
		expect(
			listing.innerBlocks[0].innerBlocks.map((b) => getStamp(b)?.id)
		).toEqual(['post-title', 'post-excerpt']);
		expect(
			listing.innerBlocks[1].innerBlocks.map((b) => getStamp(b)?.id)
		).toEqual(['post-title']);
	});

	it('creates container/comments under article when toggling comments on', () => {
		__setMarkup('post-comments', [
			stamped('core/comments', 'section/post-comments:default'),
		]);
		const control = {
			id: 'post-comments',
			type: 'toggle',
			label: 'Comments',
			target: { kind: 'section', id: 'post-comments' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Comments', html: 'post-comments' },
			],
			insert: {
				relativeTo: 'comments',
				position: 'inside-end',
				ensureContainerOwner: 'article',
			},
		};
		const blocks = [
			stamped('core/group', 'section/article:default', {}, [
				stamped('core/group', 'container/body', {}, [
					stamped(
						'core/post-content',
						'section/post-content:default'
					),
				]),
			]),
		];
		const result = apply(control, true, { blocks });
		expect(findStamp(result.blocks, 'comments')).not.toBeNull();
		expect(getStamp(findStamp(result.blocks, 'comments').block).role).toBe(
			'container'
		);
		expect(findStamp(result.blocks, 'post-comments')).not.toBeNull();
	});

	it('inserts article Post Meta without treating page-header Post Meta as present', () => {
		__setMarkup('post-meta', [
			stamped('core/group', 'section/post-meta:default', {
				clientId: 'inserted-meta',
			}),
		]);
		const control = {
			id: 'post-meta',
			type: 'toggle',
			target: { kind: 'section', id: 'post-meta' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Post Meta', html: 'post-meta' },
			],
			insert: { relativeTo: 'body', position: 'inside-end' },
			innerOrder: {
				parentId: 'body',
				within: 'article',
				ids: ['post-meta'],
			},
		};
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped('core/group', 'container/body', {}, [
					stamped('core/group', 'section/post-meta:default', {
						clientId: 'header-meta',
					}),
				]),
			]),
			stamped('core/group', 'section/article:default', {}, [
				stamped('core/group', 'container/body', {}, [
					stamped(
						'core/post-content',
						'section/post-content:default'
					),
				]),
			]),
		];
		const result = apply(control, true, { blocks });
		expect(
			findStampById(result.blocks, 'post-meta', { within: 'page-header' })
				.block.clientId
		).toBe('header-meta');
		expect(
			findStampById(result.blocks, 'post-meta', { within: 'article' })
		).not.toBeNull();
	});
});
