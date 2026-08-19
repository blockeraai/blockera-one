/**
 * Font Size feature — Blockera font size on a stamped section.
 * Inspector UI is InputControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function fontSizeFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'input',
			label: __('Font Size', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
			unitType: 'essential',
			controlAddonTypes: ['variable'],
			variableTypes: ['font-size'],
			min: 0,
		},
		options
	);
}
