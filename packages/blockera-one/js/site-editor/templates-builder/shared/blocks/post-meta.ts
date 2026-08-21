/**
 * Post Meta row + item factory.
 * Archive and singular configs call `postMetaPanel`.
 */

import { __ } from '@wordpress/i18n';

import type {
	ControlDef,
	InnerOrderRule,
	InsertRule,
	NestedPanelDef,
	SectionTarget,
} from '../types';
import {
	bottomSpacingFeature,
	customizeInEditorFeature,
	fontFamilyFeature,
	fontSizeFeature,
	isLinkFeature,
	metaItemIconFeature,
	metaItemPrefixFeature,
	metaItemSuffixFeature,
	styleVariationPickerFeature,
	textAlignFeature,
	textColorFeature,
	type FeatureTarget,
} from '../features';
import { emptyDesignPanel } from '../sections/section-blocks';
import { createBlockSubpanel } from './helpers';

export const POST_META_CHILD_DEFS = [
	{ suffix: 'author-name', label: __('Author Name', 'blockera') },
	{ suffix: 'comments-count', label: __('Comments Count', 'blockera') },
	{ suffix: 'comments-link', label: __('Comments Link', 'blockera') },
	{ suffix: 'date', label: __('Date', 'blockera') },
	{ suffix: 'post-date', label: __('Published Date', 'blockera') },
	{ suffix: 'modified-date', label: __('Modified Date', 'blockera') },
	{ suffix: 'categories', label: __('Categories', 'blockera') },
	{ suffix: 'tags', label: __('Tags', 'blockera') },
	{ suffix: 'time-to-read', label: __('Time to Read', 'blockera') },
	{ suffix: 'word-count', label: __('Word Count', 'blockera') },
] as const;

const SPACE_FILLER_DEFS = [
	{ suffix: 'space-filler', label: __('Space Filler', 'blockera') },
	{ suffix: 'space-filler-2', label: __('Space Filler', 'blockera') },
] as const;

export function metaItemPanel(args: {
	targetId: string;
	label: string;
	extraStyles?: ControlDef[];
	extraSettings?: ControlDef[];
}): NestedPanelDef {
	const target: SectionTarget = { kind: 'section', id: args.targetId };
	const prefix = args.targetId;
	return createBlockSubpanel({
		id: args.targetId,
		title: args.label,
		styles: [
			...(args.extraStyles || []),
			customizeInEditorFeature(target, `${prefix}-customize`),
		],
		settings: [
			metaItemIconFeature(target, `${prefix}-icon`),
			metaItemPrefixFeature(target, `${prefix}-prefix`),
			metaItemSuffixFeature(target, `${prefix}-suffix`),
			...(args.extraSettings || []),
		],
	});
}

function childTypographyStyles(
	target: SectionTarget,
	childId: string
): ControlDef[] {
	return [
		styleVariationPickerFeature(target, `${childId}-style`),
		fontFamilyFeature(target, `${childId}-font-family`),
		fontSizeFeature(target, `${childId}-font-size`),
		textColorFeature(target, `${childId}-color`),
		textAlignFeature(target, `${childId}-text-align`),
		bottomSpacingFeature(target, `${childId}-bottom-spacing`),
	];
}

function childNestedPanel(childId: string, suffix: string, label: string) {
	const target: SectionTarget = { kind: 'section', id: childId };
	if (suffix === 'comments-link') {
		return metaItemPanel({
			targetId: childId,
			label,
			extraStyles: childTypographyStyles(target, childId),
		});
	}
	if (suffix === 'post-date') {
		const innerTarget: FeatureTarget = {
			kind: 'container',
			id: 'meta-item-block',
		};
		return metaItemPanel({
			targetId: childId,
			label,
			extraStyles: childTypographyStyles(target, childId),
			extraSettings: [
				isLinkFeature(innerTarget, `${childId}-is-link`, {
					label: __('Link to post', 'blockera'),
					defaultValue: true,
					innerOrder: { parentId: childId, ids: [] },
				}),
			],
		});
	}
	return metaItemPanel({ targetId: childId, label });
}

export type PostMetaPanelOptions = {
	instance?: 1 | 2;
	insert: InsertRule;
	rowInnerOrder: InnerOrderRule;
	requireAtLeastOneOf: string[];
	defaultValue?: boolean;
	conditions?: ControlDef['conditions'];
	/**
	 * Prefix control ids (not stamp ids) so a second meta pair can live
	 * on Page Header without colliding with Content `post-meta` controls.
	 * `requireAtLeastOneOf` uses those prefixed control ids (UI lock);
	 * section targets stay `post-meta*`.
	 */
	controlPrefix?: string;
};

export function postMetaPanel(options: PostMetaPanelOptions): ControlDef {
	const instance = options.instance ?? 1;
	const rowId = instance === 1 ? 'post-meta' : 'post-meta-2';
	const prefix = rowId;
	const contentDefs = POST_META_CHILD_DEFS.map((item) => ({
		...item,
		id: `${prefix}-${item.suffix}`,
		isFiller: false as const,
	}));
	const fillerDefs = SPACE_FILLER_DEFS.map((item) => ({
		...item,
		id: `${prefix}-${item.suffix}`,
		isFiller: true as const,
	}));
	const allDefs = [...contentDefs, ...fillerDefs];
	const childStampIds = allDefs.map((item) => item.id);
	const requiredStampIds = contentDefs.map((item) => item.id);
	const cid = (id: string) =>
		options.controlPrefix ? `${options.controlPrefix}-${id}` : id;
	const childOrder: InnerOrderRule = {
		parentId: rowId,
		ids: childStampIds,
		within: options.rowInnerOrder.within,
	};
	const rowScope: InnerOrderRule = {
		parentId: rowId,
		ids: [],
		within: options.rowInnerOrder.within,
	};
	const rowTarget: SectionTarget = { kind: 'section', id: rowId };
	const controlId = cid(rowId);

	return {
		id: controlId,
		type: 'toggle',
		label: __('Post Meta', 'blockera'),
		target: rowTarget,
		operation: 'toggleSection',
		catalogPool: rowId,
		insert: options.insert,
		innerOrder: options.rowInnerOrder,
		requireAtLeastOneOf: options.requireAtLeastOneOf,
		defaultValue: options.defaultValue ?? true,
		conditions: options.conditions,
		nestedPanel: {
			id: controlId,
			title: __('Post Meta', 'blockera'),
			groups: [
				{
					id: `${controlId}-styles`,
					title: __('Styles', 'blockera'),
					keepVisible: true,
					controls: [
						{
							id: `${controlId}-items-design`,
							type: 'toggle-select',
							label: __('Items Design', 'blockera'),
							target: rowTarget,
							operation: 'setMetaItemsDesign',
							innerOrder: rowScope,
							defaultValue: 'labels',
							variants: [
								{
									id: 'simple',
									label: __('Simple', 'blockera'),
								},
								{
									id: 'labels',
									label: __('Labels', 'blockera'),
								},
								{
									id: 'icons',
									label: __('Icons', 'blockera'),
								},
							],
						},
						{
							id: `${controlId}-separator`,
							type: 'toggle-select',
							label: __('Separator', 'blockera'),
							target: rowTarget,
							operation: 'setMetaSeparator',
							innerOrder: rowScope,
							defaultValue: 'bullet',
							variants: [
								{
									id: 'none',
									label: __('none', 'blockera'),
								},
								{ id: 'slash', label: '/' },
								{ id: 'dash', label: '\u2014' },
								{ id: 'bullet', label: '\u2022' },
							],
						},
						customizeInEditorFeature(
							rowTarget,
							`${controlId}-customize`,
							{ innerOrder: rowScope }
						),
					],
				},
				{
					id: `${controlId}-blocks`,
					title: __('Blocks', 'blockera'),
					sortable: true,
					controls: allDefs.map((item) => ({
						id: cid(item.id),
						type: 'toggle' as const,
						label: item.label,
						target: { kind: 'section' as const, id: item.id },
						operation: 'toggleSection' as const,
						catalogPool: item.id,
						insert: {
							relativeTo: rowId,
							position: 'inside-end' as const,
						},
						innerOrder: childOrder,
						requireAtLeastOneOf: requiredStampIds.map(cid),
						nestedPanel: item.isFiller
							? emptyDesignPanel(
									cid(item.id),
									item.label,
									item.id
								)
							: childNestedPanel(
									item.id,
									item.suffix,
									item.label
								),
					})),
				},
			],
		},
	};
}
