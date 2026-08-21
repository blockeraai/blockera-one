/**
 * Next/Prev post navigation group factory.
 */

import { __ } from '@wordpress/i18n';

import { customizeInEditorFeature } from '../features';
import type { PanelGroupDef, SectionTarget } from '../types';
import { emptyDesignPanel } from './section-blocks';

const NAV_TARGET: SectionTarget = {
	kind: 'section',
	id: 'post-navigation',
};

const NAV_ON = [{ controlId: 'post-navigation', equals: true }];

const NAV_INNER_ORDER = {
	parentId: 'post-navigation',
	ids: ['post-navigation-previous', 'post-navigation-next'],
};

const NAV_REQUIRED = ['post-navigation-previous', 'post-navigation-next'];

const NAV_INSERT = {
	relativeTo: 'body',
	position: 'inside-end' as const,
	ensureContainerOwner: 'article',
};

export function postNavigationGroup(): PanelGroupDef {
	return {
		id: 'post-navigation',
		title: __('Next/Prev Post', 'blockera'),
		headerToggle: {
			id: 'post-navigation',
			type: 'toggle',
			label: __('Next/Prev Post', 'blockera'),
			target: NAV_TARGET,
			operation: 'toggleSection',
			onValue: true,
			offValue: false,
			defaultValue: true,
			insert: NAV_INSERT,
			catalogPool: 'post-navigation',
		},
		controls: [],
		nestedPanel: {
			id: 'post-navigation',
			title: __('Next/Prev Post', 'blockera'),
			gatewayLabel: __('Styles & Blocks', 'blockera'),
			groups: [
				{
					id: 'post-navigation-styles',
					title: __('Styles', 'blockera'),
					controls: [
						customizeInEditorFeature(
							NAV_TARGET,
							'post-navigation-customize',
							{ conditions: NAV_ON }
						),
					],
				},
				{
					id: 'post-navigation-blocks',
					title: __('Blocks', 'blockera'),
					sortable: true,
					controls: [
						{
							id: 'post-navigation-previous',
							type: 'toggle',
							label: __('Previous Post', 'blockera'),
							target: {
								kind: 'section',
								id: 'post-navigation-previous',
							},
							operation: 'toggleSection',
							onValue: true,
							offValue: false,
							defaultValue: true,
							catalogPool: 'post-navigation-previous',
							insert: {
								relativeTo: 'post-navigation',
								position: 'inside-start',
							},
							innerOrder: NAV_INNER_ORDER,
							requireAtLeastOneOf: NAV_REQUIRED,
							conditions: NAV_ON,
							nestedPanel: emptyDesignPanel(
								'post-navigation-previous',
								__('Previous Post', 'blockera')
							),
						},
						{
							id: 'post-navigation-next',
							type: 'toggle',
							label: __('Next Post', 'blockera'),
							target: {
								kind: 'section',
								id: 'post-navigation-next',
							},
							operation: 'toggleSection',
							onValue: true,
							offValue: false,
							defaultValue: true,
							catalogPool: 'post-navigation-next',
							insert: {
								relativeTo: 'post-navigation',
								position: 'inside-end',
							},
							innerOrder: NAV_INNER_ORDER,
							requireAtLeastOneOf: NAV_REQUIRED,
							conditions: NAV_ON,
							nestedPanel: emptyDesignPanel(
								'post-navigation-next',
								__('Next Post', 'blockera')
							),
						},
					],
				},
			],
		},
	};
}
