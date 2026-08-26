/**
 * Shared fixtures for apply-operation specs. Each spec file still mocks
 * `../blocks-adapter` so parse/serialize stay in-memory.
 */

import { applyOperation } from '../../ops/apply-operation';
import { __setMarkup } from '../../blocks-adapter';
import { block, stamped } from './block-fixtures';

export const LAYOUT_ID = 'main';

beforeAll(() => {
	__setMarkup('layout-no-sidebar', [
		stamped(
			'core/group',
			`layout/${LAYOUT_ID}:no-sidebar`,
			{ tagName: 'main' },
			[stamped('core/group', 'area/content')]
		),
	]);
	__setMarkup('layout-sidebar-right', [
		stamped(
			'core/group',
			`layout/${LAYOUT_ID}:sidebar-right`,
			{ tagName: 'main' },
			[
				stamped('core/columns', 'container/layout-columns', {}, [
					stamped(
						'core/column',
						'container/content-column',
						{ width: '60%' },
						[stamped('core/group', 'area/content')]
					),
					stamped(
						'core/column',
						'container/sidebar-column',
						{ width: '40%' },
						[stamped('core/group', 'area/sidebar-area')]
					),
				]),
			]
		),
	]);
	// Listing markup ships with its default pagination inside.
	__setMarkup('listing-grid-2', [
		stamped('core/query', 'section/posts-listing:grid-2', {}, [
			stamped('core/query-pagination', 'section/pagination:standard'),
		]),
	]);
	__setMarkup('listing-full-width', [
		stamped('core/query', 'section/posts-listing:full-width', {}, [
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
			]),
			stamped('core/query-pagination', 'section/pagination:standard'),
		]),
	]);
	__setMarkup('pagination-standard', [
		stamped('core/query-pagination', 'section/pagination:standard'),
	]);
	__setMarkup('pagination-previous', [
		stamped(
			'core/query-pagination-previous',
			'section/pagination-previous:default'
		),
	]);
	__setMarkup('pagination-next', [
		stamped(
			'core/query-pagination-next',
			'section/pagination-next:default'
		),
	]);
	__setMarkup('pagination-numbers', [
		stamped(
			'core/query-pagination-numbers',
			'section/pagination-numbers:default'
		),
	]);
	__setMarkup('header-large', [
		block('core/template-part', { slug: 'raw', area: 'header' }),
	]);
});

const LAYOUT_VARIANTS = [
	{
		id: 'no-sidebar',
		label: 'None',
		html: 'layout-no-sidebar',
		areas: ['content'],
	},
	{
		id: 'sidebar-right',
		label: 'Right',
		html: 'layout-sidebar-right',
		areas: ['content', 'sidebar-area'],
	},
];

const LISTING_VARIANTS = [
	{ id: 'list', label: 'List', html: 'listing-list' },
	{ id: 'grid-2', label: 'Grid 2', html: 'listing-grid-2' },
	{ id: 'full-width', label: 'Full width', html: 'listing-full-width' },
];

const PAGINATION_VARIANTS = [
	{ id: 'standard', label: 'Standard', html: 'pagination-standard' },
	{
		id: 'load-more',
		label: 'Load more',
		disabled: true,
		badge: 'Coming soon',
	},
];

export const CONTROLS = {
	postsPerPage: {
		id: 'posts-per-page',
		type: 'number',
		label: 'Posts',
		target: { kind: 'setting', id: 'posts_per_page' },
		operation: 'setTemplateSetting',
		defaultValue: 10,
	},
	sidebarToggle: {
		id: 'sidebar',
		type: 'toggle',
		label: 'Sidebar',
		target: { kind: 'layout', id: LAYOUT_ID },
		operation: 'transplantLayout',
		onValue: 'sidebar-right',
		offValue: 'no-sidebar',
		variants: LAYOUT_VARIANTS,
	},
	postsTemplate: {
		id: 'posts-template',
		type: 'layout-picker',
		label: 'Posts Template',
		target: { kind: 'section', id: 'posts-listing' },
		operation: 'swapSection',
		variants: LISTING_VARIANTS,
		swapHints: {
			preserveQuery: true,
			reapplyControls: [
				'pagination',
				'pagination-previous',
				'pagination-numbers',
				'pagination-next',
			],
		},
	},
	pagination: {
		id: 'pagination',
		type: 'toggle',
		label: 'Pagination',
		target: { kind: 'section', id: 'pagination' },
		operation: 'toggleSection',
		variants: PAGINATION_VARIANTS,
		insert: { relativeTo: 'posts-listing', position: 'inside-end' },
	},
	paginationDesign: {
		id: 'pagination-design',
		type: 'layout-picker',
		label: 'Pagination Design',
		target: { kind: 'section', id: 'pagination' },
		operation: 'swapSection',
		variants: PAGINATION_VARIANTS,
	},
	paginationPrevious: {
		id: 'pagination-previous',
		type: 'toggle',
		label: 'Previous Page',
		target: { kind: 'section', id: 'pagination-previous' },
		operation: 'toggleSection',
		catalogPool: 'pagination-previous',
		variants: [
			{ id: 'default', label: 'Previous', html: 'pagination-previous' },
		],
		insert: { relativeTo: 'pagination', position: 'inside-start' },
		innerOrder: {
			parentId: 'pagination',
			ids: [
				'pagination-previous',
				'pagination-numbers',
				'pagination-next',
			],
		},
		requireAtLeastOneOf: [
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		],
	},
	paginationNumbers: {
		id: 'pagination-numbers',
		type: 'toggle',
		label: 'Numbers',
		target: { kind: 'section', id: 'pagination-numbers' },
		operation: 'toggleSection',
		variants: [
			{ id: 'default', label: 'Numbers', html: 'pagination-numbers' },
		],
		insert: { relativeTo: 'pagination', position: 'inside-start' },
		innerOrder: {
			parentId: 'pagination',
			ids: [
				'pagination-previous',
				'pagination-numbers',
				'pagination-next',
			],
		},
		requireAtLeastOneOf: [
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		],
	},
	paginationNext: {
		id: 'pagination-next',
		type: 'toggle',
		label: 'Next Page',
		target: { kind: 'section', id: 'pagination-next' },
		operation: 'toggleSection',
		variants: [{ id: 'default', label: 'Next', html: 'pagination-next' }],
		insert: { relativeTo: 'pagination', position: 'inside-end' },
		innerOrder: {
			parentId: 'pagination',
			ids: [
				'pagination-previous',
				'pagination-numbers',
				'pagination-next',
			],
		},
		requireAtLeastOneOf: [
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		],
	},
	headerDesign: {
		id: 'header-design',
		type: 'layout-picker',
		label: 'Header',
		target: { kind: 'section', id: 'header' },
		operation: 'swapTemplatePart',
		variants: [
			{ id: 'header-large', label: 'Large', html: 'header-large' },
		],
	},
	headerToggle: {
		id: 'header-toggle',
		type: 'toggle',
		label: 'Header',
		target: { kind: 'section', id: 'header' },
		operation: 'toggleSection',
	},
	queryPerPage: {
		id: 'query-per-page',
		type: 'number',
		label: 'Per page',
		target: { kind: 'section', id: 'posts-listing' },
		operation: 'setSectionAttribute',
		attributePath: 'query.perPage',
	},
};

export const CONFIG = {
	type: 'archive',
	filters: ['archive'],
	layoutId: LAYOUT_ID,
	groups: [
		{
			id: 'main',
			title: 'Main',
			controls: Object.values(CONTROLS),
		},
	],
};

export function makeBlocks() {
	return [
		stamped('core/template-part', 'section/header:header-default', {
			slug: 'header-default',
			area: 'header',
		}),
		stamped(
			'core/group',
			`layout/${LAYOUT_ID}:no-sidebar`,
			{ tagName: 'main' },
			[
				stamped('core/group', 'area/content', {}, [
					stamped(
						'core/query',
						'section/posts-listing:list',
						{ query: { inherit: true, perPage: 10 } },
						[
							stamped(
								'core/query-pagination',
								'section/pagination:standard',
								{},
								[
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
								]
							),
						]
					),
				]),
			]
		),
	];
}

export function apply(control, nextValue, overrides = {}) {
	return applyOperation({
		blocks: makeBlocks(),
		control,
		nextValue,
		config: CONFIG,
		settings: { posts_per_page: { archive: 12 } },
		settingBucket: 'archive',
		needsConfirm: false,
		...overrides,
	});
}

export function paginationTree(children) {
	return [
		stamped(
			'core/query-pagination',
			'section/pagination:standard',
			{},
			children
		),
	];
}

export function elementsConfig() {
	return {
		type: 'archive',
		filters: ['archive'],
		layoutId: LAYOUT_ID,
		groups: [
			{
				id: 'start',
				title: 'Elements',
				controls: [
					CONTROLS.paginationPrevious,
					CONTROLS.paginationNumbers,
					CONTROLS.paginationNext,
				],
			},
		],
	};
}

export const LOOP_BLOCK_ORDER = {
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

export function fullWidthListing() {
	return [
		stamped('core/query', 'section/posts-listing:full-width', {}, [
			block('core/post-template', {}, [
				block('core/columns', {}, [
					stamped('core/column', 'container/media', {}, [
						stamped(
							'core/post-featured-image',
							'section/post-featured-image:default'
						),
					]),
					stamped('core/column', 'container/body', {}, [
						stamped(
							'core/post-title',
							'section/post-title:default'
						),
						stamped('core/group', 'section/post-meta:default', {}, [
							stamped(
								'core/post-date',
								'section/post-meta-post-date:default'
							),
						]),
					]),
				]),
			]),
		]),
	];
}
