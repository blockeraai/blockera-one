/**
 * Spacing feature — merge keys on `blockeraSpacing.value`.
 * Inspector UI is InputControlRow. Use for margin, padding, or any
 * spacing-box sides (bottom, top, vertical padding, …).
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export type SpacingFeatureOptions = FeatureOptions & {
	attributeMergeKeys: NonNullable<ControlDef['attributeMergeKeys']>;
};

export function spacingFeature(
	target: SectionTarget,
	id: string,
	options: SpacingFeatureOptions
): ControlDef {
	const { attributeMergeKeys, unitType, label, ...rest } = options;
	return withFeatureOptions(
		{
			id,
			type: 'input',
			label: label ?? __('Spacing', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraSpacing.value',
			attributeMergeKeys,
			unitType: unitType ?? 'margin',
			controlAddonTypes: ['variable'],
			variableTypes: ['spacing'],
		},
		rest
	);
}
