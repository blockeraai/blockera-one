/**
 * Singular Content (post/page) top-level group factory.
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
	ARTICLE_BLOCK_INNER_ORDER,
	ARTICLE_BLOCK_IDS,
	blockToggle,
} from './section-blocks';

const SINGULAR_CONTENT_TARGET: SectionTarget = {
	kind: 'section',
	id: 'article',
};

const SINGULAR_CONTENT_BLOCK_OPTIONS = {
	innerOrder: ARTICLE_BLOCK_INNER_ORDER,
	requireAtLeastOneOf: ARTICLE_BLOCK_IDS,
};

const SINGULAR_CONTENT_BLOCK_CONTROLS: ControlDef[] = [
	blockToggle(
		'post-featured-image',
		__('Featured Image', 'blockera'),
		postFeaturedImagePanel(),
		SINGULAR_CONTENT_BLOCK_OPTIONS
	),
	blockToggle('post-title', __('Title', 'blockera'), postTitlePanel(), {
		...SINGULAR_CONTENT_BLOCK_OPTIONS,
		defaultValue: false,
	}),
	blockToggle('post-excerpt', __('Excerpt', 'blockera'), postExcerptPanel(), {
		...SINGULAR_CONTENT_BLOCK_OPTIONS,
		defaultValue: false,
	}),
	blockToggle(
		'post-content',
		__('Full Post Content', 'blockera'),
		postContentPanel(),
		SINGULAR_CONTENT_BLOCK_OPTIONS
	),
	blockToggle(
		'post-read-more',
		__('Read More Button', 'blockera'),
		postReadMoreButtonPanel(),
		{
			...SINGULAR_CONTENT_BLOCK_OPTIONS,
			defaultValue: false,
		}
	),
	postMetaPanel({
		instance: 1,
		defaultValue: true,
		insert: {
			relativeTo: 'body',
			position: 'inside-end',
		},
		rowInnerOrder: ARTICLE_BLOCK_INNER_ORDER,
		requireAtLeastOneOf: ARTICLE_BLOCK_IDS,
	}),
	postMetaPanel({
		instance: 2,
		defaultValue: false,
		insert: {
			relativeTo: 'body',
			position: 'inside-end',
		},
		rowInnerOrder: ARTICLE_BLOCK_INNER_ORDER,
		requireAtLeastOneOf: ARTICLE_BLOCK_IDS,
	}),
];

export function singularContentGroup(): PanelGroupDef {
	return {
		id: 'article',
		title: __('Post Content', 'blockera'),
		sortable: true,
		controls: SINGULAR_CONTENT_BLOCK_CONTROLS,
		nestedPanel: {
			id: 'article',
			title: __('Post Content', 'blockera'),
			gatewayLabel: __('Styles & Blocks', 'blockera'),
			scrollTarget: 'article',
			groups: [
				{
					id: 'article-styles',
					title: __('Styles', 'blockera'),
					controls: [
						customizeInEditorFeature(
							SINGULAR_CONTENT_TARGET,
							'article-customize'
						),
					],
				},
				{
					id: 'article-blocks',
					title: __('Blocks', 'blockera'),
					sortable: true,
					controls: SINGULAR_CONTENT_BLOCK_CONTROLS,
				},
			],
		},
	};
}
