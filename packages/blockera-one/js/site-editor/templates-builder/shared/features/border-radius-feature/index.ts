/**
 * Border Radius feature — Blockera radius on a stamped section.
 * Inspector UI is BorderRadiusControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';

const EMPTY_RADIUS = {
	type: 'all',
	all: '',
};

export function borderRadiusFeature(
	target: SectionTarget,
	id: string
): ControlDef {
	return {
		id,
		type: 'border-radius',
		label: __('Border Radius', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'blockeraBorderRadius.value',
		defaultValue: EMPTY_RADIUS,
		controlAddonTypes: ['variable'],
		variableTypes: ['border-radius'],
	};
}
