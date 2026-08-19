/**
 * Is Link feature — `isLink` on a stamped section (image, title, …).
 * Inspector UI is ToggleControlRow. Override `label` per block
 * (default remains “Make image a link”).
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function isLinkFeature(
	target: SectionTarget,
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
