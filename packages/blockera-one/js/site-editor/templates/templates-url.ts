/**
 * Templates purpose-nav query keys and URL parse. No history writes.
 */

import { addQueryArgs, getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { ROUTES } from '../constants';
import { FILTER_IDS, isChildrenFilter, type FilterId } from './filter-ids';

/** Core Templates DataViews tab query key (`active` / `user` / author_text). */
export const TEMPLATES_ACTIVE_VIEW_QUERY = 'activeView';

/**
 * Combined purpose / parts-hub / nested-panel path.
 * Example: `archive/posts-loop/post-title` or `sidebar`.
 */
export const TEMPLATES_BUILDER_QUERY = 'blockera-builder';

export const TEMPLATE_POST_TYPE = 'wp_template';
export const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

/** General Area Hub areas (site-wide header / footer / sidebar). */
export const PART_AREA_IDS = ['header', 'footer', 'sidebar'] as const;

export type PartAreaId = (typeof PART_AREA_IDS)[number];

export const TEMPLATES_QUERY_KEYS_TO_SCRUB = [
	TEMPLATES_BUILDER_QUERY,
	TEMPLATES_ACTIVE_VIEW_QUERY,
	'canvas',
] as const;

export type TemplatesUrlState = {
	filter: FilterId;
	partsArea: PartAreaId | null;
	/** Nested options panel stack (e.g. `['posts-loop']`). */
	optionsPanel: string[];
	path: string;
};

export type BlockeraBuilderState = Omit<TemplatesUrlState, 'path'>;

function splitBuilderSegments(raw: string): string[] {
	return raw
		.split('/')
		.map((s) => s.trim())
		.filter(Boolean);
}

function isPartAreaId(value: string): value is PartAreaId {
	return (PART_AREA_IDS as readonly string[]).includes(value);
}

/**
 * Parse `blockera-builder` into purpose / parts-hub / nested stack.
 */
export function parseBlockeraBuilder(
	href: string = typeof window !== 'undefined' ? window.location.href : ''
): BlockeraBuilderState {
	const empty: BlockeraBuilderState = {
		filter: FILTER_IDS.all,
		partsArea: null,
		optionsPanel: [],
	};

	const raw = getQueryArg(href, TEMPLATES_BUILDER_QUERY);
	if (typeof raw !== 'string' || !raw.length) {
		return empty;
	}

	const segments = splitBuilderSegments(raw);
	if (!segments.length) {
		return empty;
	}

	const [first, ...rest] = segments;
	if (isPartAreaId(first)) {
		return {
			filter: FILTER_IDS.all,
			partsArea: first,
			optionsPanel: rest,
		};
	}

	return {
		filter: first,
		partsArea: null,
		optionsPanel: rest,
	};
}

/**
 * Serialize purpose / parts-hub / nested stack to a `blockera-builder` value.
 * Empty All-templates state → `undefined` (scrub).
 */
export function serializeBlockeraBuilder(state: {
	filter?: FilterId | null;
	partsArea?: PartAreaId | null;
	optionsPanel?: string[] | null;
}): string | undefined {
	const stack = (state.optionsPanel || [])
		.map((s) => s.trim())
		.filter(Boolean);

	if (state.partsArea) {
		return [state.partsArea, ...stack].join('/');
	}

	const filter = state.filter;
	if (filter && filter !== FILTER_IDS.all) {
		return [String(filter), ...stack].join('/');
	}

	return undefined;
}

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

	const { filter, partsArea, optionsPanel } = parseBlockeraBuilder(href);

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
