/**
 * Global sidebar template-part options config.
 *
 * The panel edits the canonical `wp_template_part` (slug `sidebar`), not a
 * wp_template. Purpose-nav label stays "Sidebar".
 */

import { __ } from '@wordpress/i18n';

import { createPartsAreaConfig, sidebarBlocksGroup } from '../shared/sections';

export const GLOBAL_SIDEBAR_OPTIONS_CONFIG = createPartsAreaConfig({
	type: 'global-sidebar',
	title: __('Sidebar', 'blockera'),
	partsArea: 'sidebar',
	layoutId: 'site-sidebar',
	groups: [
		{
			id: 'design',
			title: __('Design', 'blockera'),
			keepVisible: true,
			controls: [],
		},
		sidebarBlocksGroup(),
		{
			id: 'settings',
			title: __('Settings', 'blockera'),
			keepVisible: true,
			controls: [
				{
					id: 'sidebar-width',
					type: 'number',
					label: __('Width', 'blockera'),
					target: { kind: 'setting', id: 'sidebar-width' },
					operation: 'broadcastSetting',
					broadcastId: 'sidebar-width',
					settingPath: 'sidebar_width',
					defaultValue: 33.33,
					min: 10,
					max: 60,
					step: 0.01,
				},
			],
		},
	],
});
