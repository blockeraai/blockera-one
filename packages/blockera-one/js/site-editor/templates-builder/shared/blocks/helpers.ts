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
	/** Defaults to `${id}-styles`. */
	stylesGroupId?: string;
	/** Defaults to `${id}-settings`. */
	settingsGroupId?: string;
	/** Styles group stays visible when the parent toggle is off. Default true. */
	keepVisible?: boolean;
}): NestedPanelDef {
	const groups: PanelGroupDef[] = [
		{
			id: args.stylesGroupId ?? `${args.id}-styles`,
			title: __('Styles', 'blockera'),
			keepVisible: args.keepVisible ?? true,
			controls: args.styles,
		},
	];
	if (args.settings?.length) {
		groups.push({
			id: args.settingsGroupId ?? `${args.id}-settings`,
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
