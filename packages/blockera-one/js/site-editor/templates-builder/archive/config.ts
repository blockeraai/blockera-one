/**
 * Archive Templates family options config (v1).
 *
 * Markup never lives here: controls reference PHP catalog pools
 * (`catalogPool`) and `resolve/hydrate-config.ts` fills `variants` from
 * `window.blockeraOneTemplateBuilder.catalog.archive`. Pattern HTML is
 * resolved from the core patterns store at op time
 * (`resolve/resolve-variant-html.ts`).
 */

import { __ } from '@wordpress/i18n';

import { FILTER_IDS } from '../../templates/filter-ids';
import {
	PAGE_HEADER_INNER_ORDER,
	PAGE_HEADER_REQUIRED,
	emptyDesignPanel,
	pageHeaderBlock,
	pageHeaderGroup,
	paginationGroup,
	postsLoopGroup,
	sidebarGroup,
	siteFooterGroup,
	siteHeaderGroup,
} from '../shared/sections';
import type { InnerOrderRule, TemplateOptionsConfig } from '../shared/types';

const SEARCH_PAGE_HEADER_IDS = [
	...PAGE_HEADER_INNER_ORDER.ids,
	'page-header-search-form',
	'page-header-results-count',
];

const SEARCH_PAGE_HEADER_INNER_ORDER: InnerOrderRule = {
	...PAGE_HEADER_INNER_ORDER,
	ids: SEARCH_PAGE_HEADER_IDS,
};

const SEARCH_PAGE_HEADER_REQUIRED = [
	...PAGE_HEADER_REQUIRED,
	'page-header-search-form',
	'page-header-results-count',
];

export const ARCHIVE_OPTIONS_CONFIG: TemplateOptionsConfig = {
	type: 'archive',
	filters: [
		FILTER_IDS.archive,
		FILTER_IDS.category,
		FILTER_IDS.tag,
		FILTER_IDS.author,
		FILTER_IDS.date,
		FILTER_IDS.taxonomy,
		FILTER_IDS.search,
		FILTER_IDS.home,
		FILTER_IDS.index,
	],
	fallbackFilter: FILTER_IDS.archive,
	layoutId: 'main',
	// Stampless fallbacks: when the user rebuilt a section by hand, detect it
	// by block shape so the panel still resolves a (customized) state.
	sectionHeuristics: {
		header: {
			kind: 'templatePart',
			area: 'header',
			slugIncludes: 'header',
		},
		footer: {
			kind: 'templatePart',
			area: 'footer',
			slugIncludes: 'footer',
		},
		sidebar: { kind: 'templatePart', slugPrefix: 'sidebar' },
		'page-header': { kind: 'groupWrapping', childName: 'core/query-title' },
		'page-header-title': {
			kind: 'innerBlock',
			parentId: 'body',
			name: 'core/query-title',
		},
		'page-header-description': {
			kind: 'innerBlock',
			parentId: 'body',
			name: 'core/term-description',
		},
		'page-header-breadcrumbs': {
			kind: 'innerBlock',
			parentId: 'body',
			name: 'core/breadcrumbs',
		},
		'page-header-search-form': {
			kind: 'innerBlock',
			parentId: 'body',
			name: 'core/search',
		},
		'page-header-results-count': {
			kind: 'innerBlock',
			parentId: 'body',
			name: 'core/query-total',
		},
		'posts-listing': { kind: 'blockName', name: 'core/query' },
		'post-featured-image': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/post-featured-image',
		},
		'post-title': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/post-title',
		},
		'post-excerpt': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/post-excerpt',
		},
		'post-content': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/post-content',
		},
		'post-read-more': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/read-more',
		},
		pagination: { kind: 'blockName', name: 'core/query-pagination' },
		'pagination-previous': {
			kind: 'innerBlock',
			parentId: 'pagination',
			name: 'core/query-pagination-previous',
		},
		'pagination-next': {
			kind: 'innerBlock',
			parentId: 'pagination',
			name: 'core/query-pagination-next',
		},
		'pagination-numbers': {
			kind: 'innerBlock',
			parentId: 'pagination',
			name: 'core/query-pagination-numbers',
		},
	},
	// Page header sits full-width above the content/sidebar columns and must
	// be carried across layout transplants.
	layoutSiblingSections: ['page-header'],
	templateOverrides: {
		[FILTER_IDS.search]: {
			patchControls: [
				{
					controlId: 'page-header-design',
					patch: { catalogPool: 'page-header-search' },
				},
				{
					controlId: 'page-header-title',
					patch: {
						catalogPool: 'page-header-search-title',
						innerOrder: SEARCH_PAGE_HEADER_INNER_ORDER,
						requireAtLeastOneOf: SEARCH_PAGE_HEADER_REQUIRED,
					},
				},
				{
					controlId: 'page-header-description',
					patch: {
						innerOrder: SEARCH_PAGE_HEADER_INNER_ORDER,
						requireAtLeastOneOf: SEARCH_PAGE_HEADER_REQUIRED,
					},
				},
				{
					controlId: 'page-header-breadcrumbs',
					patch: {
						innerOrder: SEARCH_PAGE_HEADER_INNER_ORDER,
						requireAtLeastOneOf: SEARCH_PAGE_HEADER_REQUIRED,
					},
				},
			],
			injectControls: [
				{
					groupId: 'page-header-blocks',
					after: 'page-header-breadcrumbs',
					controls: [
						pageHeaderBlock(
							'page-header-search-form',
							__('Search Form', 'blockera'),
							emptyDesignPanel(
								'page-header-search-form',
								__('Search Form', 'blockera')
							),
							{
								innerOrder: SEARCH_PAGE_HEADER_INNER_ORDER,
								requireAtLeastOneOf:
									SEARCH_PAGE_HEADER_REQUIRED,
							}
						),
						pageHeaderBlock(
							'page-header-results-count',
							__('Results Count', 'blockera'),
							emptyDesignPanel(
								'page-header-results-count',
								__('Results Count', 'blockera')
							),
							{
								defaultValue: false,
								innerOrder: SEARCH_PAGE_HEADER_INNER_ORDER,
								requireAtLeastOneOf:
									SEARCH_PAGE_HEADER_REQUIRED,
							}
						),
					],
				},
			],
		},
	},
	groups: [
		siteHeaderGroup(),
		pageHeaderGroup(),
		postsLoopGroup(),
		paginationGroup(),
		sidebarGroup(),
		siteFooterGroup(),
	],
};
