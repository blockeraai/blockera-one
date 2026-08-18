/**
 * Open in New Tab feature — `linkTarget` on a stamped image section.
 * Inspector UI is ToggleControlRow. Pass the Make Image a Link control id
 * to hide this row when the image is not a link.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';

export function openInNewTabFeature(
	target: SectionTarget,
	id: string,
	isLinkControlId: string
): ControlDef {
	return {
		id,
		type: 'toggle',
		label: __('Open in new tab', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'linkTarget',
		onValue: '_blank',
		offValue: '_self',
		defaultValue: false,
		conditions: [{ controlId: isLinkControlId, equals: true }],
	};
}
