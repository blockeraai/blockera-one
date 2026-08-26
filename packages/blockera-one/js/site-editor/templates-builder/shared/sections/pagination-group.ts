/**
 * Pagination top-level group factory.
 */

import { __ } from '@wordpress/i18n';

import {
	paginationNextPanel,
	paginationNumbersPanel,
	paginationPreviousPanel,
} from '../blocks';
import {
	borderFeature,
	customizeInEditorFeature,
	spacingFeature,
	styleVariationPickerFeature,
} from '../features';
import type { PanelGroupDef, SectionTarget } from '../types';

const PAGINATION_INNER_ORDER = {
	parentId: 'pagination',
	ids: ['pagination-previous', 'pagination-numbers', 'pagination-next'],
};

const PAGINATION_REQUIRED = [
	'pagination-previous',
	'pagination-numbers',
	'pagination-next',
];

const PAGINATION_TARGET: SectionTarget = {
	kind: 'section',
	id: 'pagination',
};

const PAGINATION_PREV_TARGET: SectionTarget = {
	kind: 'section',
	id: 'pagination-previous',
};

const PAGINATION_NEXT_TARGET: SectionTarget = {
	kind: 'section',
	id: 'pagination-next',
};

const PAGINATION_NUMBERS_TARGET: SectionTarget = {
	kind: 'section',
	id: 'pagination-numbers',
};

const PAGINATION_ON = [{ controlId: 'pagination', equals: true }];

export function paginationGroup(): PanelGroupDef {
	return {
		id: 'pagination',
		title: __('Pagination', 'blockera'),
		headerToggle: {
			id: 'pagination',
			type: 'toggle',
			label: __('Pagination', 'blockera'),
			target: PAGINATION_TARGET,
			operation: 'toggleSection',
			onValue: true,
			offValue: false,
			defaultValue: true,
			insert: {
				relativeTo: 'posts-listing',
				position: 'inside-end',
			},
			catalogPool: 'pagination',
		},
		controls: [],
		nestedPanel: {
			id: 'pagination',
			title: __('Pagination', 'blockera'),
			groups: [
				{
					id: 'pagination-layout',
					title: __('Layout', 'blockera'),
					controls: [
						{
							id: 'pagination-design',
							type: 'layout-picker',
							target: PAGINATION_TARGET,
							operation: 'swapSection',
							catalogPool: 'pagination',
							conditions: PAGINATION_ON,
							swapHints: {
								reapplyControls: [
									'pagination-previous',
									'pagination-numbers',
									'pagination-next',
									'pagination-style',
									'pagination-top-divider',
									'pagination-top-spacing',
								],
							},
						},
					],
				},
				{
					id: 'pagination-styles',
					title: __('Styles', 'blockera'),
					controls: [
						styleVariationPickerFeature(
							PAGINATION_TARGET,
							'pagination-style',
							{ conditions: PAGINATION_ON }
						),
						borderFeature(
							PAGINATION_TARGET,
							'pagination-top-divider',
							{
								label: __('Top Divider', 'blockera'),
								borderSide: 'top',
								conditions: PAGINATION_ON,
								mirrorMergeWhen: {
									whenControlId: 'pagination-top-spacing',
									mergeKeys: ['padding.top'],
									role: 'divider',
									attributePath: 'blockeraSpacing.value',
								},
							}
						),
						spacingFeature(
							PAGINATION_TARGET,
							'pagination-top-spacing',
							{
								label: __('Top Spacing', 'blockera'),
								attributeMergeKeys: ['margin.top'],
								unitType: 'margin',
								conditions: PAGINATION_ON,
								mirrorMergeWhen: {
									whenControlId: 'pagination-top-divider',
									mergeKeys: ['padding.top'],
									role: 'spacing',
								},
							}
						),
						customizeInEditorFeature(
							PAGINATION_TARGET,
							'pagination-customize',
							{ conditions: PAGINATION_ON }
						),
					],
				},
				{
					id: 'pagination-blocks',
					title: __('Blocks', 'blockera'),
					controls: [
						{
							id: 'pagination-previous',
							type: 'toggle',
							label: __('Previous Page', 'blockera'),
							target: PAGINATION_PREV_TARGET,
							operation: 'toggleSection',
							onValue: true,
							offValue: false,
							defaultValue: true,
							catalogPool: 'pagination-previous',
							insert: {
								relativeTo: 'pagination',
								position: 'inside-start',
							},
							innerOrder: PAGINATION_INNER_ORDER,
							requireAtLeastOneOf: PAGINATION_REQUIRED,
							conditions: PAGINATION_ON,
							nestedPanel: paginationPreviousPanel(),
						},
						{
							id: 'pagination-numbers',
							type: 'toggle',
							label: __('Numbers', 'blockera'),
							target: PAGINATION_NUMBERS_TARGET,
							operation: 'toggleSection',
							onValue: true,
							offValue: false,
							defaultValue: true,
							catalogPool: 'pagination-numbers',
							insert: {
								relativeTo: 'pagination',
								position: 'inside-start',
							},
							innerOrder: PAGINATION_INNER_ORDER,
							requireAtLeastOneOf: PAGINATION_REQUIRED,
							conditions: PAGINATION_ON,
							nestedPanel: paginationNumbersPanel(),
						},
						{
							id: 'pagination-next',
							type: 'toggle',
							label: __('Next Page', 'blockera'),
							target: PAGINATION_NEXT_TARGET,
							operation: 'toggleSection',
							onValue: true,
							offValue: false,
							defaultValue: true,
							catalogPool: 'pagination-next',
							insert: {
								relativeTo: 'pagination',
								position: 'inside-end',
							},
							innerOrder: PAGINATION_INNER_ORDER,
							requireAtLeastOneOf: PAGINATION_REQUIRED,
							conditions: PAGINATION_ON,
							nestedPanel: paginationNextPanel(),
						},
					],
				},
			],
		},
	};
}
