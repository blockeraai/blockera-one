/**
 * Breadcrumbs nested panel — stamp `section/page-header-breadcrumbs`.
 */

import { __ } from '@wordpress/i18n';

import type { NestedPanelDef, SectionTarget } from '../types';
import {
	backgroundColorFeature,
	customizeInEditorFeature,
	fontSizeFeature,
	gapFeature,
	styleVariationPickerFeature,
	textColorFeature,
} from '../features';
import { createBlockSubpanel } from './helpers';

export type BreadcrumbsPanelOptions = {
	targetId?: string;
	controlPrefix?: string;
};

export function breadcrumbsPanel(
	options: BreadcrumbsPanelOptions = {}
): NestedPanelDef {
	const targetId = options.targetId ?? 'page-header-breadcrumbs';
	const prefix = options.controlPrefix ?? 'breadcrumbs';
	const target: SectionTarget = { kind: 'section', id: targetId };

	return createBlockSubpanel({
		id: targetId,
		title: __('Breadcrumbs', 'blockera'),
		stylesGroupId: `${prefix}-styles`,
		settingsGroupId: `${prefix}-settings`,
		keepVisible: false,
		styles: [
			styleVariationPickerFeature(target, `${prefix}-style`),
			textColorFeature(target, `${prefix}-color`),
			backgroundColorFeature(target, `${prefix}-bg-color`),
			fontSizeFeature(target, `${prefix}-font-size`),
			gapFeature(target, `${prefix}-gap`),
			customizeInEditorFeature(target, `${prefix}-customize`),
		],
		settings: [
			{
				id: `${prefix}-separator`,
				type: 'input',
				label: __('Separator', 'blockera'),
				target,
				operation: 'setSectionAttribute',
				attributePath: 'separator',
				defaultValue: '/',
			},
			{
				id: `${prefix}-show-home`,
				type: 'toggle',
				label: __('Show home breadcrumb', 'blockera'),
				target,
				operation: 'setSectionAttribute',
				attributePath: 'showHomeItem',
				defaultValue: true,
			},
			{
				id: `${prefix}-show-current`,
				type: 'toggle',
				label: __('Show current breadcrumb', 'blockera'),
				target,
				operation: 'setSectionAttribute',
				attributePath: 'showCurrentItem',
				defaultValue: true,
			},
		],
	});
}
