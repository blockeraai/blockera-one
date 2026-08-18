/**
 * Global sidebar template-part options config.
 *
 * Design / Settings stay visible as empty shells until controls land. The
 * panel edits the canonical `wp_template_part` (slug `sidebar`), not a
 * wp_template. Purpose-nav label stays "Sidebar".
 */

import { __ } from '@wordpress/i18n';

import type { TemplateOptionsConfig } from '../shared/types';

export const GLOBAL_SIDEBAR_OPTIONS_CONFIG: TemplateOptionsConfig = {
	type: 'global-sidebar',
	title: __('Sidebar', 'blockera'),
	filters: [],
	partsAreas: ['sidebar'],
	entityPostType: 'wp_template_part',
	layoutId: 'sidebar-body',
	groups: [
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
	],
};
