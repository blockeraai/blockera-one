/**
 * Global footer template-part options config.
 *
 * Design / Settings stay visible as empty shells until controls land. The
 * panel edits the canonical `wp_template_part` (slug `footer`), not a
 * wp_template. Purpose-nav label stays "Footer".
 */

import { __ } from '@wordpress/i18n';

import { createPartsAreaConfig } from '../shared/sections';

export const GLOBAL_FOOTER_OPTIONS_CONFIG = createPartsAreaConfig({
	type: 'global-footer',
	title: __('Footer', 'blockera'),
	partsArea: 'footer',
	layoutId: 'site-footer',
});
