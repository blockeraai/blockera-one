/**
 * Shared feature factories: ControlDef shape used by block subpanels.
 */

import {
	aspectRatioFeature,
	borderRadiusFeature,
	bottomSpacingFeature,
	customizeInEditorFeature,
	makeImageALinkFeature,
	openInNewTabFeature,
	resolutionFeature,
	styleVariationPickerFeature,
} from '../features';

const TARGET = { kind: 'section', id: 'post-featured-image' };

describe('shared features', () => {
	it('styleVariationPickerFeature uses setBlockStyle', () => {
		expect(
			styleVariationPickerFeature(TARGET, 'post-featured-image-style')
		).toMatchObject({
			id: 'post-featured-image-style',
			type: 'select',
			operation: 'setBlockStyle',
			defaultValue: 'default',
			target: TARGET,
		});
	});

	it('aspectRatioFeature and borderRadiusFeature write Blockera attributes', () => {
		expect(
			aspectRatioFeature(TARGET, 'post-featured-image-aspect-ratio')
		).toMatchObject({
			id: 'post-featured-image-aspect-ratio',
			type: 'aspect-ratio',
			operation: 'setSectionAttribute',
			attributePath: 'blockeraRatio.value',
			defaultValue: { val: '', width: '', height: '' },
		});
		expect(
			borderRadiusFeature(TARGET, 'post-featured-image-border-radius')
		).toMatchObject({
			id: 'post-featured-image-border-radius',
			type: 'border-radius',
			attributePath: 'blockeraBorderRadius.value',
			defaultValue: { type: 'all', all: '' },
			variableTypes: ['border-radius'],
		});
	});

	it('bottomSpacingFeature merges margin.bottom', () => {
		expect(
			bottomSpacingFeature(TARGET, 'post-featured-image-bottom-spacing')
		).toMatchObject({
			id: 'post-featured-image-bottom-spacing',
			type: 'input',
			attributePath: 'blockeraSpacing.value',
			attributeMergeKeys: ['margin.bottom'],
			unitType: 'margin',
			variableTypes: ['spacing'],
		});
	});

	it('resolutionFeature writes sizeSlug', () => {
		expect(
			resolutionFeature(TARGET, 'post-featured-image-resolution')
		).toMatchObject({
			id: 'post-featured-image-resolution',
			type: 'resolution',
			attributePath: 'sizeSlug',
			defaultValue: 'full',
		});
	});

	it('makeImageALinkFeature and openInNewTabFeature pair on isLink', () => {
		const isLinkId = 'post-featured-image-is-link';
		expect(makeImageALinkFeature(TARGET, isLinkId)).toMatchObject({
			id: isLinkId,
			type: 'toggle',
			attributePath: 'isLink',
			defaultValue: true,
		});
		expect(
			openInNewTabFeature(
				TARGET,
				'post-featured-image-open-in-new-tab',
				isLinkId
			)
		).toMatchObject({
			id: 'post-featured-image-open-in-new-tab',
			attributePath: 'linkTarget',
			onValue: '_blank',
			offValue: '_self',
			conditions: [{ controlId: isLinkId, equals: true }],
		});
	});

	it('customizeInEditorFeature jumps to the canvas', () => {
		expect(
			customizeInEditorFeature(TARGET, 'post-featured-image-customize')
		).toMatchObject({
			id: 'post-featured-image-customize',
			type: 'button',
			operation: 'selectInCanvas',
			target: TARGET,
		});
	});
});
