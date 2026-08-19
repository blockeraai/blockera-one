/**
 * Background Color feature — Blockera background color on a stamped section.
 * Inspector UI is ColorControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function backgroundColorFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'color',
			label: __('BG Color', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraBackgroundColor.value',
			controlAddonTypes: ['variable'],
			variableTypes: ['color'],
		},
		options
	);
}
