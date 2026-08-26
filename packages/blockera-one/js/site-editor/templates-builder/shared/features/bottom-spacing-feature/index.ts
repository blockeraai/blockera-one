/**
 * Bottom Spacing feature — margin-bottom on a stamped section.
 * Convenience wrapper around `spacingFeature`.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import type { FeatureOptions } from '../helpers';
import { spacingFeature } from '../spacing-feature';

export function bottomSpacingFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return spacingFeature(target, id, {
		attributeMergeKeys: ['margin.bottom'],
		unitType: 'margin',
		label: __('Bottom Spacing', 'blockera'),
		...options,
	});
}
