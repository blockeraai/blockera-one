/**
 * Stamp ids used by ops (meta items, listing presets, layout columns).
 * Dictionary roles live in `stamps.ts`; these are the id tokens only.
 */

export const STAMP_IDS = {
	postsListing: 'posts-listing',
	postMeta: 'post-meta',
	postMeta2: 'post-meta-2',
	sidebarColumn: 'sidebar-column',
	contentColumn: 'content-column',
	layoutColumns: 'layout-columns',
} as const;

export const FULL_WIDTH_LISTING_STAMP = 'section/posts-listing:full-width';
