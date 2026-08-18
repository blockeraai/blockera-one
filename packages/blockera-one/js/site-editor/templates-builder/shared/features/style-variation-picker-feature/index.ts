/**
 * Style Variation Picker feature — block style picker on a stamped section.
 * Inspector UI is BlockStyleSelect (`shared/controls/block-style-select`).
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';

export function styleVariationPickerFeature(
	target: SectionTarget,
	id: string
): ControlDef {
	return {
		id,
		type: 'select',
		label: __('Style Variation', 'blockera'),
		target,
		operation: 'setBlockStyle',
		defaultValue: 'default',
	};
}
