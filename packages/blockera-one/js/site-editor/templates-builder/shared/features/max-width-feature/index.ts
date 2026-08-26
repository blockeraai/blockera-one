/**
 * Max Width feature — Blockera max-width, stretching width to match.
 * Inspector UI is InputControlRow. Override `alsoWrite` to skip stretch.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef } from '../../types';
import {
	type FeatureOptions,
	type FeatureTarget,
	withFeatureOptions,
} from '../helpers';

const STRETCH_WIDTH = [
	{
		attributePath: 'blockeraWidth.value',
		value: 'stretch',
	},
];

export function maxWidthFeature(
	target: FeatureTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'input',
			label: __('Max Width', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'blockeraMaxWidth.value',
			alsoWrite: STRETCH_WIDTH,
			unitType: 'max-width',
			controlAddonTypes: ['variable'],
			variableTypes: ['width-size', 'spacing'],
			min: 0,
		},
		options
	);
}
