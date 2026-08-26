/**
 * Pagination item nested panels — previous, numbers, next.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, NestedPanelDef, SectionTarget } from '../types';
import {
	backgroundColorFeature,
	customizeInEditorFeature,
	fontSizeFeature,
	styleVariationPickerFeature,
	textColorFeature,
} from '../features';
import { createBlockSubpanel } from './helpers';

type PaginationItemPanelOptions = {
	targetId: string;
	title: string;
	controlPrefix: string;
	stylesGroupId: string;
	settingsGroupId: string;
	settings: ControlDef[];
};

function paginationItemPanel(
	options: PaginationItemPanelOptions
): NestedPanelDef {
	const target: SectionTarget = { kind: 'section', id: options.targetId };

	return createBlockSubpanel({
		id: options.targetId,
		title: options.title,
		stylesGroupId: options.stylesGroupId,
		settingsGroupId: options.settingsGroupId,
		keepVisible: false,
		styles: [
			styleVariationPickerFeature(
				target,
				`${options.controlPrefix}-style`
			),
			textColorFeature(target, `${options.controlPrefix}-color`),
			backgroundColorFeature(target, `${options.controlPrefix}-bg-color`),
			fontSizeFeature(target, `${options.controlPrefix}-font-size`),
			customizeInEditorFeature(
				target,
				`${options.controlPrefix}-customize`
			),
		],
		settings: options.settings,
	});
}

export function paginationPreviousPanel(): NestedPanelDef {
	const target: SectionTarget = {
		kind: 'section',
		id: 'pagination-previous',
	};
	return paginationItemPanel({
		targetId: 'pagination-previous',
		title: __('Previous Page', 'blockera'),
		controlPrefix: 'pagination-prev',
		stylesGroupId: 'pagination-prev-styles',
		settingsGroupId: 'pagination-prev-settings',
		settings: [
			{
				id: 'pagination-previous-label',
				type: 'input',
				label: __('Label', 'blockera'),
				target,
				operation: 'setSectionAttribute',
				attributePath: 'label',
				// Core edit() paints `label` as PlainText (placeholder
				// only when empty). Persist the same default PHP uses.
				defaultValue: __('Previous Page', 'blockera'),
			},
		],
	});
}

export function paginationNumbersPanel(): NestedPanelDef {
	const target: SectionTarget = {
		kind: 'section',
		id: 'pagination-numbers',
	};
	return paginationItemPanel({
		targetId: 'pagination-numbers',
		title: __('Numbers', 'blockera'),
		controlPrefix: 'pagination-num',
		stylesGroupId: 'pagination-num-styles',
		settingsGroupId: 'pagination-num-settings',
		settings: [
			{
				id: 'pagination-numbers-mid-size',
				type: 'number',
				label: __('Number of links', 'blockera'),
				target,
				operation: 'setSectionAttribute',
				attributePath: 'midSize',
				defaultValue: 2,
				min: 0,
				max: 5,
				step: 1,
				labelDescription: __(
					'Specify how many links can appear before and after the current page number. Links to the first, current and last page are always visible.',
					'blockera'
				),
			},
		],
	});
}

export function paginationNextPanel(): NestedPanelDef {
	const target: SectionTarget = { kind: 'section', id: 'pagination-next' };
	return paginationItemPanel({
		targetId: 'pagination-next',
		title: __('Next Page', 'blockera'),
		controlPrefix: 'pagination-next',
		stylesGroupId: 'pagination-next-styles',
		settingsGroupId: 'pagination-next-settings',
		settings: [
			{
				id: 'pagination-next-label',
				type: 'input',
				label: __('Label', 'blockera'),
				target,
				operation: 'setSectionAttribute',
				attributePath: 'label',
				defaultValue: __('Next Page', 'blockera'),
			},
		],
	});
}
