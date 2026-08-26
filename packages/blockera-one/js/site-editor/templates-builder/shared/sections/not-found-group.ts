/**
 * 404 Template group factory (design picker + inner blocks).
 */

import { __ } from '@wordpress/i18n';

import { customizeInEditorFeature } from '../features';
import type { ControlDef, PanelGroupDef, SectionTarget } from '../types';
import { emptyDesignPanel, blockToggle } from './section-blocks';

const NOT_FOUND_TARGET: SectionTarget = {
	kind: 'section',
	id: 'not-found',
};

const NOT_FOUND_IDS = [
	'not-found-image',
	'not-found-title',
	'not-found-description',
	'not-found-search',
];

const NOT_FOUND_INNER_ORDER = {
	parentId: 'not-found',
	ids: NOT_FOUND_IDS,
};

const DESIGN: ControlDef = {
	id: 'not-found-design',
	type: 'layout-picker',
	target: NOT_FOUND_TARGET,
	operation: 'swapSection',
	catalogPool: '404-template',
	swapHints: {
		reapplyControls: NOT_FOUND_IDS,
	},
};

export function notFoundGroup(): PanelGroupDef {
	return {
		id: 'not-found',
		title: __('Template', 'blockera'),
		controls: [DESIGN],
		nestedPanel: {
			id: 'not-found',
			title: __('Template', 'blockera'),
			gatewayLabel: __('Styles & Blocks', 'blockera'),
			scrollTarget: 'not-found',
			groups: [
				{
					id: 'not-found-layout',
					title: __('Layout', 'blockera'),
					controls: [DESIGN],
				},
				{
					id: 'not-found-styles',
					title: __('Styles', 'blockera'),
					controls: [
						customizeInEditorFeature(
							NOT_FOUND_TARGET,
							'not-found-customize'
						),
					],
				},
				{
					id: 'not-found-blocks',
					title: __('Blocks', 'blockera'),
					sortable: true,
					controls: [
						blockToggle(
							'not-found-image',
							__('Image', 'blockera'),
							emptyDesignPanel(
								'not-found-image',
								__('Image', 'blockera')
							),
							{
								insert: {
									relativeTo: 'not-found',
									position: 'inside-start',
								},
								innerOrder: NOT_FOUND_INNER_ORDER,
								requireAtLeastOneOf: NOT_FOUND_IDS,
							}
						),
						blockToggle(
							'not-found-title',
							__('Title', 'blockera'),
							emptyDesignPanel(
								'not-found-title',
								__('Title', 'blockera')
							),
							{
								insert: {
									relativeTo: 'not-found',
									position: 'inside-end',
								},
								innerOrder: NOT_FOUND_INNER_ORDER,
								requireAtLeastOneOf: NOT_FOUND_IDS,
							}
						),
						blockToggle(
							'not-found-description',
							__('Description', 'blockera'),
							emptyDesignPanel(
								'not-found-description',
								__('Description', 'blockera')
							),
							{
								insert: {
									relativeTo: 'not-found',
									position: 'inside-end',
								},
								innerOrder: NOT_FOUND_INNER_ORDER,
								requireAtLeastOneOf: NOT_FOUND_IDS,
							}
						),
						blockToggle(
							'not-found-search',
							__('Search Form', 'blockera'),
							emptyDesignPanel(
								'not-found-search',
								__('Search Form', 'blockera')
							),
							{
								insert: {
									relativeTo: 'not-found',
									position: 'inside-end',
								},
								innerOrder: NOT_FOUND_INNER_ORDER,
								requireAtLeastOneOf: NOT_FOUND_IDS,
							}
						),
					],
				},
			],
		},
	};
}
