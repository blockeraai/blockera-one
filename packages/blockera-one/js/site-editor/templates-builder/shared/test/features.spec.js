/**
 * Shared feature factories: ControlDef shape used by block subpanels.
 */

import {
	alignmentFeature,
	aspectRatioFeature,
	backgroundColorFeature,
	borderFeature,
	borderRadiusFeature,
	bottomSpacingFeature,
	customizeInEditorFeature,
	fontFamilyFeature,
	fontSizeFeature,
	gapFeature,
	isLinkFeature,
	maxWidthFeature,
	minHeightFeature,
	openInNewTabFeature,
	resolutionFeature,
	spacingFeature,
	styleVariationPickerFeature,
	textAlignFeature,
	textColorFeature,
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

	it('isLinkFeature and openInNewTabFeature pair on isLink', () => {
		const isLinkId = 'post-featured-image-is-link';
		expect(isLinkFeature(TARGET, isLinkId)).toMatchObject({
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

	it('applies the options bag without spreading a ControlDef', () => {
		const conditions = [{ controlId: 'pagination', equals: true }];
		expect(
			styleVariationPickerFeature(TARGET, 'pagination-style', {
				conditions,
				alsoSetOn: ['body'],
			})
		).toMatchObject({
			id: 'pagination-style',
			operation: 'setBlockStyle',
			conditions,
			alsoSetOn: ['body'],
		});
		expect(
			styleVariationPickerFeature(TARGET, 'pagination-style', {
				label: undefined,
			}).label
		).toBe('Style Variation');
	});

	it('text, background, font-size, and gap features write Blockera attrs', () => {
		expect(textColorFeature(TARGET, 'title-color')).toMatchObject({
			id: 'title-color',
			type: 'color',
			attributePath: 'blockeraFontColor.value',
			variableTypes: ['color'],
		});
		expect(backgroundColorFeature(TARGET, 'title-bg-color')).toMatchObject({
			id: 'title-bg-color',
			attributePath: 'blockeraBackgroundColor.value',
		});
		expect(fontSizeFeature(TARGET, 'title-font-size')).toMatchObject({
			id: 'title-font-size',
			attributePath: 'blockeraFontSize.value',
			variableTypes: ['font-size'],
		});
		expect(fontFamilyFeature(TARGET, 'title-font-family')).toMatchObject({
			id: 'title-font-family',
			type: 'font-family',
			attributePath: 'blockeraFontFamily.value',
			variableTypes: ['font-family'],
		});
		expect(textAlignFeature(TARGET, 'title-text-align')).toMatchObject({
			id: 'title-text-align',
			type: 'text-align',
			attributePath: 'blockeraTextAlign.value',
		});
		expect(gapFeature(TARGET, 'page-header-gap')).toMatchObject({
			id: 'page-header-gap',
			attributePath: 'blockeraGap.value',
			variableTypes: ['spacing'],
		});
	});

	it('spacingFeature writes merge keys; bottomSpacingFeature defaults to margin.bottom', () => {
		expect(
			spacingFeature(TARGET, 'page-header-padding', {
				label: 'Inner Padding',
				attributeMergeKeys: ['padding.top', 'padding.bottom'],
				unitType: 'padding',
			})
		).toMatchObject({
			id: 'page-header-padding',
			attributePath: 'blockeraSpacing.value',
			attributeMergeKeys: ['padding.top', 'padding.bottom'],
			unitType: 'padding',
			label: 'Inner Padding',
		});
		expect(
			bottomSpacingFeature(TARGET, 'page-header-bottom-spacing', {
				label: 'Bottom Space',
			})
		).toMatchObject({
			attributeMergeKeys: ['margin.bottom'],
			label: 'Bottom Space',
		});
	});

	it('alignment, min-height, max-width, and border features keep write paths', () => {
		const container = { kind: 'container', id: 'body' };
		expect(
			alignmentFeature(container, 'page-header-align-banner')
		).toMatchObject({
			id: 'page-header-align-banner',
			type: 'layout-matrix',
			attributePath: 'blockeraFlexLayout.value',
			defaultDirection: 'column',
			isDirectionActive: false,
			target: container,
		});
		expect(
			minHeightFeature(TARGET, 'page-header-min-height')
		).toMatchObject({
			attributePath: 'blockeraMinHeight.value',
			unitType: 'min-height',
		});
		expect(
			maxWidthFeature(container, 'page-header-body-width')
		).toMatchObject({
			attributePath: 'blockeraMaxWidth.value',
			alsoWrite: [
				{ attributePath: 'blockeraWidth.value', value: 'stretch' },
			],
		});
		expect(
			borderFeature(TARGET, 'pagination-top-divider', {
				borderSide: 'top',
				label: 'Top Divider',
			})
		).toMatchObject({
			type: 'border',
			attributePath: 'blockeraBorder.value',
			borderSide: 'top',
			label: 'Top Divider',
		});
	});
});
