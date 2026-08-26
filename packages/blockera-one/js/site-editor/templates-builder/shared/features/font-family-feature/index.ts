/**
 * Font Family feature — Blockera font family on a stamped section.
 * Inspector UI is FontFamilyControlRow (variable support).
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function fontFamilyFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'font-family',
			label: __('Font Family', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontFamily.value',
			controlAddonTypes: ['variable'],
			variableTypes: ['font-family'],
		},
		options
	);
}
