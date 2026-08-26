/**
 * Text Align feature — Blockera text align on a stamped section.
 * Inspector UI is TextAlignControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function textAlignFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'text-align',
			label: __('Text Align', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraTextAlign.value',
		},
		options
	);
}
