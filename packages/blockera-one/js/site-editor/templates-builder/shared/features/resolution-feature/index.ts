/**
 * Resolution feature — image sizeSlug on a stamped section.
 * Inspector UI is ResolutionControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function resolutionFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'resolution',
			label: __('Resolution', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'sizeSlug',
			defaultValue: 'full',
		},
		options
	);
}
