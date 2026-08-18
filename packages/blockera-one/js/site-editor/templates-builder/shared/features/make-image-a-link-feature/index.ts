/**
 * Make Image a Link feature — `isLink` on a stamped image section.
 * Inspector UI is ToggleControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';

export function makeImageALinkFeature(
	target: SectionTarget,
	id: string
): ControlDef {
	return {
		id,
		type: 'toggle',
		label: __('Make image a link', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'isLink',
		defaultValue: true,
	};
}
