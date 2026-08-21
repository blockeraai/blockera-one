/**
 * Shared block-toggle factories for Templates Builder section groups.
 * Toggle rows in a Blocks list (`toggleSection` + insert + inner order).
 */

import { __ } from '@wordpress/i18n';

import {
	backgroundColorFeature,
	customizeInEditorFeature,
	fontSizeFeature,
	styleVariationPickerFeature,
	textColorFeature,
} from '../features';
import type {
	ControlDef,
	InnerOrderRule,
	InsertRule,
	NestedPanelDef,
	SectionTarget,
} from '../types';

export const LOOP_BLOCK_IDS = [
	'post-featured-image',
	'post-title',
	'post-excerpt',
	'post-content',
	'post-read-more',
	'post-meta',
	'post-meta-2',
];

export const LOOP_BLOCK_INNER_ORDER: InnerOrderRule = {
	parentId: 'body',
	within: 'posts-listing',
	bucketParents: ['media', 'body'],
	ids: LOOP_BLOCK_IDS,
	showParentNames: true,
};

export const ARTICLE_BLOCK_IDS = [...LOOP_BLOCK_IDS];

export const ARTICLE_BLOCK_INNER_ORDER: InnerOrderRule = {
	parentId: 'body',
	within: 'article',
	bucketParents: ['media', 'body'],
	ids: ARTICLE_BLOCK_IDS,
	showParentNames: true,
};

export const PAGE_HEADER_INNER_ORDER: InnerOrderRule = {
	parentId: 'body',
	within: 'page-header',
	ids: [
		'page-header-title',
		'page-header-description',
		'page-header-breadcrumbs',
	],
};

export const PAGE_HEADER_REQUIRED = [
	'page-header-title',
	'page-header-description',
	'page-header-breadcrumbs',
];

export function blockDesignControls(
	target: SectionTarget,
	prefix: string,
	alsoSetOn?: string[]
) {
	const shared = alsoSetOn?.length ? { alsoSetOn } : undefined;
	return {
		color: textColorFeature(target, `${prefix}-color`, shared),
		bgColor: backgroundColorFeature(target, `${prefix}-bg-color`, shared),
		style: styleVariationPickerFeature(target, `${prefix}-style`, shared),
		fontSize: fontSizeFeature(target, `${prefix}-font-size`, shared),
		customize: customizeInEditorFeature(target, `${prefix}-customize`),
	};
}

/**
 * Styles-only nested panel. `panelId` is the nested panel / control-id
 * prefix; `targetId` is the stamp the Customize button selects (defaults
 * to `panelId`). When `controlPrefix` is set on Post Meta, those differ.
 */
export function emptyDesignPanel(
	panelId: string,
	title: string,
	targetId: string = panelId
): NestedPanelDef {
	const target: SectionTarget = { kind: 'section', id: targetId };
	return {
		id: panelId,
		title,
		groups: [
			{
				id: `${panelId}-styles`,
				title: __('Styles', 'blockera'),
				keepVisible: true,
				controls: [
					customizeInEditorFeature(target, `${panelId}-customize`),
				],
			},
		],
	};
}

export type BlockToggleOptions = {
	defaultValue?: boolean;
	insert?: InsertRule;
	innerOrder?: InnerOrderRule;
	requireAtLeastOneOf?: string[];
	catalogPool?: string;
	conditions?: ControlDef['conditions'];
};

export function blockToggle(
	id: string,
	label: string,
	nestedPanel?: NestedPanelDef,
	options?: BlockToggleOptions
): ControlDef {
	return {
		id,
		type: 'toggle',
		label,
		target: { kind: 'section', id },
		operation: 'toggleSection',
		onValue: true,
		offValue: false,
		defaultValue: options?.defaultValue ?? true,
		catalogPool: options?.catalogPool ?? id,
		insert: options?.insert ?? {
			relativeTo: 'body',
			position: 'inside-end',
		},
		innerOrder: options?.innerOrder ?? LOOP_BLOCK_INNER_ORDER,
		requireAtLeastOneOf: options?.requireAtLeastOneOf ?? LOOP_BLOCK_IDS,
		conditions: options?.conditions,
		nestedPanel: nestedPanel ?? emptyDesignPanel(id, label),
	};
}

export function blockDesignPanel(
	panelId: string,
	title: string,
	groupId: string,
	target: SectionTarget,
	prefix: string,
	alsoSetOn?: string[]
): NestedPanelDef {
	const design = blockDesignControls(target, prefix, alsoSetOn);
	return {
		id: panelId,
		title,
		groups: [
			{
				id: groupId,
				title: __('Styles', 'blockera'),
				controls: [
					design.style,
					design.color,
					design.bgColor,
					design.fontSize,
					design.customize,
				],
			},
		],
	};
}

export type PageHeaderBlockOptions = {
	defaultValue?: boolean;
	insert?: InsertRule;
	innerOrder?: InnerOrderRule;
	requireAtLeastOneOf?: string[];
};

export function pageHeaderBlock(
	id: string,
	label: string,
	nestedPanel?: NestedPanelDef,
	options?: PageHeaderBlockOptions
): ControlDef {
	return {
		id,
		type: 'toggle',
		label,
		target: { kind: 'section', id },
		operation: 'toggleSection',
		onValue: true,
		offValue: false,
		defaultValue: options?.defaultValue ?? true,
		catalogPool: id,
		insert: options?.insert ?? {
			relativeTo: 'body',
			position: 'inside-end',
		},
		innerOrder: options?.innerOrder ?? PAGE_HEADER_INNER_ORDER,
		requireAtLeastOneOf:
			options?.requireAtLeastOneOf ?? PAGE_HEADER_REQUIRED,
		conditions: [
			{
				controlId: 'page-header',
				equals: true,
			},
		],
		nestedPanel: nestedPanel ?? emptyDesignPanel(id, label),
	};
}
