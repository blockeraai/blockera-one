/**
 * Gap feature — Blockera gap on a stamped section.
 * Inspector UI is InputControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function gapFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'input',
			label: __('Gap', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
			unitType: 'essential',
			controlAddonTypes: ['variable'],
			variableTypes: ['spacing'],
		},
		options
	);
}
