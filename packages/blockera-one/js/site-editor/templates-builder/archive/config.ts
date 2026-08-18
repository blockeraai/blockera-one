/**
 * Archive Templates family options config (v1).
 *
 * Markup never lives here: controls reference PHP catalog pools
 * (`catalogPool`) and `hydrate-config.ts` fills `variants` from
 * `window.blockeraOneTemplateBuilder.catalog.archive`. Pattern HTML is
 * resolved from the core patterns store at op time
 * (`resolve-variant-html.ts`).
 */

import { __ } from '@wordpress/i18n';

import { FILTER_IDS } from '../../templates/constants';
import type {
	ControlDef,
	InnerOrderRule,
	NestedPanelDef,
	TemplateOptionsConfig,
} from '../shared/types';

const HEADER_STACKED_PLACEMENT = {
	relativeTo: 'main',
	position: 'before' as const,
};

const FOOTER_STACKED_PLACEMENT = {
	relativeTo: 'main',
	position: 'after' as const,
};

const PAGE_HEADER_INNER_ORDER: InnerOrderRule = {
	parentId: 'elements',
	ids: [
		'page-header-title',
		'page-header-description',
		'page-header-breadcrumbs',
	],
};

const PAGE_HEADER_REQUIRED = [
	'page-header-title',
	'page-header-description',
	'page-header-breadcrumbs',
];

const PAGINATION_INNER_ORDER: InnerOrderRule = {
	parentId: 'pagination',
	ids: ['pagination-previous', 'pagination-numbers', 'pagination-next'],
};

const PAGINATION_REQUIRED = [
	'pagination-previous',
	'pagination-numbers',
	'pagination-next',
];

const PAGINATION_TARGET: SectionTarget = {
	kind: 'section',
	id: 'pagination',
};

const PAGINATION_PREV_TARGET: SectionTarget = {
	kind: 'section',
	id: 'pagination-previous',
};

const PAGINATION_NEXT_TARGET: SectionTarget = {
	kind: 'section',
	id: 'pagination-next',
};

const PAGINATION_NUMBERS_TARGET: SectionTarget = {
	kind: 'section',
	id: 'pagination-numbers',
};

const PAGINATION_ON = [{ controlId: 'pagination', equals: true }];

const LOOP_ITEM_IDS = [
	'post-featured-image',
	'post-title',
	'post-excerpt',
	'post-content',
	'post-read-more',
	'post-meta',
	'post-meta-2',
];

const LOOP_ITEM_INNER_ORDER: InnerOrderRule = {
	parentId: 'loop-item-content',
	bucketParents: ['loop-item-media', 'loop-item-content'],
	ids: LOOP_ITEM_IDS,
	showParentNames: true,
};

const POST_META_CHILD_DEFS = [
	{ suffix: 'author-name', label: __('Author Name', 'blockera') },
	{ suffix: 'comments-count', label: __('Comments Count', 'blockera') },
	{ suffix: 'comments-link', label: __('Comments Link', 'blockera') },
	{ suffix: 'date', label: __('Date', 'blockera') },
	{ suffix: 'post-date', label: __('Post Date', 'blockera') },
	{ suffix: 'modified-date', label: __('Modified Date', 'blockera') },
	{ suffix: 'categories', label: __('Categories', 'blockera') },
	{ suffix: 'tags', label: __('Tags', 'blockera') },
	{ suffix: 'time-to-read', label: __('Time to Read', 'blockera') },
	{ suffix: 'word-count', label: __('Word Count', 'blockera') },
] as const;

const UNIQUE_META_HEURISTICS: Array<{
	suffix: string;
	name: string;
}> = [
	{ suffix: 'author-name', name: 'core/post-author-name' },
	{ suffix: 'comments-count', name: 'core/post-comments-count' },
	{ suffix: 'comments-link', name: 'core/post-comments-link' },
];

type SectionTarget = {
	kind: 'section';
	id: string;
};

const TITLE_TARGET: SectionTarget = {
	kind: 'section',
	id: 'page-header-title',
};

const DESCRIPTION_TARGET: SectionTarget = {
	kind: 'section',
	id: 'page-header-description',
};

const BREADCRUMBS_TARGET: SectionTarget = {
	kind: 'section',
	id: 'page-header-breadcrumbs',
};

function sectionColorControl(
	target: SectionTarget,
	id: string,
	label: string,
	attributePath: string
): ControlDef {
	return {
		id,
		type: 'color',
		label,
		target,
		operation: 'setSectionAttribute',
		attributePath,
		controlAddonTypes: ['variable'],
		variableTypes: ['color'],
	};
}

function sectionFontSizeControl(target: SectionTarget, id: string): ControlDef {
	return {
		id,
		type: 'input',
		label: __('Font Size', 'blockera'),
		target,
		operation: 'setSectionAttribute',
		attributePath: 'blockeraFontSize.value',
		unitType: 'essential',
		controlAddonTypes: ['variable'],
		variableTypes: ['font-size'],
		min: 0,
	};
}

function sectionStyleControl(target: SectionTarget, id: string): ControlDef {
	return {
		id,
		type: 'select',
		label: __('Style Variation', 'blockera'),
		target,
		operation: 'setBlockStyle',
		defaultValue: 'default',
	};
}

function sectionCustomizeControl(
	target: SectionTarget,
	id: string
): ControlDef {
	return {
		id,
		type: 'button',
		label: __('Customize in editor', 'blockera'),
		target,
		operation: 'selectInCanvas',
	};
}

function elementDesignControls(
	target: SectionTarget,
	prefix: string,
	alsoSetOn?: string[]
) {
	const color = sectionColorControl(
		target,
		`${prefix}-color`,
		__('Text Color', 'blockera'),
		'blockeraFontColor.value'
	);
	const bgColor = sectionColorControl(
		target,
		`${prefix}-bg-color`,
		__('BG Color', 'blockera'),
		'blockeraBackgroundColor.value'
	);
	const style = sectionStyleControl(target, `${prefix}-style`);
	const fontSize = sectionFontSizeControl(target, `${prefix}-font-size`);
	if (alsoSetOn?.length) {
		color.alsoSetOn = alsoSetOn;
		bgColor.alsoSetOn = alsoSetOn;
		style.alsoSetOn = alsoSetOn;
		fontSize.alsoSetOn = alsoSetOn;
	}
	return {
		color,
		bgColor,
		style,
		fontSize,
		customize: sectionCustomizeControl(target, `${prefix}-customize`),
	};
}

function emptyDesignPanel(panelId: string, title: string): NestedPanelDef {
	const target: SectionTarget = { kind: 'section', id: panelId };
	return {
		id: panelId,
		title,
		groups: [
			{
				id: `${panelId}-styles`,
				title: __('Styles', 'blockera'),
				keepVisible: true,
				controls: [
					sectionCustomizeControl(target, `${panelId}-customize`),
				],
			},
		],
	};
}

function loopItemElement(id: string, label: string): ControlDef {
	return {
		id,
		type: 'toggle',
		label,
		target: { kind: 'section', id },
		operation: 'toggleSection',
		catalogPool: id,
		insert: {
			relativeTo: 'loop-item-content',
			position: 'inside-end',
		},
		innerOrder: LOOP_ITEM_INNER_ORDER,
		requireAtLeastOneOf: LOOP_ITEM_IDS,
		nestedPanel: emptyDesignPanel(id, label),
	};
}

function postMetaElement(instance: 1 | 2): ControlDef {
	const rowId = instance === 1 ? 'post-meta' : 'post-meta-2';
	const prefix = rowId;
	const childIds = POST_META_CHILD_DEFS.map(
		(item) => `${prefix}-${item.suffix}`
	);
	const childOrder: InnerOrderRule = {
		parentId: rowId,
		ids: childIds,
	};
	const rowTarget: SectionTarget = { kind: 'section', id: rowId };

	return {
		id: rowId,
		type: 'toggle',
		label: __('Post Meta', 'blockera'),
		target: rowTarget,
		operation: 'toggleSection',
		catalogPool: rowId,
		insert: {
			relativeTo: 'loop-item-content',
			position: 'inside-end',
		},
		innerOrder: LOOP_ITEM_INNER_ORDER,
		requireAtLeastOneOf: LOOP_ITEM_IDS,
		nestedPanel: {
			id: rowId,
			title: __('Post Meta', 'blockera'),
			groups: [
				{
					id: `${rowId}-styles`,
					title: __('Styles', 'blockera'),
					keepVisible: true,
					controls: [
						sectionCustomizeControl(
							rowTarget,
							`${rowId}-customize`
						),
					],
				},
				{
					id: `${rowId}-blocks`,
					title: __('Blocks', 'blockera'),
					sortable: true,
					controls: POST_META_CHILD_DEFS.map((item) => {
						const childId = `${prefix}-${item.suffix}`;
						return {
							id: childId,
							type: 'toggle' as const,
							label: item.label,
							target: { kind: 'section' as const, id: childId },
							operation: 'toggleSection' as const,
							catalogPool: childId,
							insert: {
								relativeTo: rowId,
								position: 'inside-end' as const,
							},
							innerOrder: childOrder,
							requireAtLeastOneOf: childIds,
							nestedPanel: emptyDesignPanel(childId, item.label),
						};
					}),
				},
			],
		},
	};
}

function elementDesignPanel(
	panelId: string,
	title: string,
	groupId: string,
	target: SectionTarget,
	prefix: string,
	alsoSetOn?: string[]
): NestedPanelDef {
	const design = elementDesignControls(target, prefix, alsoSetOn);
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

const BREADCRUMBS_DESIGN = elementDesignControls(
	BREADCRUMBS_TARGET,
	'breadcrumbs'
);

const PAGE_HEADER_DESIGN: ControlDef = {
	id: 'page-header-design',
	type: 'layout-picker',
	target: { kind: 'section', id: 'page-header' },
	operation: 'swapSection',
	conditions: [{ controlId: 'page-header', equals: true }],
	catalogPool: 'page-header',
	swapHints: {
		// Title/description/breadcrumb settings survive the design swap.
		// Gap, alignment, padding, and width stay with the new pattern:
		// they are not listed here, and swapSection does not copy blockera*
		// attrs unless preserveBlockeraExtensions is set.
		reapplyControls: [
			'page-header-title',
			'page-header-description',
			'page-header-breadcrumbs',
			'title-color',
			'title-bg-color',
			'title-font-size',
			'title-style',
			'description-color',
			'description-bg-color',
			'description-font-size',
			'description-style',
			'breadcrumbs-color',
			'breadcrumbs-bg-color',
			'breadcrumbs-font-size',
			'breadcrumbs-gap',
			'breadcrumbs-separator',
			'breadcrumbs-style',
			'breadcrumbs-show-home',
			'breadcrumbs-show-current',
		],
	},
};

const PAGE_HEADER_ON = [{ controlId: 'page-header', equals: true }];
const PAGE_HEADER_SIMPLE = [
	...PAGE_HEADER_ON,
	{ controlId: 'page-header-design', equals: 'simple' },
];
const PAGE_HEADER_BANNER = [
	...PAGE_HEADER_ON,
	{ controlId: 'page-header-design', equals: 'banner' },
];

const PAGE_HEADER_SECTION = {
	kind: 'section' as const,
	id: 'page-header',
};

const HEADER_SECTION: SectionTarget = {
	kind: 'section',
	id: 'header',
};

const FOOTER_SECTION: SectionTarget = {
	kind: 'section',
	id: 'footer',
};

const POSTS_LISTING_TARGET: SectionTarget = {
	kind: 'section',
	id: 'posts-listing',
};

const ELEMENTS_CONTAINER = {
	kind: 'container' as const,
	id: 'elements',
};

const PAGE_HEADER_ALIGN = {
	type: 'layout-matrix' as const,
	label: __('Alignment', 'blockera'),
	operation: 'setSectionAttribute' as const,
	attributePath: 'blockeraFlexLayout.value',
	isDirectionActive: false,
	isAxisControlsActive: false,
	defaultDirection: 'column' as const,
};

const POSTS_TEMPLATE: ControlDef = {
	id: 'posts-template',
	type: 'layout-picker',
	target: POSTS_LISTING_TARGET,
	operation: 'swapSection',
	// Listing patterns ship with standard pagination inside;
	// keep the user's query setup and pagination design
	// across swaps. Loop-item toggles are not reapplied — a
	// listing swap takes the new pattern's composition.
	swapHints: {
		preserveQuery: true,
		reapplyControls: [
			'pagination',
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
			'pagination-style',
			'pagination-top-divider',
			'pagination-top-spacing',
		],
	},
	catalogPool: 'posts-listing',
};

const POSTS_PER_PAGE: ControlDef = {
	id: 'posts-per-page',
	type: 'number',
	label: __('Number of posts', 'blockera'),
	target: { kind: 'setting', id: 'posts_per_page' },
	operation: 'setTemplateSetting',
	scrollTarget: 'posts-listing',
	settingPath: 'posts_per_page',
	defaultValue: 10,
	min: 1,
	max: 50,
	step: 1,
	columns: '2fr 2fr',
};

export const ARCHIVE_OPTIONS_CONFIG: TemplateOptionsConfig = {
	type: 'archive',
	filters: [
		FILTER_IDS.archive,
		FILTER_IDS.category,
		FILTER_IDS.tag,
		FILTER_IDS.author,
		FILTER_IDS.date,
		FILTER_IDS.taxonomy,
	],
	fallbackFilter: FILTER_IDS.archive,
	layoutId: 'main',
	// Stampless fallbacks: when the user rebuilt a section by hand, detect it
	// by block shape so the panel still resolves a (customized) state.
	sectionHeuristics: {
		header: {
			kind: 'templatePart',
			area: 'header',
			slugIncludes: 'header',
		},
		footer: {
			kind: 'templatePart',
			area: 'footer',
			slugIncludes: 'footer',
		},
		sidebar: { kind: 'templatePart', slugPrefix: 'sidebar' },
		'page-header': { kind: 'groupWrapping', childName: 'core/query-title' },
		'page-header-title': {
			kind: 'innerBlock',
			parentId: 'elements',
			name: 'core/query-title',
		},
		'page-header-description': {
			kind: 'innerBlock',
			parentId: 'elements',
			name: 'core/term-description',
		},
		'page-header-breadcrumbs': {
			kind: 'innerBlock',
			parentId: 'elements',
			name: 'core/breadcrumbs',
		},
		'posts-listing': { kind: 'blockName', name: 'core/query' },
		'post-featured-image': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/post-featured-image',
		},
		'post-title': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/post-title',
		},
		'post-excerpt': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/post-excerpt',
		},
		'post-content': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/post-content',
		},
		'post-read-more': {
			kind: 'descendantBlock',
			parentId: 'posts-listing',
			name: 'core/read-more',
		},
		...Object.fromEntries(
			UNIQUE_META_HEURISTICS.flatMap((item) => [
				[
					`post-meta-${item.suffix}`,
					{
						kind: 'innerBlock' as const,
						parentId: 'post-meta',
						name: item.name,
					},
				],
				[
					`post-meta-2-${item.suffix}`,
					{
						kind: 'innerBlock' as const,
						parentId: 'post-meta-2',
						name: item.name,
					},
				],
			])
		),
		pagination: { kind: 'blockName', name: 'core/query-pagination' },
		'pagination-previous': {
			kind: 'innerBlock',
			parentId: 'pagination',
			name: 'core/query-pagination-previous',
		},
		'pagination-next': {
			kind: 'innerBlock',
			parentId: 'pagination',
			name: 'core/query-pagination-next',
		},
		'pagination-numbers': {
			kind: 'innerBlock',
			parentId: 'pagination',
			name: 'core/query-pagination-numbers',
		},
	},
	// Page header sits full-width above the content/sidebar columns and must
	// be carried across layout transplants.
	layoutSiblingSections: ['page-header'],
	groups: [
		{
			id: 'site-header',
			title: __('Site Header', 'blockera'),
			headerToggle: {
				id: 'header',
				type: 'toggle',
				label: __('Site Header', 'blockera'),
				target: { kind: 'section', id: 'header' },
				operation: 'toggleSection',
				onValue: true,
				offValue: false,
				defaultValue: true,
				catalogPool: 'header',
				insert: HEADER_STACKED_PLACEMENT,
			},
			controls: [],
			nestedPanel: {
				id: 'site-header',
				title: __('Site Header', 'blockera'),
				groups: [
					{
						id: 'header-layout',
						title: __('Layout', 'blockera'),
						controls: [
							{
								id: 'header-design',
								type: 'layout-picker',
								target: HEADER_SECTION,
								operation: 'swapTemplatePart',
								conditions: [
									{ controlId: 'header', equals: true },
								],
								catalogPool: 'header',
							},
						],
					},
					{
						id: 'header-styles',
						title: __('Styles', 'blockera'),
						keepVisible: true,
						controls: [
							sectionCustomizeControl(
								HEADER_SECTION,
								'header-customize'
							),
						],
					},
				],
			},
		},
		{
			id: 'page-header',
			title: __('Page Header', 'blockera'),
			headerToggle: {
				id: 'page-header',
				type: 'toggle',
				label: __('Page Header', 'blockera'),
				target: { kind: 'section', id: 'page-header' },
				operation: 'toggleSection',
				onValue: true,
				offValue: false,
				defaultValue: true,
				insert: {
					relativeTo: 'main',
					position: 'inside-start',
				},
				catalogPool: 'page-header',
			},
			controls: [PAGE_HEADER_DESIGN],
			nestedPanel: {
				id: 'page-header-settings',
				title: __('Page Header', 'blockera'),
				gatewayLabel: __('Styles & Blocks', 'blockera'),
				groups: [
					{
						id: 'page-header-layout',
						title: __('Layout', 'blockera'),
						controls: [PAGE_HEADER_DESIGN],
					},
					{
						id: 'page-header-styles',
						title: __('Styles', 'blockera'),
						controls: [
							{
								id: 'page-header-gap',
								type: 'input',
								label: __('Gap', 'blockera'),
								target: PAGE_HEADER_SECTION,
								alsoSetOn: ['elements'],
								operation: 'setSectionAttribute',
								attributePath: 'blockeraGap.value',
								unitType: 'essential',
								controlAddonTypes: ['variable'],
								variableTypes: ['spacing'],
								conditions: [...PAGE_HEADER_ON],
							},
							{
								id: 'page-header-bottom-spacing',
								type: 'input',
								label: __('Bottom Space', 'blockera'),
								target: PAGE_HEADER_SECTION,
								operation: 'setSectionAttribute',
								attributePath: 'blockeraSpacing.value',
								attributeMergeKeys: ['margin.bottom'],
								unitType: 'margin',
								controlAddonTypes: ['variable'],
								variableTypes: ['spacing'],
								conditions: PAGE_HEADER_SIMPLE,
							},
							{
								...PAGE_HEADER_ALIGN,
								id: 'page-header-align',
								target: PAGE_HEADER_SECTION,
								alsoSetOn: ['elements'],
								conditions: PAGE_HEADER_SIMPLE,
							},
							{
								...PAGE_HEADER_ALIGN,
								id: 'page-header-align-banner',
								target: ELEMENTS_CONTAINER,
								conditions: PAGE_HEADER_BANNER,
							},
							{
								id: 'page-header-bg-color',
								type: 'color',
								label: __('BG Color', 'blockera'),
								target: PAGE_HEADER_SECTION,
								operation: 'setSectionAttribute',
								attributePath: 'blockeraBackgroundColor.value',
								controlAddonTypes: ['variable'],
								variableTypes: ['color'],
								conditions: PAGE_HEADER_BANNER,
							},
							{
								id: 'page-header-min-height',
								type: 'input',
								label: __('Min Height', 'blockera'),
								target: PAGE_HEADER_SECTION,
								operation: 'setSectionAttribute',
								attributePath: 'blockeraMinHeight.value',
								unitType: 'min-height',
								controlAddonTypes: ['variable'],
								variableTypes: ['width-size', 'spacing'],
								min: 0,
								conditions: PAGE_HEADER_BANNER,
							},
							{
								id: 'page-header-padding',
								type: 'input',
								label: __('Inner Padding', 'blockera'),
								target: PAGE_HEADER_SECTION,
								operation: 'setSectionAttribute',
								attributePath: 'blockeraSpacing.value',
								attributeMergeKeys: [
									'padding.top',
									'padding.bottom',
								],
								unitType: 'padding',
								controlAddonTypes: ['variable'],
								variableTypes: ['spacing'],
								conditions: PAGE_HEADER_BANNER,
							},
							{
								id: 'page-header-elements-width',
								type: 'input',
								label: __('Inner Width', 'blockera'),
								target: ELEMENTS_CONTAINER,
								operation: 'setSectionAttribute',
								attributePath: 'blockeraMaxWidth.value',
								alsoWrite: [
									{
										attributePath: 'blockeraWidth.value',
										value: 'stretch',
									},
								],
								unitType: 'max-width',
								controlAddonTypes: ['variable'],
								variableTypes: ['width-size', 'spacing'],
								min: 0,
								conditions: PAGE_HEADER_BANNER,
							},
							{
								...sectionCustomizeControl(
									PAGE_HEADER_SECTION,
									'page-header-customize'
								),
								conditions: [...PAGE_HEADER_ON],
							},
						],
					},
					{
						id: 'page-header-blocks',
						title: __('Blocks', 'blockera'),
						sortable: true,
						controls: [
							{
								id: 'page-header-title',
								type: 'toggle',
								label: __('Title', 'blockera'),
								target: TITLE_TARGET,
								operation: 'toggleSection',
								onValue: true,
								offValue: false,
								defaultValue: true,
								catalogPool: 'page-header-title',
								insert: {
									relativeTo: 'elements',
									position: 'inside-start',
								},
								innerOrder: PAGE_HEADER_INNER_ORDER,
								requireAtLeastOneOf: PAGE_HEADER_REQUIRED,
								conditions: [
									{
										controlId: 'page-header',
										equals: true,
									},
								],
								nestedPanel: elementDesignPanel(
									'page-header-title',
									__('Title', 'blockera'),
									'title-styles',
									TITLE_TARGET,
									'title'
								),
							},
							{
								id: 'page-header-description',
								type: 'toggle',
								label: __('Description', 'blockera'),
								target: DESCRIPTION_TARGET,
								operation: 'toggleSection',
								onValue: true,
								offValue: false,
								defaultValue: true,
								catalogPool: 'page-header-description',
								insert: {
									relativeTo: 'elements',
									position: 'inside-end',
								},
								innerOrder: PAGE_HEADER_INNER_ORDER,
								requireAtLeastOneOf: PAGE_HEADER_REQUIRED,
								conditions: [
									{
										controlId: 'page-header',
										equals: true,
									},
								],
								nestedPanel: elementDesignPanel(
									'page-header-description',
									__('Description', 'blockera'),
									'description-styles',
									DESCRIPTION_TARGET,
									'description'
								),
							},
							{
								id: 'page-header-breadcrumbs',
								type: 'toggle',
								label: __('Breadcrumbs', 'blockera'),
								target: BREADCRUMBS_TARGET,
								operation: 'toggleSection',
								onValue: true,
								offValue: false,
								defaultValue: false,
								catalogPool: 'page-header-breadcrumbs',
								insert: {
									relativeTo: 'elements',
									position: 'inside-end',
								},
								innerOrder: PAGE_HEADER_INNER_ORDER,
								requireAtLeastOneOf: PAGE_HEADER_REQUIRED,
								conditions: [
									{
										controlId: 'page-header',
										equals: true,
									},
								],
								nestedPanel: {
									id: 'page-header-breadcrumbs',
									title: __('Breadcrumbs', 'blockera'),
									groups: [
										{
											id: 'breadcrumbs-styles',
											title: __('Styles', 'blockera'),
											controls: [
												BREADCRUMBS_DESIGN.style,
												BREADCRUMBS_DESIGN.color,
												BREADCRUMBS_DESIGN.bgColor,
												BREADCRUMBS_DESIGN.fontSize,
												{
													id: 'breadcrumbs-gap',
													type: 'input',
													label: __(
														'Gap',
														'blockera'
													),
													target: BREADCRUMBS_TARGET,
													operation:
														'setSectionAttribute',
													attributePath:
														'blockeraGap.value',
													unitType: 'essential',
													controlAddonTypes: [
														'variable',
													],
													variableTypes: ['spacing'],
												},
												BREADCRUMBS_DESIGN.customize,
											],
										},
										{
											id: 'breadcrumbs-settings',
											title: __('Settings', 'blockera'),
											controls: [
												{
													id: 'breadcrumbs-separator',
													type: 'input',
													label: __(
														'Separator',
														'blockera'
													),
													target: BREADCRUMBS_TARGET,
													operation:
														'setSectionAttribute',
													attributePath: 'separator',
													defaultValue: '/',
												},
												{
													id: 'breadcrumbs-show-home',
													type: 'toggle',
													label: __(
														'Show home breadcrumb',
														'blockera'
													),
													target: BREADCRUMBS_TARGET,
													operation:
														'setSectionAttribute',
													attributePath:
														'showHomeItem',
													defaultValue: true,
												},
												{
													id: 'breadcrumbs-show-current',
													type: 'toggle',
													label: __(
														'Show current breadcrumb',
														'blockera'
													),
													target: BREADCRUMBS_TARGET,
													operation:
														'setSectionAttribute',
													attributePath:
														'showCurrentItem',
													defaultValue: true,
												},
											],
										},
									],
								},
							},
						],
					},
				],
			},
		},
		{
			id: 'page-layout',
			title: __('Posts Loop', 'blockera'),
			controls: [POSTS_TEMPLATE, POSTS_PER_PAGE],
			nestedPanel: {
				id: 'posts-loop',
				title: __('Posts Loop', 'blockera'),
				gatewayLabel: __('Styles & Blocks', 'blockera'),
				// No headerToggle stamp to infer from; panel id is not a stamp.
				scrollTarget: 'posts-listing',
				groups: [
					{
						id: 'posts-loop-layout',
						title: __('Layout', 'blockera'),
						controls: [POSTS_TEMPLATE],
					},
					{
						id: 'posts-loop-styles',
						title: __('Styles', 'blockera'),
						controls: [
							POSTS_PER_PAGE,
							sectionCustomizeControl(
								POSTS_LISTING_TARGET,
								'posts-loop-customize'
							),
						],
					},
					{
						id: 'posts-loop-blocks',
						title: __('Blocks', 'blockera'),
						sortable: true,
						controls: [
							loopItemElement(
								'post-featured-image',
								__('Featured Image', 'blockera')
							),
							loopItemElement(
								'post-title',
								__('Title', 'blockera')
							),
							loopItemElement(
								'post-excerpt',
								__('Excerpt', 'blockera')
							),
							loopItemElement(
								'post-content',
								__('Content', 'blockera')
							),
							loopItemElement(
								'post-read-more',
								__('Read More', 'blockera')
							),
							postMetaElement(1),
							postMetaElement(2),
						],
					},
				],
			},
		},
		{
			id: 'pagination',
			title: __('Pagination', 'blockera'),
			headerToggle: {
				id: 'pagination',
				type: 'toggle',
				label: __('Pagination', 'blockera'),
				target: PAGINATION_TARGET,
				operation: 'toggleSection',
				onValue: true,
				offValue: false,
				defaultValue: true,
				insert: {
					relativeTo: 'posts-listing',
					position: 'inside-end',
				},
				catalogPool: 'pagination',
			},
			controls: [],
			nestedPanel: {
				id: 'pagination',
				title: __('Pagination', 'blockera'),
				groups: [
					{
						id: 'pagination-layout',
						title: __('Layout', 'blockera'),
						controls: [
							{
								id: 'pagination-design',
								type: 'layout-picker',
								target: PAGINATION_TARGET,
								operation: 'swapSection',
								catalogPool: 'pagination',
								conditions: PAGINATION_ON,
								swapHints: {
									reapplyControls: [
										'pagination-previous',
										'pagination-numbers',
										'pagination-next',
										'pagination-style',
										'pagination-top-divider',
										'pagination-top-spacing',
									],
								},
							},
						],
					},
					{
						id: 'pagination-styles',
						title: __('Styles', 'blockera'),
						controls: [
							{
								...sectionStyleControl(
									PAGINATION_TARGET,
									'pagination-style'
								),
								conditions: PAGINATION_ON,
							},
							{
								id: 'pagination-top-divider',
								type: 'border',
								label: __('Top Divider', 'blockera'),
								target: PAGINATION_TARGET,
								operation: 'setSectionAttribute',
								attributePath: 'blockeraBorder.value',
								borderSide: 'top',
								conditions: PAGINATION_ON,
								mirrorMergeWhen: {
									whenControlId: 'pagination-top-spacing',
									mergeKeys: ['padding.top'],
									role: 'divider',
									attributePath: 'blockeraSpacing.value',
								},
							},
							{
								id: 'pagination-top-spacing',
								type: 'input',
								label: __('Top Spacing', 'blockera'),
								target: PAGINATION_TARGET,
								operation: 'setSectionAttribute',
								attributePath: 'blockeraSpacing.value',
								attributeMergeKeys: ['margin.top'],
								unitType: 'margin',
								controlAddonTypes: ['variable'],
								variableTypes: ['spacing'],
								conditions: PAGINATION_ON,
								mirrorMergeWhen: {
									whenControlId: 'pagination-top-divider',
									mergeKeys: ['padding.top'],
									role: 'spacing',
								},
							},
							{
								...sectionCustomizeControl(
									PAGINATION_TARGET,
									'pagination-customize'
								),
								conditions: PAGINATION_ON,
							},
						],
					},
					{
						id: 'pagination-blocks',
						title: __('Blocks', 'blockera'),
						controls: [
							{
								id: 'pagination-previous',
								type: 'toggle',
								label: __('Previous Page', 'blockera'),
								target: PAGINATION_PREV_TARGET,
								operation: 'toggleSection',
								onValue: true,
								offValue: false,
								defaultValue: true,
								catalogPool: 'pagination-previous',
								insert: {
									relativeTo: 'pagination',
									position: 'inside-start',
								},
								innerOrder: PAGINATION_INNER_ORDER,
								requireAtLeastOneOf: PAGINATION_REQUIRED,
								conditions: PAGINATION_ON,
								nestedPanel: {
									id: 'pagination-previous',
									title: __('Previous Page', 'blockera'),
									groups: [
										...elementDesignPanel(
											'pagination-previous-design',
											__('Previous Page', 'blockera'),
											'pagination-prev-styles',
											PAGINATION_PREV_TARGET,
											'pagination-prev'
										).groups,
										{
											id: 'pagination-prev-settings',
											title: __('Settings', 'blockera'),
											controls: [
												{
													id: 'pagination-previous-label',
													type: 'input',
													label: __(
														'Label',
														'blockera'
													),
													target: PAGINATION_PREV_TARGET,
													operation:
														'setSectionAttribute',
													attributePath: 'label',
													// Core edit() paints `label` as PlainText (placeholder
													// only when empty). Persist the same default PHP uses.
													defaultValue: __(
														'Previous Page',
														'blockera'
													),
												},
											],
										},
									],
								},
							},
							{
								id: 'pagination-numbers',
								type: 'toggle',
								label: __('Numbers', 'blockera'),
								target: PAGINATION_NUMBERS_TARGET,
								operation: 'toggleSection',
								onValue: true,
								offValue: false,
								defaultValue: true,
								catalogPool: 'pagination-numbers',
								insert: {
									relativeTo: 'pagination',
									position: 'inside-start',
								},
								innerOrder: PAGINATION_INNER_ORDER,
								requireAtLeastOneOf: PAGINATION_REQUIRED,
								conditions: PAGINATION_ON,
								nestedPanel: {
									id: 'pagination-numbers',
									title: __('Numbers', 'blockera'),
									groups: [
										...elementDesignPanel(
											'pagination-numbers-design',
											__('Numbers', 'blockera'),
											'pagination-num-styles',
											PAGINATION_NUMBERS_TARGET,
											'pagination-num'
										).groups,
										{
											id: 'pagination-num-settings',
											title: __('Settings', 'blockera'),
											controls: [
												{
													id: 'pagination-numbers-mid-size',
													type: 'number',
													label: __(
														'Number of links',
														'blockera'
													),
													target: PAGINATION_NUMBERS_TARGET,
													operation:
														'setSectionAttribute',
													attributePath: 'midSize',
													defaultValue: 2,
													min: 0,
													max: 5,
													step: 1,
													labelDescription: __(
														'Specify how many links can appear before and after the current page number. Links to the first, current and last page are always visible.',
														'blockera'
													),
												},
											],
										},
									],
								},
							},
							{
								id: 'pagination-next',
								type: 'toggle',
								label: __('Next Page', 'blockera'),
								target: PAGINATION_NEXT_TARGET,
								operation: 'toggleSection',
								onValue: true,
								offValue: false,
								defaultValue: true,
								catalogPool: 'pagination-next',
								insert: {
									relativeTo: 'pagination',
									position: 'inside-end',
								},
								innerOrder: PAGINATION_INNER_ORDER,
								requireAtLeastOneOf: PAGINATION_REQUIRED,
								conditions: PAGINATION_ON,
								nestedPanel: {
									id: 'pagination-next',
									title: __('Next Page', 'blockera'),
									groups: [
										...elementDesignPanel(
											'pagination-next-design',
											__('Next Page', 'blockera'),
											'pagination-next-styles',
											PAGINATION_NEXT_TARGET,
											'pagination-next'
										).groups,
										{
											id: 'pagination-next-settings',
											title: __('Settings', 'blockera'),
											controls: [
												{
													id: 'pagination-next-label',
													type: 'input',
													label: __(
														'Label',
														'blockera'
													),
													target: PAGINATION_NEXT_TARGET,
													operation:
														'setSectionAttribute',
													attributePath: 'label',
													defaultValue: __(
														'Next Page',
														'blockera'
													),
												},
											],
										},
									],
								},
							},
						],
					},
				],
			},
		},
		{
			id: 'sidebar',
			title: __('Sidebar', 'blockera'),
			headerToggle: {
				id: 'sidebar',
				type: 'toggle',
				label: __('Sidebar', 'blockera'),
				target: { kind: 'layout', id: 'main' },
				operation: 'transplantLayout',
				onValue: 'sidebar-right',
				offValue: 'no-sidebar',
				defaultValue: false,
				catalogPool: 'layout',
			},
			controls: [],
			nestedPanel: {
				id: 'sidebar',
				title: __('Sidebar', 'blockera'),
				groups: [
					{
						id: 'sidebar-layout',
						title: __('Layout', 'blockera'),
						controls: [
							{
								id: 'sidebar-position',
								type: 'layout-picker',
								scrollTarget: 'sidebar',
								target: {
									kind: 'layout',
									id: 'main',
								},
								operation: 'transplantLayout',
								conditions: [
									{ controlId: 'sidebar', equals: true },
								],
								// Position picker hides the toggle-off
								// layout; pool order shows Left, Right.
								catalogPool: 'layout',
								catalogExclude: ['no-sidebar'],
							},
						],
					},
				],
			},
		},
		{
			id: 'site-footer',
			title: __('Site Footer', 'blockera'),
			headerToggle: {
				id: 'footer',
				type: 'toggle',
				label: __('Site Footer', 'blockera'),
				target: { kind: 'section', id: 'footer' },
				operation: 'toggleSection',
				onValue: true,
				offValue: false,
				defaultValue: true,
				catalogPool: 'footer',
				insert: FOOTER_STACKED_PLACEMENT,
			},
			controls: [],
			nestedPanel: {
				id: 'site-footer',
				title: __('Site Footer', 'blockera'),
				groups: [
					{
						id: 'footer-layout',
						title: __('Layout', 'blockera'),
						controls: [
							{
								id: 'footer-design',
								type: 'layout-picker',
								target: FOOTER_SECTION,
								operation: 'swapTemplatePart',
								conditions: [
									{ controlId: 'footer', equals: true },
								],
								catalogPool: 'footer',
							},
						],
					},
					{
						id: 'footer-styles',
						title: __('Styles', 'blockera'),
						keepVisible: true,
						controls: [
							sectionCustomizeControl(
								FOOTER_SECTION,
								'footer-customize'
							),
						],
					},
				],
			},
		},
	],
};
