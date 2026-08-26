/**
 * Customize in Editor feature — jump the canvas to the stamped section.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function customizeInEditorFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'button',
			label: __('Customize in editor', 'blockera'),
			target,
			operation: 'selectInCanvas',
		},
		options
	);
}
