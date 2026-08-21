/**
 * Site Footer top-level group factory.
 */

import { __ } from '@wordpress/i18n';

import { customizeInEditorFeature } from '../features';
import type { PanelGroupDef, SectionTarget } from '../types';

const FOOTER_STACKED_PLACEMENT = {
	relativeTo: 'main',
	position: 'after' as const,
};

const FOOTER_SECTION: SectionTarget = {
	kind: 'section',
	id: 'footer',
};

export function siteFooterGroup(): PanelGroupDef {
	return {
		id: 'site-footer',
		title: __('Site Footer', 'blockera'),
		headerToggle: {
			id: 'footer',
			type: 'toggle',
			label: __('Site Footer', 'blockera'),
			target: { kind: 'section', id: 'footer' },
			operation: 'toggleSection',
			onValue: true,
			offValue: false,
			defaultValue: true,
			catalogPool: 'footer',
			insert: FOOTER_STACKED_PLACEMENT,
		},
		controls: [],
		nestedPanel: {
			id: 'site-footer',
			title: __('Site Footer', 'blockera'),
			groups: [
				{
					id: 'footer-layout',
					title: __('Layout', 'blockera'),
					controls: [
						{
							id: 'footer-design',
							type: 'layout-picker',
							target: FOOTER_SECTION,
							operation: 'swapTemplatePart',
							conditions: [{ controlId: 'footer', equals: true }],
							catalogPool: 'footer',
						},
					],
				},
				{
					id: 'footer-styles',
					title: __('Styles', 'blockera'),
					keepVisible: true,
					controls: [
						customizeInEditorFeature(
							FOOTER_SECTION,
							'footer-customize'
						),
					],
				},
			],
		},
	};
}
