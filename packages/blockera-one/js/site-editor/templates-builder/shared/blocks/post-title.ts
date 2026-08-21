/**
 * Post Title nested panel — stamp `section/post-title`.
 * Shared across Posts Loop and singular template types.
 */

import { __ } from '@wordpress/i18n';

import type { NestedPanelDef, SectionTarget } from '../types';
import {
	bottomSpacingFeature,
	customizeInEditorFeature,
	fontFamilyFeature,
	fontSizeFeature,
	isLinkFeature,
	openInNewTabFeature,
	styleVariationPickerFeature,
	textAlignFeature,
	textColorFeature,
} from '../features';
import { createBlockSubpanel } from './helpers';

export type PostTitlePanelOptions = {
	/** Stamp id. Defaults to `post-title`. */
	targetId?: string;
	/** Control id prefix. Defaults to `targetId`. */
	controlPrefix?: string;
};

export function postTitlePanel(
	options: PostTitlePanelOptions = {}
): NestedPanelDef {
	const targetId = options.targetId ?? 'post-title';
	const prefix = options.controlPrefix ?? targetId;
	const target: SectionTarget = { kind: 'section', id: targetId };
	const isLinkId = `${prefix}-is-link`;

	return createBlockSubpanel({
		id: targetId,
		title: __('Title', 'blockera'),
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
			isLinkFeature(target, isLinkId, {
				label: __('Make title a link', 'blockera'),
				defaultValue: false,
			}),
			openInNewTabFeature(target, `${prefix}-open-in-new-tab`, isLinkId),
		],
	});
}
