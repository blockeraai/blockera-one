/**
 * Post Date nested panel — stamp `section/post-date`.
 * Shared across Posts Loop, and later single/page template types.
 */

import { __ } from '@wordpress/i18n';

import type { NestedPanelDef, SectionTarget } from '../types';
import {
	bottomSpacingFeature,
	customizeInEditorFeature,
	fontFamilyFeature,
	fontSizeFeature,
	isLinkFeature,
	styleVariationPickerFeature,
	textAlignFeature,
	textColorFeature,
} from '../features';
import { createBlockSubpanel } from './helpers';

export type PostDatePanelOptions = {
	/** Stamp id. Defaults to `post-date`. */
	targetId?: string;
	/** Control id prefix. Defaults to `targetId`. */
	controlPrefix?: string;
};

export function postDatePanel(
	options: PostDatePanelOptions = {}
): NestedPanelDef {
	const targetId = options.targetId ?? 'post-date';
	const prefix = options.controlPrefix ?? targetId;
	const target: SectionTarget = { kind: 'section', id: targetId };

	return createBlockSubpanel({
		id: targetId,
		title: __('Published Date', 'blockera'),
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
			isLinkFeature(target, `${prefix}-is-link`, {
				label: __('Link to post', 'blockera'),
				defaultValue: false,
			}),
		],
	});
}
