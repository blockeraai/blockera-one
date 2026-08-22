/**
 * Posts Loop top-level group factory.
 */

import { __ } from '@wordpress/i18n';

import {
	postContentPanel,
	postExcerptPanel,
	postFeaturedImagePanel,
	postMetaPanel,
	postReadMoreButtonPanel,
	postTitlePanel,
} from '../blocks';
import { customizeInEditorFeature } from '../features';
import type { ControlDef, PanelGroupDef, SectionTarget } from '../types';
import {
	LOOP_BLOCK_IDS,
	LOOP_BLOCK_INNER_ORDER,
	blockToggle,
} from './section-blocks';

const POSTS_LISTING_TARGET: SectionTarget = {
	kind: 'section',
	id: 'posts-listing',
};

const POSTS_TEMPLATE: ControlDef = {
	id: 'posts-template',
	type: 'layout-picker',
	target: POSTS_LISTING_TARGET,
	operation: 'swapSection',
	// Listing patterns ship with standard pagination inside;
	// keep the user's query setup and pagination design
	// across swaps. Loop-item toggles are not reapplied — a
	// listing swap takes the new pattern's composition.
	swapHints: {
		preserveQuery: true,
		reapplyControls: [
			'pagination',
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
			'pagination-style',
			'pagination-top-divider',
			'pagination-top-spacing',
		],
	},
	catalogPool: 'posts-listing',
	innerOrder: {
		parentId: 'posts-listing',
		ids: [],
		within: 'posts-listing',
	},
};

const POSTS_PER_PAGE: ControlDef = {
	id: 'posts-per-page',
	type: 'number',
	label: __('Number of posts', 'blockera'),
	target: { kind: 'setting', id: 'posts_per_page' },
	operation: 'setTemplateSetting',
	scrollTarget: 'posts-listing',
	settingPath: 'posts_per_page',
	defaultValue: 10,
	min: 1,
	max: 50,
	step: 1,
	columns: '2fr 2fr',
};

export function postsLoopGroup(): PanelGroupDef {
	return {
		id: 'page-layout',
		title: __('Posts Loop', 'blockera'),
		controls: [POSTS_TEMPLATE, POSTS_PER_PAGE],
		nestedPanel: {
			id: 'posts-loop',
			title: __('Posts Loop', 'blockera'),
			gatewayLabel: __('Styles & Blocks', 'blockera'),
			// No headerToggle stamp to infer from; panel id is not a stamp.
			scrollTarget: 'posts-listing',
			groups: [
				{
					id: 'posts-loop-layout',
					title: __('Layout', 'blockera'),
					controls: [POSTS_TEMPLATE],
				},
				{
					id: 'posts-loop-styles',
					title: __('Styles', 'blockera'),
					controls: [
						POSTS_PER_PAGE,
						customizeInEditorFeature(
							POSTS_LISTING_TARGET,
							'posts-loop-customize'
						),
					],
				},
				{
					id: 'posts-loop-blocks',
					title: __('Blocks', 'blockera'),
					sortable: true,
					controls: [
						blockToggle(
							'post-featured-image',
							__('Featured Image', 'blockera'),
							postFeaturedImagePanel()
						),
						blockToggle(
							'post-title',
							__('Title', 'blockera'),
							postTitlePanel()
						),
						blockToggle(
							'post-excerpt',
							__('Excerpt', 'blockera'),
							postExcerptPanel()
						),
						blockToggle(
							'post-content',
							__('Full Post Content', 'blockera'),
							postContentPanel()
						),
						blockToggle(
							'post-read-more',
							__('Read More Button', 'blockera'),
							postReadMoreButtonPanel()
						),
						postMetaPanel({
							instance: 1,
							insert: {
								relativeTo: 'body',
								position: 'inside-end',
							},
							rowInnerOrder: LOOP_BLOCK_INNER_ORDER,
							requireAtLeastOneOf: LOOP_BLOCK_IDS,
						}),
						postMetaPanel({
							instance: 2,
							insert: {
								relativeTo: 'body',
								position: 'inside-end',
							},
							rowInnerOrder: LOOP_BLOCK_INNER_ORDER,
							requireAtLeastOneOf: LOOP_BLOCK_IDS,
						}),
					],
				},
			],
		},
	};
}
