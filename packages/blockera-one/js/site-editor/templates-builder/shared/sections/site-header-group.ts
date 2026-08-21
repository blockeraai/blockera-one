/**
 * Site Header top-level group factory.
 */

import { __ } from '@wordpress/i18n';

import { customizeInEditorFeature } from '../features';
import type { PanelGroupDef, SectionTarget } from '../types';

const HEADER_STACKED_PLACEMENT = {
	relativeTo: 'main',
	position: 'before' as const,
};

const HEADER_SECTION: SectionTarget = {
	kind: 'section',
	id: 'header',
};

export function siteHeaderGroup(): PanelGroupDef {
	return {
		id: 'site-header',
		title: __('Site Header', 'blockera'),
		headerToggle: {
			id: 'header',
			type: 'toggle',
			label: __('Site Header', 'blockera'),
			target: { kind: 'section', id: 'header' },
			operation: 'toggleSection',
			onValue: true,
			offValue: false,
			defaultValue: true,
			catalogPool: 'header',
			insert: HEADER_STACKED_PLACEMENT,
		},
		controls: [],
		nestedPanel: {
			id: 'site-header',
			title: __('Site Header', 'blockera'),
			groups: [
				{
					id: 'header-layout',
					title: __('Layout', 'blockera'),
					controls: [
						{
							id: 'header-design',
							type: 'layout-picker',
							target: HEADER_SECTION,
							operation: 'swapTemplatePart',
							conditions: [{ controlId: 'header', equals: true }],
							catalogPool: 'header',
						},
					],
				},
				{
					id: 'header-styles',
					title: __('Styles', 'blockera'),
					keepVisible: true,
					controls: [
						customizeInEditorFeature(
							HEADER_SECTION,
							'header-customize'
						),
					],
				},
			],
		},
	};
}
