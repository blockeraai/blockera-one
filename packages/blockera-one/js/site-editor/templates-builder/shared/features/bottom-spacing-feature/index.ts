/**
 * Bottom Spacing feature — margin-bottom on a stamped section.
 * Inspector UI is InputControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';

export function bottomSpacingFeature(
	target: SectionTarget,
	id: string
): ControlDef {
	return {
		id,
		type: 'input',
		label: __('Bottom Spacing', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'blockeraSpacing.value',
		attributeMergeKeys: ['margin.bottom'],
		unitType: 'margin',
		controlAddonTypes: ['variable'],
		variableTypes: ['spacing'],
	};
}
