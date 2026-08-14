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
import type { TemplateOptionsConfig } from '../shared/types';

const HEADER_STACKED_PLACEMENT = {
	relativeTo: 'archive-body',
	position: 'before' as const,
};

const FOOTER_STACKED_PLACEMENT = {
	relativeTo: 'archive-body',
	position: 'after' as const,
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
	layoutId: 'archive-body',
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
		'page-title': { kind: 'groupWrapping', childName: 'core/query-title' },
		'posts-listing': { kind: 'blockName', name: 'core/query' },
		pagination: { kind: 'blockName', name: 'core/query-pagination' },
	},
	// Page-title sits full-width above the content/sidebar columns and must
	// be carried across layout transplants.
	layoutSiblingSections: ['page-title'],
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
						id: 'header-design-group',
						title: __('Design', 'blockera'),
						controls: [
							{
								id: 'header-design',
								type: 'layout-picker',
								label: __('Header Design', 'blockera'),
								target: { kind: 'section', id: 'header' },
								operation: 'swapTemplatePart',
								conditions: [
									{ controlId: 'header', equals: true },
								],
								catalogPool: 'header',
							},
						],
					},
				],
			},
		},
		{
			id: 'page-header',
			title: __('Page Header', 'blockera'),
			headerToggle: {
				id: 'page-title',
				type: 'toggle',
				label: __('Archive Title', 'blockera'),
				target: { kind: 'section', id: 'page-title' },
				operation: 'toggleSection',
				onValue: true,
				offValue: false,
				defaultValue: true,
				insert: {
					relativeTo: 'archive-body',
					position: 'inside-start',
				},
				catalogPool: 'page-title',
			},
			controls: [
				{
					id: 'page-title-design',
					type: 'layout-picker',
					label: __('Header Design', 'blockera'),
					target: { kind: 'section', id: 'page-title' },
					operation: 'swapSection',
					conditions: [{ controlId: 'page-title', equals: true }],
					catalogPool: 'page-title',
				},
			],
		},
		{
			id: 'page-layout',
			title: __('Posts Loop', 'blockera'),
			controls: [
				{
					id: 'posts-template',
					type: 'layout-picker',
					label: __('Posts Template', 'blockera'),
					target: { kind: 'section', id: 'posts-listing' },
					operation: 'swapSection',
					// Listing patterns ship with standard pagination inside;
					// keep the user's query setup and pagination design
					// across swaps.
					swapHints: {
						preserveQuery: true,
						reapplyControls: ['pagination-type'],
					},
					catalogPool: 'posts-listing',
				},
				{
					id: 'posts-per-page',
					type: 'number',
					label: __('Number of posts', 'blockera'),
					target: { kind: 'setting', id: 'posts_per_page' },
					operation: 'setTemplateSetting',
					settingPath: 'posts_per_page',
					defaultValue: 10,
					min: 1,
					max: 50,
					step: 1,
				},
				{
					id: 'pagination',
					type: 'toggle',
					label: __('Pagination', 'blockera'),
					separatorBefore: true,
					target: { kind: 'section', id: 'pagination' },
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
				{
					id: 'pagination-type',
					type: 'segmented-choice',
					label: __('Pagination Type', 'blockera'),
					target: { kind: 'section', id: 'pagination' },
					operation: 'swapSection',
					conditions: [{ controlId: 'pagination', equals: true }],
					catalogPool: 'pagination',
				},
			],
		},
		{
			id: 'sidebar',
			title: __('Sidebar', 'blockera'),
			headerToggle: {
				id: 'sidebar',
				type: 'toggle',
				label: __('Sidebar', 'blockera'),
				target: { kind: 'layout', id: 'archive-body' },
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
								label: __('Sidebar Position', 'blockera'),
								target: {
									kind: 'layout',
									id: 'archive-body',
								},
								operation: 'transplantLayout',
								conditions: [
									{ controlId: 'sidebar', equals: true },
								],
								// Position picker hides the toggle-off
								// layout; pool order shows Right, Left.
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
						id: 'footer-design-group',
						title: __('Design', 'blockera'),
						controls: [
							{
								id: 'footer-design',
								type: 'layout-picker',
								label: __('Footer Design', 'blockera'),
								target: { kind: 'section', id: 'footer' },
								operation: 'swapTemplatePart',
								conditions: [
									{ controlId: 'footer', equals: true },
								],
								catalogPool: 'footer',
							},
						],
					},
				],
			},
		},
	],
};
