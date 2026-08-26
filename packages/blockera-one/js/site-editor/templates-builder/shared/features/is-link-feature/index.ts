/**
 * Is Link feature — `isLink` on a stamped section (image, title, …).
 * Inspector UI is ToggleControlRow. Override `label` per block
 * (default remains “Make image a link”).
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef } from '../../types';
import {
	type FeatureOptions,
	type FeatureTarget,
	withFeatureOptions,
} from '../helpers';

export function isLinkFeature(
	target: FeatureTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'toggle',
			label: __('Make image a link', 'blockera'),
			target,
			operation: 'setSectionAttribute',
			attributePath: 'isLink',
			defaultValue: true,
		},
		options
	);
}
