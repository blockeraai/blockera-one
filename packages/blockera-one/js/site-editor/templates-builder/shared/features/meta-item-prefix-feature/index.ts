/**
 * Meta item prefix — text input writing a paragraph part inside the wrapper.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';
import { type FeatureOptions, withFeatureOptions } from '../helpers';

export function metaItemPrefixFeature(
	target: SectionTarget,
	id: string,
	options?: FeatureOptions
): ControlDef {
	return withFeatureOptions(
		{
			id,
			type: 'input',
			label: __('Prefix', 'blockera'),
			target,
			operation: 'setMetaItemPart',
			attributePath: 'prefix',
			defaultValue: '',
		},
		options
	);
}
