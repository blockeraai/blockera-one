/**
 * Featured Image nested panel — stamp `section/post-featured-image`.
 * Shared across Posts Loop and singular template types.
 */

import { __ } from '@wordpress/i18n';

import type { NestedPanelDef, SectionTarget } from '../types';
import {
	aspectRatioFeature,
	borderRadiusFeature,
	bottomSpacingFeature,
	customizeInEditorFeature,
	isLinkFeature,
	openInNewTabFeature,
	resolutionFeature,
	styleVariationPickerFeature,
} from '../features';
import { createBlockSubpanel } from './helpers';

export type PostFeaturedImagePanelOptions = {
	/** Stamp id. Defaults to `post-featured-image`. */
	targetId?: string;
	/** Control id prefix. Defaults to `targetId`. */
	controlPrefix?: string;
};

export function postFeaturedImagePanel(
	options: PostFeaturedImagePanelOptions = {}
): NestedPanelDef {
	const targetId = options.targetId ?? 'post-featured-image';
	const prefix = options.controlPrefix ?? targetId;
	const target: SectionTarget = { kind: 'section', id: targetId };
	const isLinkId = `${prefix}-is-link`;

	return createBlockSubpanel({
		id: targetId,
		title: __('Featured Image', 'blockera'),
		styles: [
			styleVariationPickerFeature(target, `${prefix}-style`),
			aspectRatioFeature(target, `${prefix}-aspect-ratio`),
			borderRadiusFeature(target, `${prefix}-border-radius`),
			bottomSpacingFeature(target, `${prefix}-bottom-spacing`),
			customizeInEditorFeature(target, `${prefix}-customize`),
		],
		settings: [
			resolutionFeature(target, `${prefix}-resolution`),
			isLinkFeature(target, isLinkId),
			openInNewTabFeature(target, `${prefix}-open-in-new-tab`, isLinkId),
		],
	});
}
