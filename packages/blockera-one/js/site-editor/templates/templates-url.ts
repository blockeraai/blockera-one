/**
 * Templates purpose-nav query keys and URL parse. No history writes.
 */

import { addQueryArgs, getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { ROUTES } from '../constants';
import { readPanelStack } from '../nested-panels';
import { FILTER_IDS, isChildrenFilter, type FilterId } from './filter-ids';

/** Core Templates DataViews tab query key (`active` / `user` / author_text). */
export const TEMPLATES_ACTIVE_VIEW_QUERY = 'activeView';

/** URL query key for purpose / source filter. */
export const TEMPLATES_FILTER_QUERY = 'boFilter';

/** URL query key for General Area Hub (header / footer / sidebar). */
export const TEMPLATES_PARTS_AREA_QUERY = 'partsArea';

/** URL query key for Templates Builder nested options panel stack. */
export const TEMPLATES_OPTIONS_PANEL_QUERY = 'boBuilder';

export const TEMPLATE_POST_TYPE = 'wp_template';
export const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

/** General Area Hub areas (site-wide header / footer / sidebar). */
export const PART_AREA_IDS = ['header', 'footer', 'sidebar'] as const;

export type PartAreaId = (typeof PART_AREA_IDS)[number];

export const TEMPLATES_QUERY_KEYS_TO_SCRUB = [
	TEMPLATES_FILTER_QUERY,
	TEMPLATES_PARTS_AREA_QUERY,
	TEMPLATES_OPTIONS_PANEL_QUERY,
	TEMPLATES_ACTIVE_VIEW_QUERY,
	'canvas',
] as const;

export type TemplatesUrlState = {
	filter: FilterId;
	partsArea: PartAreaId | null;
	/** Nested options panel stack (e.g. `['sidebar']`). */
	optionsPanel: string[];
	path: string;
};

/**
 * Read purpose-nav state from the current Site Editor URL.
 */
export function getTemplatesUrlState(
	href: string = typeof window !== 'undefined' ? window.location.href : ''
): TemplatesUrlState {
	const p = getQueryArg(href, 'p');
	const path =
		typeof p === 'string' && p.length > 0
			? p.split('?')[0] || ROUTES.templates
			: ROUTES.templates;

	let filter: FilterId = FILTER_IDS.all;
	const fromQuery = getQueryArg(href, TEMPLATES_FILTER_QUERY);
	if (typeof fromQuery === 'string' && fromQuery.length > 0) {
		filter = fromQuery;
	} else if (typeof p === 'string' && p.includes('?')) {
		const embedded = getQueryArg(
			`https://x.local${p}`,
			TEMPLATES_FILTER_QUERY
		);
		if (typeof embedded === 'string' && embedded.length > 0) {
			filter = embedded;
		}
	}

	let partsArea: PartAreaId | null = null;
	const area = getQueryArg(href, TEMPLATES_PARTS_AREA_QUERY);
	if (
		typeof area === 'string' &&
		(PART_AREA_IDS as readonly string[]).includes(area)
	) {
		partsArea = area as PartAreaId;
	}

	const optionsPanel = readPanelStack(TEMPLATES_OPTIONS_PANEL_QUERY, href);

	return { filter, partsArea, optionsPanel, path };
}

/**
 * Map purpose-nav filter → core DataViews `activeView` (when applicable).
 */
export function getCoreActiveViewForFilter(
	filter: FilterId | null | undefined
): string | undefined {
	if (!filter || filter === FILTER_IDS.all || filter === FILTER_IDS.active) {
		return 'active';
	}
	if (filter === FILTER_IDS.user) {
		return 'user';
	}
	if (filter === FILTER_IDS.custom || isChildrenFilter(filter)) {
		// Filtered Blockera DataViews — not a core activeView tab.
		return undefined;
	}
	if (filter.startsWith('author:')) {
		return filter.slice('author:'.length);
	}
	// Purpose filters: keep core default Active tab list.
	return 'active';
}

export function buildTemplateItemPath(id: string | number): string {
	return `/wp_template/${id}`;
}

export function buildTemplatePartItemPath(id: string | number): string {
	return `/wp_template_part/${id}`;
}

/**
 * Logical Patterns path for an area (what core `history.navigate` accepts).
 * Example: `/pattern?postType=wp_template_part&categoryId=header`.
 */
export function buildPatternsTemplatePartsPath(area: PartAreaId): string {
	return addQueryArgs(ROUTES.patterns, {
		postType: TEMPLATE_PART_POST_TYPE,
		categoryId: area,
	});
}
