/**
 * Meta item icon — IconControl writing a core/icon part inside the wrapper.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';
import { EMPTY_ICON_VALUE } from '../../ops/meta';

export function metaItemIconFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'icon',
			label: __('Icon', 'blockera'),
			target,
			operation: 'setMetaItemPart',
			attributePath: 'icon',
			defaultValue: { ...EMPTY_ICON_VALUE },
		},
		options
	);
}
