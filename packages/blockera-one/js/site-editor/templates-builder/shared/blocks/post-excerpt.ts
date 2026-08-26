/**
 * Post Excerpt nested panel — stamp `section/post-excerpt`.
 * Shared across Posts Loop and singular template types.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, NestedPanelDef, SectionTarget } from '../types';
import {
	bottomSpacingFeature,
	customizeInEditorFeature,
	fontFamilyFeature,
	fontSizeFeature,
	styleVariationPickerFeature,
	textAlignFeature,
	textColorFeature,
} from '../features';
import { createBlockSubpanel } from './helpers';

export type PostExcerptPanelOptions = {
	/** Stamp id. Defaults to `post-excerpt`. */
	targetId?: string;
	/** Control id prefix. Defaults to `targetId`. */
	controlPrefix?: string;
};

export function postExcerptPanel(
	options: PostExcerptPanelOptions = {}
): NestedPanelDef {
	const targetId = options.targetId ?? 'post-excerpt';
	const prefix = options.controlPrefix ?? targetId;
	const target: SectionTarget = { kind: 'section', id: targetId };

	const excerptLengthControl: ControlDef = {
		id: `${prefix}-excerpt-length`,
		type: 'number',
		label: __('Max number of words', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'excerptLength',
		min: 1,
		max: 300,
		step: 1,
		defaultValue: 55,
	};

	const moreTextControl: ControlDef = {
		id: `${prefix}-more-text`,
		type: 'input',
		label: __('Read more text', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'moreText',
		defaultValue: '',
	};

	const showMoreOnNewLineControl: ControlDef = {
		id: `${prefix}-show-more-on-new-line`,
		type: 'toggle',
		label: __('Show link on new line', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'showMoreOnNewLine',
		defaultValue: false,
	};

	return createBlockSubpanel({
		id: targetId,
		title: __('Excerpt', 'blockera'),
		styles: [
			styleVariationPickerFeature(target, `${prefix}-style`),
			fontFamilyFeature(target, `${prefix}-font-family`),
			fontSizeFeature(target, `${prefix}-font-size`),
			textColorFeature(target, `${prefix}-color`),
			textAlignFeature(target, `${prefix}-text-align`),
			bottomSpacingFeature(target, `${prefix}-bottom-spacing`),
			customizeInEditorFeature(target, `${prefix}-customize`),
		],
		settings: [
			excerptLengthControl,
			moreTextControl,
			showMoreOnNewLineControl,
		],
	});
}
