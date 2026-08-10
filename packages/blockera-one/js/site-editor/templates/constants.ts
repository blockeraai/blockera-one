/**
 * Templates purpose-nav query keys, filter ids, and URL helpers.
 */

import { addQueryArgs, getQueryArg, getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { ROUTES } from '../constants';
import {
	setPendingSidebarNavDirection,
	type SidebarNavDirection,
} from '../utils';
import { rememberTemplatesSidebarScroll } from './templates-sidebar-scroll';

/** Core Templates DataViews tab query key (`active` / `user` / author_text). */
export const TEMPLATES_ACTIVE_VIEW_QUERY = 'activeView';

/** URL query key for purpose / source filter. */
export const TEMPLATES_FILTER_QUERY = 'boFilter';

/** URL query key for General Area Hub (header / footer / sidebar). */
export const TEMPLATES_PARTS_AREA_QUERY = 'partsArea';

export const TEMPLATE_POST_TYPE = 'wp_template';
export const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

/** Built-in filter ids. */
export const FILTER_IDS = {
	all: 'all',
	active: 'active',
	user: 'user',
	custom: 'custom',
	parts: 'parts',
	frontPage: 'front-page',
	home: 'home',
	index: 'index',
	single: 'single',
	page: 'page',
	singular: 'singular',
	attachment: 'attachment',
	archive: 'archive',
	category: 'category',
	tag: 'tag',
	author: 'author',
	date: 'date',
	taxonomy: 'taxonomy',
	search: 'search',
	notFound: '404',
} as const;

export type FilterId = (typeof FILTER_IDS)[keyof typeof FILTER_IDS] | string;

/** Browse filter for a parent’s child templates (`children:category`, …). */
export const CHILDREN_FILTER_PREFIX = 'children:';

export function buildChildrenFilter(parentFilter: FilterId): FilterId {
	return `${CHILDREN_FILTER_PREFIX}${parentFilter}`;
}

export function isChildrenFilter(filter: FilterId | null | undefined): boolean {
	return (
		typeof filter === 'string' && filter.startsWith(CHILDREN_FILTER_PREFIX)
	);
}

export function getParentFilterFromChildrenFilter(
	filter: FilterId
): FilterId | null {
	if (!isChildrenFilter(filter)) {
		return null;
	}
	return filter.slice(CHILDREN_FILTER_PREFIX.length) || null;
}

/** General Area Hub areas (site-wide header / footer / sidebar). */
export const PART_AREA_IDS = ['header', 'footer', 'sidebar'] as const;

export type PartAreaId = (typeof PART_AREA_IDS)[number];

const TEMPLATES_QUERY_KEYS_TO_SCRUB = [
	TEMPLATES_FILTER_QUERY,
	TEMPLATES_PARTS_AREA_QUERY,
	TEMPLATES_ACTIVE_VIEW_QUERY,
	'canvas',
] as const;

export type TemplatesUrlState = {
	filter: FilterId;
	partsArea: PartAreaId | null;
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

	return { filter, partsArea, path };
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

/**
 * SPA navigate via history + popstate; scrub empty Templates query keys.
 */
function pushSiteEditorQuery(
	nextQuery: Record<string, string | undefined>
): void {
	const absoluteUrl = addQueryArgs(window.location.href, nextQuery);
	let nextUrl = absoluteUrl;

	try {
		const parsed = new URL(absoluteUrl);
		TEMPLATES_QUERY_KEYS_TO_SCRUB.forEach((key) => {
			const value = parsed.searchParams.get(key);
			if (!value || value === 'undefined') {
				parsed.searchParams.delete(key);
			}
		});
		nextUrl = `${parsed.pathname}${parsed.search}${parsed.hash}`;
	} catch (_e) {
		// Keep absoluteUrl fallback.
	}

	const prevState =
		typeof window.history.state === 'object' && window.history.state
			? window.history.state
			: {};
	const nextIdx =
		typeof (prevState as { idx?: number }).idx === 'number'
			? (prevState as { idx: number }).idx + 1
			: 0;

	window.history.pushState(
		{
			...prevState,
			usr: (prevState as { usr?: unknown }).usr ?? null,
			key: Math.random().toString(36).slice(2, 10),
			idx: nextIdx,
		},
		'',
		nextUrl
	);
	window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Navigate within Templates routes while preserving/clearing filter query args.
 */
export function navigateTemplates(
	path: string,
	options?: {
		filter?: FilterId | null;
		partsArea?: PartAreaId | null;
		direction?: SidebarNavDirection;
		clearFilter?: boolean;
		/** Core DataViews tab; pass `null` to clear. */
		activeView?: string | null;
		/** Canvas mode (`edit` for full editor). Pass `null` to clear. */
		canvas?: 'edit' | 'view' | null;
	}
): void {
	if (typeof window === 'undefined') {
		return;
	}

	// Capture purpose-nav scroll before routeKey remount can wipe it.
	rememberTemplatesSidebarScroll();

	if (options?.direction) {
		setPendingSidebarNavDirection(options.direction);
	}

	const current = getTemplatesUrlState();
	const nextQuery: Record<string, string | undefined> = {
		p: path,
	};

	if (options?.clearFilter) {
		nextQuery[TEMPLATES_FILTER_QUERY] = undefined;
	} else if (options?.filter !== undefined) {
		nextQuery[TEMPLATES_FILTER_QUERY] =
			options.filter && options.filter !== FILTER_IDS.all
				? String(options.filter)
				: undefined;
	} else if (current.filter && current.filter !== FILTER_IDS.all) {
		nextQuery[TEMPLATES_FILTER_QUERY] = String(current.filter);
	}

	if (options?.partsArea === null) {
		nextQuery[TEMPLATES_PARTS_AREA_QUERY] = undefined;
	} else if (options?.partsArea !== undefined) {
		nextQuery[TEMPLATES_PARTS_AREA_QUERY] = options.partsArea || undefined;
	} else if (current.partsArea) {
		nextQuery[TEMPLATES_PARTS_AREA_QUERY] = current.partsArea;
	}

	const isBrowsePath =
		path === ROUTES.templates || path.startsWith(`${ROUTES.templates}?`);

	if (options?.activeView === null) {
		nextQuery[TEMPLATES_ACTIVE_VIEW_QUERY] = undefined;
	} else if (options?.activeView !== undefined) {
		nextQuery[TEMPLATES_ACTIVE_VIEW_QUERY] =
			options.activeView || undefined;
	} else if (isBrowsePath) {
		let filterForActiveView = current.filter;
		if (options?.clearFilter) {
			filterForActiveView = FILTER_IDS.all;
		} else if (options?.filter !== undefined) {
			filterForActiveView = options.filter;
		}
		nextQuery[TEMPLATES_ACTIVE_VIEW_QUERY] =
			getCoreActiveViewForFilter(filterForActiveView);
	} else {
		nextQuery[TEMPLATES_ACTIVE_VIEW_QUERY] = undefined;
	}

	if (options?.canvas === null) {
		nextQuery.canvas = undefined;
	} else if (options?.canvas !== undefined) {
		nextQuery.canvas =
			options.canvas === 'view' ? undefined : options.canvas;
	}

	pushSiteEditorQuery(nextQuery);
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

/**
 * Leave Templates Hub for the matching Patterns area list; clear Templates query state.
 *
 * Must mirror `@wordpress/router` `useHistory.navigate`: put the route in `p`
 * and keep `postType` / `categoryId` as top-level search params. Nesting them
 * inside `p` makes `useMatch` drop the area filter and open general Patterns.
 */
export function navigateToPatternsTemplatePartArea(area: PartAreaId): void {
	if (typeof window === 'undefined') {
		return;
	}

	setPendingSidebarNavDirection('forward');

	const pathQuery = getQueryArgs(buildPatternsTemplatePartsPath(area));

	pushSiteEditorQuery({
		p: ROUTES.patterns,
		...pathQuery,
		[TEMPLATES_FILTER_QUERY]: undefined,
		[TEMPLATES_PARTS_AREA_QUERY]: undefined,
		[TEMPLATES_ACTIVE_VIEW_QUERY]: undefined,
		canvas: undefined,
	});
}
