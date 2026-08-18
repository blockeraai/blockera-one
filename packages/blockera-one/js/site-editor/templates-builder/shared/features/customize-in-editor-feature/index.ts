/**
 * Customize in Editor feature — jump the canvas to the stamped section.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';

export function customizeInEditorFeature(
	target: SectionTarget,
	id: string
): ControlDef {
	return {
		id,
		type: 'button',
		label: __('Customize in editor', 'blockera'),
		target,
		operation: 'selectInCanvas',
	};
}
