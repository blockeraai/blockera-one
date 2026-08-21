/**
 * Comments section group factory (`section/post-comments`).
 *
 * Insert `relativeTo: 'comments'` is the inner `container/comments` slot,
 * not the comments section stamp.
 */

import { __ } from '@wordpress/i18n';

import { customizeInEditorFeature } from '../features';
import type { PanelGroupDef, SectionTarget } from '../types';
import { emptyDesignPanel } from './section-blocks';

const COMMENTS_TARGET: SectionTarget = {
	kind: 'section',
	id: 'post-comments',
};

const COMMENTS_ON = [{ controlId: 'post-comments', equals: true }];

const COMMENTS_INNER_ORDER = {
	parentId: 'post-comments',
	ids: [
		'comments-title',
		'comment-template',
		'comments-pagination',
		'comments-form',
	],
};

const COMMENTS_INSERT = {
	relativeTo: 'comments',
	position: 'inside-end' as const,
	ensureContainerOwner: 'article',
};

function commentBlock(
	id: string,
	label: string,
	position: 'inside-start' | 'inside-end' = 'inside-end'
) {
	return {
		id,
		type: 'toggle' as const,
		label,
		target: { kind: 'section' as const, id },
		operation: 'toggleSection' as const,
		onValue: true,
		offValue: false,
		defaultValue: true,
		catalogPool: id,
		insert: {
			relativeTo: 'post-comments',
			position,
		},
		innerOrder: COMMENTS_INNER_ORDER,
		conditions: COMMENTS_ON,
		nestedPanel: emptyDesignPanel(id, label),
	};
}

export function postCommentsGroup(): PanelGroupDef {
	return {
		id: 'post-comments',
		title: __('Comments', 'blockera'),
		headerToggle: {
			id: 'post-comments',
			type: 'toggle',
			label: __('Comments', 'blockera'),
			target: COMMENTS_TARGET,
			operation: 'toggleSection',
			onValue: true,
			offValue: false,
			defaultValue: true,
			insert: COMMENTS_INSERT,
			catalogPool: 'post-comments',
		},
		controls: [],
		nestedPanel: {
			id: 'post-comments',
			title: __('Comments', 'blockera'),
			gatewayLabel: __('Styles & Blocks', 'blockera'),
			groups: [
				{
					id: 'comments-styles',
					title: __('Styles', 'blockera'),
					controls: [
						customizeInEditorFeature(
							COMMENTS_TARGET,
							'comments-customize',
							{ conditions: COMMENTS_ON }
						),
					],
				},
				{
					id: 'comments-blocks',
					title: __('Blocks', 'blockera'),
					sortable: true,
					controls: [
						commentBlock(
							'comments-title',
							__('Title', 'blockera'),
							'inside-start'
						),
						commentBlock(
							'comment-template',
							__('Comment List', 'blockera')
						),
						commentBlock(
							'comments-pagination',
							__('Pagination', 'blockera')
						),
						commentBlock(
							'comments-form',
							__('Comment Form', 'blockera')
						),
					],
				},
			],
		},
	};
}
