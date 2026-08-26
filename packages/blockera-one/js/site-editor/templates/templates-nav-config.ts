/**
 * Static purpose-nav tree for Templates (labels + filter ids + icons).
 * Dynamic CPT / author / child rows are merged at runtime.
 */

import type { ReactNode } from 'react';
import { createElement, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import type { NavItemIcon } from '../components/nav-item';
import { FILTER_IDS, type FilterId, type PartAreaId } from './constants';

export type TemplatesNavItemConfig = {
	id: FilterId;
	label: string;
	icon: NavItemIcon;
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
	 * Explicit nested nav rows (e.g. WooCommerce Shop → taxonomies).
	 * Always rendered as child rows when present — separate from showChildren
	 * hierarchy “Specific templates” browse.
	 */
	navChildren?: TemplatesNavItemConfig[];
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

function matchNavItemLabel(
	items: TemplatesNavItemConfig[],
	filterId: FilterId
): string | undefined {
	for (const item of items) {
		if (item.filter === filterId || String(item.id) === String(filterId)) {
			return item.label;
		}
		if (item.navChildren?.length) {
			const nested = matchNavItemLabel(item.navChildren, filterId);
			if (nested) {
				return nested;
			}
		}
	}
	return undefined;
}

/**
 * Label of the nav item matching a filter id. Pass the *runtime* sections
 * (from useTemplatesData) so dynamic CPT / WooCommerce rows resolve too;
 * searches nested navChildren (e.g. Woo Shop taxonomies).
 */
export function findNavItemLabel(
	sections: TemplatesNavSectionConfig[],
	filterId: FilterId
): string | undefined {
	for (const section of sections) {
		const label = matchNavItemLabel(section.items, filterId);
		if (label) {
			return label;
		}
	}
	return undefined;
}

export const TEMPLATES_NAV_SECTIONS: TemplatesNavSectionConfig[] = [
	{
		id: 'top',
		items: [
			{
				id: FILTER_IDS.all,
				label: __('All templates', 'blockera'),
				icon: { library: 'ui', icon: 'template' },
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
				icon: { library: 'ui', icon: 'template-header' },
				filter: FILTER_IDS.parts,
				partsArea: 'header',
			},
			{
				id: 'parts-footer',
				label: __('Footer', 'blockera'),
				icon: { library: 'ui', icon: 'template-footer' },
				filter: FILTER_IDS.parts,
				partsArea: 'footer',
			},
			{
				id: 'parts-sidebar',
				label: __('Sidebar', 'blockera'),
				icon: { library: 'ui', icon: 'template-sidebar' },
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
				icon: { library: 'ui', icon: 'post-base' },
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
				icon: { library: 'ui', icon: 'post' },
				filter: FILTER_IDS.single,
				baseSlug: 'single',
				showChildren: true,
			},
			{
				id: FILTER_IDS.page,
				label: __('Single Page', 'blockera'),
				icon: { library: 'wp', icon: 'page' },
				filter: FILTER_IDS.page,
				baseSlug: 'page',
				showChildren: true,
			},
			{
				id: FILTER_IDS.attachment,
				label: __('Attachments', 'blockera'),
				icon: { library: 'ui', icon: 'attachment' },
				filter: FILTER_IDS.attachment,
				baseSlug: 'attachment',
				showChildren: true,
				hideWhenEmpty: true,
			},
		],
	},
	{
		id: 'archives',
		label: __('Archive Templates', 'blockera'),
		items: [
			{
				id: FILTER_IDS.archive,
				label: __('All Archives', 'blockera'),
				icon: { library: 'ui', icon: 'archive-base' },
				filter: FILTER_IDS.archive,
				baseSlug: 'archive',
				status: 'fallback',
				statusLabel: __('Fallback', 'blockera'),
				statusTooltip: createElement(
					Fragment,
					null,
					createElement(
						'h5',
						null,
						__('archive.html template', 'blockera')
					),
					createElement(
						'p',
						null,
						__(
							'Fallback for archive-type pages. Used for categories, tags, authors, dates, and custom post type archives when a more specific template is missing.',
							'blockera'
						)
					)
				),
			},
			{
				id: FILTER_IDS.category,
				label: __('Categories', 'blockera'),
				icon: { library: 'ui', icon: 'categories' },
				filter: FILTER_IDS.category,
				baseSlug: 'category',
				showChildren: true,
			},
			{
				id: FILTER_IDS.tag,
				label: __('Tags', 'blockera'),
				icon: { library: 'wp', icon: 'tag' },
				filter: FILTER_IDS.tag,
				baseSlug: 'tag',
				showChildren: true,
				hideWhenEmpty: true,
			},
			{
				id: FILTER_IDS.author,
				label: __('Authors', 'blockera'),
				icon: { library: 'wp', icon: 'comment-author-avatar' },
				filter: FILTER_IDS.author,
				baseSlug: 'author',
				showChildren: true,
				hideWhenEmpty: true,
			},
			{
				id: FILTER_IDS.date,
				label: __('Date', 'blockera'),
				icon: { library: 'wp', icon: 'calendar' },
				filter: FILTER_IDS.date,
				baseSlug: 'date',
				hideWhenEmpty: true,
			},
			{
				id: FILTER_IDS.taxonomy,
				label: __('Taxonomy', 'blockera'),
				icon: { library: 'ui', icon: 'categories' },
				filter: FILTER_IDS.taxonomy,
				baseSlug: 'taxonomy',
				showChildren: true,
				hideWhenEmpty: true,
			},
		],
	},
	{
		id: 'system',
		label: __('Special Templates', 'blockera'),
		items: [
			{
				id: FILTER_IDS.search,
				label: __('Search Page', 'blockera'),
				icon: { library: 'wp', icon: 'search' },
				filter: FILTER_IDS.search,
				baseSlug: 'search',
			},
			{
				id: FILTER_IDS.notFound,
				label: __('404 Page', 'blockera'),
				icon: { library: 'ui', icon: 'post-not-found' },
				filter: FILTER_IDS.notFound,
				baseSlug: '404',
			},
		],
	},
	{
		id: 'woocommerce',
		label: __('WooCommerce Templates', 'blockera'),
		/** Rows are populated at runtime from active WooCommerce wp_templates. */
		items: [],
	},
	{
		id: 'other',
		label: __('Other', 'blockera'),
		items: [
			{
				id: FILTER_IDS.custom,
				label: __('Custom templates', 'blockera'),
				icon: { library: 'ui', icon: 'template-new' },
				filter: FILTER_IDS.custom,
			},
		],
	},
];
