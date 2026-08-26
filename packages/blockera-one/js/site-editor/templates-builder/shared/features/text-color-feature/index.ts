/**
 * Text Color feature — Blockera font color on a stamped section.
 * Inspector UI is ColorControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function textColorFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'color',
			label: __('Text Color', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
			controlAddonTypes: ['variable'],
			variableTypes: ['color'],
		},
		options
	);
}
