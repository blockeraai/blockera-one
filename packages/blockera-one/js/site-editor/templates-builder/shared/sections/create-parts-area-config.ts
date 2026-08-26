/**
 * Factory for template-part (header / footer / sidebar) options configs.
 */

import { __ } from '@wordpress/i18n';

import type { PanelGroupDef, TemplateOptionsConfig } from '../types';

function defaultPartsAreaGroups(): PanelGroupDef[] {
	return [
		{
			id: 'design',
			title: __('Design', 'blockera'),
			keepVisible: true,
			controls: [],
		},
		{
			id: 'settings',
			title: __('Settings', 'blockera'),
			keepVisible: true,
			controls: [],
		},
	];
}

export type PartsAreaConfigArgs = {
	type: string;
	title: string;
	partsArea: string;
	layoutId: string;
	groups?: PanelGroupDef[];
};

export function createPartsAreaConfig({
	type,
	title,
	partsArea,
	layoutId,
	groups,
}: PartsAreaConfigArgs): TemplateOptionsConfig {
	return {
		type,
		title,
		filters: [],
		partsAreas: [partsArea],
		entityPostType: 'wp_template_part',
		layoutId,
		groups: groups ?? defaultPartsAreaGroups(),
	};
}
