/**
 * Sidebar part Blocks group (Search, Categories, Latest Posts, …).
 */

import { __ } from '@wordpress/i18n';

import type { PanelGroupDef } from '../types';
import { emptyDesignPanel, blockToggle } from './section-blocks';

const SIDEBAR_BLOCK_IDS = [
	'sidebar-search',
	'sidebar-categories',
	'sidebar-latest-posts',
	'sidebar-archives',
	'sidebar-tag-cloud',
];

const SIDEBAR_INNER_ORDER = {
	parentId: 'site-sidebar',
	ids: SIDEBAR_BLOCK_IDS,
};

const SIDEBAR_BLOCK_OPTIONS = {
	innerOrder: SIDEBAR_INNER_ORDER,
	requireAtLeastOneOf: SIDEBAR_BLOCK_IDS,
	insert: {
		relativeTo: 'site-sidebar',
		position: 'inside-end' as const,
	},
};

export function sidebarBlocksGroup(): PanelGroupDef {
	return {
		id: 'sidebar-elements',
		title: __('Blocks', 'blockera'),
		sortable: true,
		controls: [
			blockToggle(
				'sidebar-search',
				__('Search', 'blockera'),
				emptyDesignPanel('sidebar-search', __('Search', 'blockera')),
				SIDEBAR_BLOCK_OPTIONS
			),
			blockToggle(
				'sidebar-categories',
				__('Categories', 'blockera'),
				emptyDesignPanel(
					'sidebar-categories',
					__('Categories', 'blockera')
				),
				SIDEBAR_BLOCK_OPTIONS
			),
			blockToggle(
				'sidebar-latest-posts',
				__('Latest Posts', 'blockera'),
				emptyDesignPanel(
					'sidebar-latest-posts',
					__('Latest Posts', 'blockera')
				),
				SIDEBAR_BLOCK_OPTIONS
			),
			blockToggle(
				'sidebar-archives',
				__('Archives', 'blockera'),
				emptyDesignPanel(
					'sidebar-archives',
					__('Archives', 'blockera')
				),
				{
					...SIDEBAR_BLOCK_OPTIONS,
					defaultValue: false,
				}
			),
			blockToggle(
				'sidebar-tag-cloud',
				__('Tag Cloud', 'blockera'),
				emptyDesignPanel(
					'sidebar-tag-cloud',
					__('Tag Cloud', 'blockera')
				),
				{
					...SIDEBAR_BLOCK_OPTIONS,
					defaultValue: false,
				}
			),
		],
	};
}
