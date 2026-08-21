/**
 * Global header template-part options config.
 *
 * Design / Settings stay visible. Sticky is a broadcast setting applied to
 * `layout/site-header` (and stamped `section/header` chrome). The panel edits
 * the canonical `wp_template_part` (slug `header`), not a wp_template.
 * Purpose-nav label stays "Header".
 */

import { __ } from '@wordpress/i18n';

import { createPartsAreaConfig } from '../shared/sections';

export const GLOBAL_HEADER_OPTIONS_CONFIG = createPartsAreaConfig({
	type: 'global-header',
	title: __('Header', 'blockera'),
	partsArea: 'header',
	layoutId: 'site-header',
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
			controls: [
				{
					id: 'header-sticky',
					type: 'toggle',
					label: __('Sticky Header', 'blockera'),
					target: { kind: 'setting', id: 'header-sticky' },
					operation: 'broadcastSetting',
					broadcastId: 'header-sticky',
					settingPath: 'header_sticky',
					onValue: true,
					offValue: false,
					defaultValue: false,
				},
			],
		},
	],
});
