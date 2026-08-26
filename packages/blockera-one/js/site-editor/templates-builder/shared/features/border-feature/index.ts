/**
 * Border feature — Blockera border on a stamped section (optionally one side).
 * Inspector UI is BorderControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function borderFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'border',
			label: __('Border', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraBorder.value',
		},
		options
	);
}
