/**
 * Singular (single post) Templates family options config.
 *
 * Markup never lives here: controls reference PHP catalog pools.
 */

import { __ } from '@wordpress/i18n';

import { FILTER_IDS } from '../../templates/filter-ids';
import { postMetaPanel } from '../shared/blocks';
import {
	singularContentGroup,
	postCommentsGroup,
	PAGE_HEADER_INNER_ORDER,
	PAGE_HEADER_REQUIRED,
	pageHeaderGroup,
	postNavigationGroup,
	sidebarGroup,
	siteFooterGroup,
	siteHeaderGroup,
} from '../shared/sections';
import type { TemplateOptionsConfig } from '../shared/types';

const PAGE_HEADER_META_ORDER = {
	parentId: 'body' as const,
	within: 'page-header',
	ids: [...PAGE_HEADER_INNER_ORDER.ids, 'post-meta', 'post-meta-2'],
};

const PAGE_HEADER_ON = [{ controlId: 'page-header', equals: true }];

function pageHeaderMeta(instance: 1 | 2) {
	return postMetaPanel({
		instance,
		controlPrefix: 'page-header',
		defaultValue: false,
		conditions: PAGE_HEADER_ON,
		insert: {
			relativeTo: 'body',
			position: 'inside-end',
		},
		rowInnerOrder: PAGE_HEADER_META_ORDER,
		requireAtLeastOneOf: PAGE_HEADER_REQUIRED,
	});
}

export const SINGLE_OPTIONS_CONFIG: TemplateOptionsConfig = {
	type: 'single',
	filters: [FILTER_IDS.single, FILTER_IDS.page],
	filterPrefix: 'cpt-single:',
	fallbackFilter: FILTER_IDS.single,
	layoutId: 'main',
	sectionHeuristics: {
		article: {
			kind: 'groupWrapping',
			childName: 'core/post-content',
		},
		'post-comments': { kind: 'blockName', name: 'core/comments' },
		'comments-title': {
			kind: 'innerBlock',
			parentId: 'post-comments',
			name: 'core/comments-title',
		},
		'comment-template': {
			kind: 'innerBlock',
			parentId: 'post-comments',
			name: 'core/comment-template',
		},
		'comments-pagination': {
			kind: 'innerBlock',
			parentId: 'post-comments',
			name: 'core/comments-pagination',
		},
		'comments-form': {
			kind: 'innerBlock',
			parentId: 'post-comments',
			name: 'core/post-comments-form',
		},
		'post-navigation': {
			kind: 'groupWrapping',
			childName: 'core/post-navigation-link',
		},
	},
	layoutSiblingSections: ['page-header'],
	templateOverrides: {
		[FILTER_IDS.page]: {
			patchControls: [
				{
					controlId: 'page-header-design',
					patch: { catalogPool: 'page-page-header' },
				},
			],
			patchGroups: [
				{
					groupId: 'article',
					patch: {
						title: __('Page Content', 'blockera'),
						nestedPanel: {
							title: __('Page Content', 'blockera'),
						},
					},
				},
			],
		},
	},
	groups: [
		siteHeaderGroup(),
		pageHeaderGroup({
			extraElements: [pageHeaderMeta(1), pageHeaderMeta(2)],
		}),
		singularContentGroup(),
		postNavigationGroup(),
		postCommentsGroup(),
		sidebarGroup(),
		siteFooterGroup(),
	],
};
