/**
 * Post Read More Button nested panel — stamp `section/post-read-more`.
 * Shared across Posts Loop and singular template types.
 */

import { __ } from '@wordpress/i18n';

import type { ControlDef, NestedPanelDef, SectionTarget } from '../types';
import {
	bottomSpacingFeature,
	customizeInEditorFeature,
	fontFamilyFeature,
	fontSizeFeature,
	openInNewTabFeature,
	styleVariationPickerFeature,
	textAlignFeature,
	textColorFeature,
} from '../features';
import { createBlockSubpanel } from './helpers';

export type PostReadMoreButtonPanelOptions = {
	/** Stamp id. Defaults to `post-read-more`. */
	targetId?: string;
	/** Control id prefix. Defaults to `targetId`. */
	controlPrefix?: string;
};

export function postReadMoreButtonPanel(
	options: PostReadMoreButtonPanelOptions = {}
): NestedPanelDef {
	const targetId = options.targetId ?? 'post-read-more';
	const prefix = options.controlPrefix ?? targetId;
	const target: SectionTarget = { kind: 'section', id: targetId };

	const openInNewTabControl: ControlDef = openInNewTabFeature(
		target,
		`${prefix}-open-in-new-tab`,
		// Read-more is always rendered as a link, so we want the row
		// always visible. Override the feature's conditions to none.
		`${prefix}-is-link`,
		{ conditions: [] }
	);

	return createBlockSubpanel({
		id: targetId,
		title: __('Read More Button', 'blockera'),
		styles: [
			styleVariationPickerFeature(target, `${prefix}-style`),
			fontFamilyFeature(target, `${prefix}-font-family`),
			fontSizeFeature(target, `${prefix}-font-size`),
			textColorFeature(target, `${prefix}-color`),
			textAlignFeature(target, `${prefix}-text-align`),
			bottomSpacingFeature(target, `${prefix}-bottom-spacing`),
			customizeInEditorFeature(target, `${prefix}-customize`),
		],
		settings: [openInNewTabControl],
	});
}
