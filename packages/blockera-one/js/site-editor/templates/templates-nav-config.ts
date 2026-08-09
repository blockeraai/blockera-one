/**
 * Static purpose-nav tree for Templates (labels + filter ids + icons).
 * Dynamic CPT / author / child rows are merged at runtime.
 */

import { createElement, Fragment, type ReactNode } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { FILTER_IDS, type FilterId, type PartAreaId } from './constants';

export type NavIcon =
	| 'layout'
	| 'home'
	| 'page'
	| 'post'
	| 'archive'
	| 'category'
	| 'tag'
	| 'author'
	| 'search'
	| 'not-found'
	| 'header'
	| 'footer'
	| 'sidebar'
	| 'plugins'
	| 'custom'
	| 'active'
	| 'calendar'
	| 'media'
	| 'list'
	| 'verse'
	| 'blockera-one';

export type TemplatesNavItemConfig = {
	id: FilterId;
	label: string;
	icon: NavIcon;
	/** Purpose / source filter applied to the browse list. */
	filter: FilterId;
	/** When set, opens the General Area Hub for this template-part area. */
	partsArea?: PartAreaId;
	/** Base slug used for canvas preview (optional override). */
	baseSlug?: string;
	/**
	 * Site Editor `p` path for a non-template entity (e.g. `/page/{id}` for
	 * the selected homepage / posts page). Takes precedence over baseSlug.
	 */
	entityPath?: string;
	/** Show nested specific templates under this row. */
	showChildren?: boolean;
	/**
	 * Hide this row when no templates match the filter
	 * (base or children). Used for advanced types like Taxonomies.
	 */
	hideWhenEmpty?: boolean;
	/** Homepage row / fallback layer status badge. */
	status?: 'active' | 'fallback' | 'unused' | 'static';
	/** Translated status badge label. */
	statusLabel?: string;
	/** Longer explanation shown in a tooltip on the status badge (may include heading). */
	statusTooltip?: ReactNode;
	/**
	 * When true, TemplatesNav renders the front-page → home → index
	 * fallback chain as inline children under this row.
	 */
	showHomepageFallbacks?: boolean;
};

export type TemplatesNavSectionConfig = {
	id: string;
	label?: string;
	items: TemplatesNavItemConfig[];
};

export const TEMPLATES_NAV_SECTIONS: TemplatesNavSectionConfig[] = [
	{
		id: 'top',
		items: [
			{
				id: FILTER_IDS.all,
				label: __('All templates', 'blockera'),
				icon: 'layout',
				filter: FILTER_IDS.all,
			},
		],
	},
	{
		id: 'general',
		label: __('General', 'blockera'),
		/**
		 * Homepage rows are prepended at runtime; then Header / Footer /
		 * Sidebar (Sidebar only when a sidebar part is registered).
		 */
		items: [
			{
				id: 'parts-header',
				label: __('Header', 'blockera'),
				icon: 'header',
				filter: FILTER_IDS.parts,
				partsArea: 'header',
			},
			{
				id: 'parts-footer',
				label: __('Footer', 'blockera'),
				icon: 'footer',
				filter: FILTER_IDS.parts,
				partsArea: 'footer',
			},
			{
				id: 'parts-sidebar',
				label: __('Sidebar', 'blockera'),
				icon: 'sidebar',
				filter: FILTER_IDS.parts,
				partsArea: 'sidebar',
			},
		],
	},
	{
		id: 'single',
		label: __('Single Templates', 'blockera'),
		items: [
			{
				id: FILTER_IDS.singular,
				label: __('Singular', 'blockera'),
				icon: 'layout',
				filter: FILTER_IDS.singular,
				baseSlug: 'singular',
				hideWhenEmpty: true,
				status: 'fallback',
				statusLabel: __('Fallback', 'blockera'),
				statusTooltip: createElement(
					Fragment,
					null,
					createElement(
						'h5',
						null,
						__('singular.html template', 'blockera')
					),
					createElement(
						'p',
						null,
						__(
							'Fallback for single content. Used for posts, pages, attachments, and custom post types when a more specific template is missing.',
							'blockera'
						)
					)
				),
			},
			{
				id: FILTER_IDS.single,
				label: __('Single Post', 'blockera'),
				icon: 'post',
				filter: FILTER_IDS.single,
				baseSlug: 'single',
				showChildren: true,
			},
			{
				id: FILTER_IDS.page,
				label: __('Single Page', 'blockera'),
				icon: 'page',
				filter: FILTER_IDS.page,
				baseSlug: 'page',
				showChildren: true,
			},
			{
				id: FILTER_IDS.attachment,
				label: __('Attachments', 'blockera'),
				icon: 'media',
				filter: FILTER_IDS.attachment,
				baseSlug: 'attachment',
				showChildren: true,
				hideWhenEmpty: true,
			},
		],
	},
	{
		id: 'archives',
		label: __('Archives & taxonomies', 'blockera'),
		items: [
			{
				id: FILTER_IDS.archive,
				label: __('All archives', 'blockera'),
				icon: 'archive',
				filter: FILTER_IDS.archive,
				baseSlug: 'archive',
			},
			{
				id: FILTER_IDS.category,
				label: __('Categories', 'blockera'),
				icon: 'category',
				filter: FILTER_IDS.category,
				baseSlug: 'category',
				showChildren: true,
			},
			{
				id: FILTER_IDS.tag,
				label: __('Tags', 'blockera'),
				icon: 'tag',
				filter: FILTER_IDS.tag,
				baseSlug: 'tag',
				showChildren: true,
			},
			{
				id: FILTER_IDS.author,
				label: __('Authors', 'blockera'),
				icon: 'author',
				filter: FILTER_IDS.author,
				baseSlug: 'author',
				showChildren: true,
			},
			{
				id: FILTER_IDS.date,
				label: __('Date', 'blockera'),
				icon: 'calendar',
				filter: FILTER_IDS.date,
				baseSlug: 'date',
			},
			{
				id: FILTER_IDS.taxonomy,
				label: __('Taxonomy', 'blockera'),
				icon: 'category',
				filter: FILTER_IDS.taxonomy,
				baseSlug: 'taxonomy',
				showChildren: true,
				hideWhenEmpty: true,
			},
		],
	},
	{
		id: 'system',
		label: __('System', 'blockera'),
		items: [
			{
				id: FILTER_IDS.search,
				label: __('Search', 'blockera'),
				icon: 'search',
				filter: FILTER_IDS.search,
				baseSlug: 'search',
			},
			{
				id: FILTER_IDS.notFound,
				label: __('404 page', 'blockera'),
				icon: 'not-found',
				filter: FILTER_IDS.notFound,
				baseSlug: '404',
			},
		],
	},
	{
		id: 'other',
		label: __('Other', 'blockera'),
		items: [
			{
				id: FILTER_IDS.custom,
				label: __('Custom templates', 'blockera'),
				icon: 'custom',
				filter: FILTER_IDS.custom,
			},
		],
	},
];
