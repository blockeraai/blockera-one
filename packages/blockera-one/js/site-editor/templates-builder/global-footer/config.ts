/**
 * Global footer template-part options config.
 *
 * Design / Settings stay visible as empty shells until controls land. The
 * panel edits the canonical `wp_template_part` (slug `footer`), not a
 * wp_template. Purpose-nav label stays "Footer".
 */

import { __ } from '@wordpress/i18n';

import type { TemplateOptionsConfig } from '../shared/types';

export const GLOBAL_FOOTER_OPTIONS_CONFIG: TemplateOptionsConfig = {
	type: 'global-footer',
	title: __('Footer', 'blockera'),
	filters: [],
	partsAreas: ['footer'],
	entityPostType: 'wp_template_part',
	layoutId: 'site-footer',
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
