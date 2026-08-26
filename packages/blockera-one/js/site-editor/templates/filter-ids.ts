/**
 * Purpose-nav filter ids. Pure — no React, no history, no URL parse.
 */

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
