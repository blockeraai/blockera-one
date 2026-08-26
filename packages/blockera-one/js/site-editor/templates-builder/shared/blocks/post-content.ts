/**
 * Post Content nested panel — stamp `section/post-content`.
 * Shared across Posts Loop and singular template types.
 */

import { __ } from '@wordpress/i18n';

import type { NestedPanelDef, SectionTarget } from '../types';
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

export type PostContentPanelOptions = {
	/** Stamp id. Defaults to `post-content`. */
	targetId?: string;
	/** Control id prefix. Defaults to `targetId`. */
	controlPrefix?: string;
};

export function postContentPanel(
	options: PostContentPanelOptions = {}
): NestedPanelDef {
	const targetId = options.targetId ?? 'post-content';
	const prefix = options.controlPrefix ?? targetId;
	const target: SectionTarget = { kind: 'section', id: targetId };

	return createBlockSubpanel({
		id: targetId,
		title: __('Full Post Content', 'blockera'),
		styles: [
			styleVariationPickerFeature(target, `${prefix}-style`),
			fontFamilyFeature(target, `${prefix}-font-family`),
			fontSizeFeature(target, `${prefix}-font-size`),
			textColorFeature(target, `${prefix}-color`),
			textAlignFeature(target, `${prefix}-text-align`),
			bottomSpacingFeature(target, `${prefix}-bottom-spacing`),
			customizeInEditorFeature(target, `${prefix}-customize`),
		],
	});
}
