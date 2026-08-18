/**
 * Global header template-part options config.
 *
 * Design / Settings stay visible as empty shells until controls land. The
 * panel edits the canonical `wp_template_part` (slug `header`), not a
 * wp_template. Purpose-nav label stays "Header".
 */

import { __ } from '@wordpress/i18n';

import type { TemplateOptionsConfig } from '../shared/types';

export const GLOBAL_HEADER_OPTIONS_CONFIG: TemplateOptionsConfig = {
	type: 'global-header',
	title: __('Header', 'blockera'),
	filters: [],
	partsAreas: ['header'],
	entityPostType: 'wp_template_part',
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
			controls: [],
		},
	],
};
