/**
 * Min Height feature — Blockera min-height on a stamped section.
 * Inspector UI is InputControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function minHeightFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'input',
			label: __('Min Height', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraMinHeight.value',
			unitType: 'min-height',
			controlAddonTypes: ['variable'],
			variableTypes: ['width-size', 'spacing'],
			min: 0,
		},
		options
	);
}
