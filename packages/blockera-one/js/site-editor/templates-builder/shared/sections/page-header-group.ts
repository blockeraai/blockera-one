/**
 * Page Header top-level group factory.
 */

import { __ } from '@wordpress/i18n';

import { breadcrumbsPanel } from '../blocks';
import {
	alignmentFeature,
	backgroundColorFeature,
	bottomSpacingFeature,
	customizeInEditorFeature,
	gapFeature,
	maxWidthFeature,
	minHeightFeature,
	spacingFeature,
} from '../features';
import type { ControlDef, PanelGroupDef, SectionTarget } from '../types';
import {
	blockDesignPanel,
	pageHeaderBlock,
	PAGE_HEADER_INNER_ORDER,
	PAGE_HEADER_REQUIRED,
} from './section-blocks';

const PAGE_HEADER_DESIGN: ControlDef = {
	id: 'page-header-design',
	type: 'layout-picker',
	target: { kind: 'section', id: 'page-header' },
	operation: 'swapSection',
	conditions: [{ controlId: 'page-header', equals: true }],
	catalogPool: 'page-header',
	innerOrder: {
		parentId: 'page-header',
		ids: [],
		within: 'page-header',
	},
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

const PAGE_HEADER_SECTION: SectionTarget = {
	kind: 'section',
	id: 'page-header',
};

const BODY_CONTAINER = {
	kind: 'container' as const,
	id: 'body',
};

const TITLE_TARGET: SectionTarget = {
	kind: 'section',
	id: 'page-header-title',
};

const DESCRIPTION_TARGET: SectionTarget = {
	kind: 'section',
	id: 'page-header-description',
};

export type PageHeaderGroupOptions = {
	extraElements?: ControlDef[];
	reapplyControls?: string[];
};

export function pageHeaderGroup(
	options?: PageHeaderGroupOptions
): PanelGroupDef {
	const extra = options?.extraElements ?? [];
	const extraStampIds = extra.map((control) =>
		control.target?.kind === 'section' ? control.target.id : control.id
	);
	const innerOrder = extra.length
		? {
				...PAGE_HEADER_INNER_ORDER,
				ids: [...PAGE_HEADER_INNER_ORDER.ids, ...extraStampIds],
			}
		: PAGE_HEADER_INNER_ORDER;
	const elementOptions = extra.length
		? { innerOrder, requireAtLeastOneOf: PAGE_HEADER_REQUIRED }
		: undefined;
	const design: ControlDef = extra.length
		? {
				...PAGE_HEADER_DESIGN,
				swapHints: {
					reapplyControls: [
						...(PAGE_HEADER_DESIGN.swapHints?.reapplyControls ||
							[]),
						...(options?.reapplyControls ||
							extra.map((control) => control.id)),
					],
				},
			}
		: PAGE_HEADER_DESIGN;

	return {
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
		controls: [design],
		nestedPanel: {
			id: 'page-header-settings',
			title: __('Page Header', 'blockera'),
			gatewayLabel: __('Styles & Blocks', 'blockera'),
			groups: [
				{
					id: 'page-header-layout',
					title: __('Layout', 'blockera'),
					controls: [design],
				},
				{
					id: 'page-header-styles',
					title: __('Styles', 'blockera'),
					controls: [
						gapFeature(PAGE_HEADER_SECTION, 'page-header-gap', {
							alsoSetOn: ['body'],
							conditions: [...PAGE_HEADER_ON],
						}),
						bottomSpacingFeature(
							PAGE_HEADER_SECTION,
							'page-header-bottom-spacing',
							{
								label: __('Bottom Space', 'blockera'),
								conditions: PAGE_HEADER_SIMPLE,
							}
						),
						alignmentFeature(
							PAGE_HEADER_SECTION,
							'page-header-align',
							{
								alsoSetOn: ['body'],
								conditions: PAGE_HEADER_SIMPLE,
							}
						),
						alignmentFeature(
							BODY_CONTAINER,
							'page-header-align-banner',
							{
								conditions: PAGE_HEADER_BANNER,
							}
						),
						backgroundColorFeature(
							PAGE_HEADER_SECTION,
							'page-header-bg-color',
							{
								conditions: PAGE_HEADER_BANNER,
							}
						),
						minHeightFeature(
							PAGE_HEADER_SECTION,
							'page-header-min-height',
							{
								conditions: PAGE_HEADER_BANNER,
							}
						),
						spacingFeature(
							PAGE_HEADER_SECTION,
							'page-header-padding',
							{
								label: __('Inner Padding', 'blockera'),
								attributeMergeKeys: [
									'padding.top',
									'padding.bottom',
								],
								unitType: 'padding',
								conditions: PAGE_HEADER_BANNER,
							}
						),
						maxWidthFeature(
							BODY_CONTAINER,
							'page-header-body-width',
							{
								label: __('Inner Width', 'blockera'),
								conditions: PAGE_HEADER_BANNER,
							}
						),
						customizeInEditorFeature(
							PAGE_HEADER_SECTION,
							'page-header-customize',
							{
								conditions: [...PAGE_HEADER_ON],
							}
						),
					],
				},
				{
					id: 'page-header-blocks',
					title: __('Blocks', 'blockera'),
					sortable: true,
					controls: [
						pageHeaderBlock(
							'page-header-title',
							__('Title', 'blockera'),
							blockDesignPanel(
								'page-header-title',
								__('Title', 'blockera'),
								'title-styles',
								TITLE_TARGET,
								'title'
							),
							{
								insert: {
									relativeTo: 'body',
									position: 'inside-start',
								},
								...elementOptions,
							}
						),
						pageHeaderBlock(
							'page-header-description',
							__('Description', 'blockera'),
							blockDesignPanel(
								'page-header-description',
								__('Description', 'blockera'),
								'description-styles',
								DESCRIPTION_TARGET,
								'description'
							),
							elementOptions
						),
						pageHeaderBlock(
							'page-header-breadcrumbs',
							__('Breadcrumbs', 'blockera'),
							breadcrumbsPanel(),
							{ defaultValue: false, ...elementOptions }
						),
						...extra,
					],
				},
			],
		},
	};
}
