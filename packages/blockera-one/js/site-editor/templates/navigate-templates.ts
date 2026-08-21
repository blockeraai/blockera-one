/**
 * SPA navigate for Templates purpose-nav (scroll, pending direction, panel stack).
 */

import { getQueryArgs } from '@wordpress/url';

/**
 * Blockera dependencies
 */
import { pushSiteEditorHistory } from '@blockera/utils';

/**
 * Internal dependencies
 */
import { ROUTES } from '../constants';
import {
	setPendingSidebarNavDirection,
	type SidebarNavDirection,
} from '../navigation/history';
import { FILTER_IDS, type FilterId } from './filter-ids';
import { rememberTemplatesSidebarScroll } from './templates-sidebar-scroll';
import {
	TEMPLATES_ACTIVE_VIEW_QUERY,
	TEMPLATES_FILTER_QUERY,
	TEMPLATES_OPTIONS_PANEL_QUERY,
	TEMPLATES_PARTS_AREA_QUERY,
	TEMPLATES_QUERY_KEYS_TO_SCRUB,
	buildPatternsTemplatePartsPath,
	getCoreActiveViewForFilter,
	getTemplatesUrlState,
	type PartAreaId,
} from './templates-url';

/**
 * SPA navigate via shared history writer; scrub empty Templates query keys.
 */
function pushSiteEditorQuery(
	nextQuery: Record<string, string | undefined>
): void {
	pushSiteEditorHistory(nextQuery, {
		scrubKeys: TEMPLATES_QUERY_KEYS_TO_SCRUB,
	});
}

/**
 * Navigate within Templates routes while preserving/clearing filter query args.
 */
export function navigateTemplates(
	path: string,
	options?: {
		filter?: FilterId | null;
		partsArea?: PartAreaId | null;
		/** Nested options stack; pass `null` or `[]` to clear. */
		optionsPanel?: string[] | null;
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

	if (
		options?.clearFilter ||
		options?.optionsPanel === null ||
		(Array.isArray(options?.optionsPanel) &&
			options.optionsPanel.length === 0)
	) {
		nextQuery[TEMPLATES_OPTIONS_PANEL_QUERY] = undefined;
	} else if (options?.optionsPanel !== undefined) {
		nextQuery[TEMPLATES_OPTIONS_PANEL_QUERY] =
			options.optionsPanel.join('/') || undefined;
	} else if (options?.filter !== undefined) {
		// Changing purpose filter drops nested options screens.
		nextQuery[TEMPLATES_OPTIONS_PANEL_QUERY] = undefined;
	} else if (current.optionsPanel.length) {
		nextQuery[TEMPLATES_OPTIONS_PANEL_QUERY] =
			current.optionsPanel.join('/');
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
		[TEMPLATES_OPTIONS_PANEL_QUERY]: undefined,
		[TEMPLATES_ACTIVE_VIEW_QUERY]: undefined,
		canvas: undefined,
	});
}
