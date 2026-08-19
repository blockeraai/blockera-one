/**
 * Comments Link nested panel — stamp `section/comments-link`.
 * Shared across Posts Loop, and later single/page template types.
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

export type CommentsLinkPanelOptions = {
	/** Stamp id. Defaults to `comments-link`. */
	targetId?: string;
	/** Control id prefix. Defaults to `targetId`. */
	controlPrefix?: string;
};

export function commentsLinkPanel(
	options: CommentsLinkPanelOptions = {}
): NestedPanelDef {
	const targetId = options.targetId ?? 'comments-link';
	const prefix = options.controlPrefix ?? targetId;
	const target: SectionTarget = { kind: 'section', id: targetId };

	return createBlockSubpanel({
		id: targetId,
		title: __('Comments Link', 'blockera'),
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
