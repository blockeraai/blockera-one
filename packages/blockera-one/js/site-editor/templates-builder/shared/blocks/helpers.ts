/**
 * Shared factories for Templates Builder nested block subpanels.
 * Type configs (archive, future single, …) import these so the same
 * Styles/Settings screens are not duplicated per template type.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, NestedPanelDef, PanelGroupDef } from '../types';

export function createBlockSubpanel(args: {
	id: string;
	title: string;
	styles: ControlDef[];
	settings?: ControlDef[];
}): NestedPanelDef {
	const groups: PanelGroupDef[] = [
		{
			id: `${args.id}-styles`,
			title: __('Styles', 'blockera'),
			keepVisible: true,
			controls: args.styles,
		},
	];
	if (args.settings?.length) {
		groups.push({
			id: `${args.id}-settings`,
			title: __('Settings', 'blockera'),
			controls: args.settings,
		});
	}
	return {
		id: args.id,
		title: args.title,
		groups,
	};
}
