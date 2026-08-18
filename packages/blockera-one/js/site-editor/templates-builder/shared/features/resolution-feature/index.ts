/**
 * Resolution feature — image sizeSlug on a stamped section.
 * Inspector UI is ResolutionControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';

export function resolutionFeature(
	target: SectionTarget,
	id: string
): ControlDef {
	return {
		id,
		type: 'resolution',
		label: __('Resolution', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'sizeSlug',
		defaultValue: 'full',
	};
}
