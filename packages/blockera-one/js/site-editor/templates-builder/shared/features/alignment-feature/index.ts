/**
 * Alignment feature — locked-column flex alignment on a section or container.
 * Inspector UI is LayoutMatrixControlRow (axis radios hidden).
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef } from '../../types';
import {
	type FeatureOptions,
	type FeatureTarget,
	withFeatureOptions,
} from '../helpers';

export function alignmentFeature(
	target: FeatureTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'layout-matrix',
			label: __('Alignment', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFlexLayout.value',
			isDirectionActive: false,
			isAxisControlsActive: false,
			defaultDirection: 'column',
		},
		options
	);
}
