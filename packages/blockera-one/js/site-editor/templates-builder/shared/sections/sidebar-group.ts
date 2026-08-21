/**
 * Sidebar top-level group factory.
 */

import { __ } from '@wordpress/i18n';

import type { PanelGroupDef } from '../types';

export function sidebarGroup(): PanelGroupDef {
	return {
		id: 'sidebar',
		title: __('Sidebar', 'blockera'),
		headerToggle: {
			id: 'sidebar',
			type: 'toggle',
			label: __('Sidebar', 'blockera'),
			target: { kind: 'layout', id: 'main' },
			operation: 'transplantLayout',
			onValue: 'sidebar-right',
			offValue: 'no-sidebar',
			defaultValue: false,
			catalogPool: 'layout',
		},
		controls: [],
		nestedPanel: {
			id: 'sidebar',
			title: __('Sidebar', 'blockera'),
			groups: [
				{
					id: 'sidebar-layout',
					title: __('Layout', 'blockera'),
					controls: [
						{
							id: 'sidebar-position',
							type: 'layout-picker',
							scrollTarget: 'sidebar',
							target: {
								kind: 'layout',
								id: 'main',
							},
							operation: 'transplantLayout',
							conditions: [
								{ controlId: 'sidebar', equals: true },
							],
							// Position picker hides the toggle-off
							// layout; pool order shows Left, Right.
							catalogPool: 'layout',
							catalogExclude: ['no-sidebar'],
						},
					],
				},
			],
		},
	};
}
