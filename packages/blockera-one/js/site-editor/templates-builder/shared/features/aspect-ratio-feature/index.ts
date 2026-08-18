/**
 * Aspect Ratio feature — Blockera ratio on a stamped section.
 * Inspector UI is AspectRatioControlRow.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, SectionTarget } from '../../types';

const EMPTY_RATIO = {
	val: '',
	width: '',
	height: '',
};

export function aspectRatioFeature(
	target: SectionTarget,
	id: string
): ControlDef {
	return {
		id,
		type: 'aspect-ratio',
		label: __('Aspect Ratio', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'blockeraRatio.value',
		defaultValue: EMPTY_RATIO,
	};
}
