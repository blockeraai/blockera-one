/**
 * Homepage purpose-nav: Reading-settings slugs, layer status, and page paths.
 * Pure — no React tooltips or nav-item builders.
 */

import { __ } from '@wordpress/i18n';

import { ROUTES } from '../constants';
import { FILTER_IDS, type FilterId } from './filter-ids';
import type { TemplateLike } from './template-display';

/** WP site-root chain among homepage template types (latest-posts mode). */
export const HOMEPAGE_LAYER_SLUGS = ['front-page', 'home', 'index'] as const;

export type HomepageLayerSlug = (typeof HOMEPAGE_LAYER_SLUGS)[number];

export type HomepageLayerStatus = 'active' | 'fallback' | 'unused' | 'static';

/** Badge when Homepage / Blog Home targets an assigned Reading-settings page. */
export function getStaticPageStatusLabel(): string {
	return __('Static page', 'blockera');
}

export type SiteReadingSettings = {
	show_on_front?: string;
	page_on_front?: number;
	page_for_posts?: number;
};

/** Marker id for the primary Homepage row (not a WP template slug). */
export const HOMEPAGE_NAV_ID = 'homepage-root';

/** Marker id for the Blog / Posts row when a posts page is set. */
export const BLOG_POSTS_NAV_ID = 'homepage-blog-posts';

/** Purpose filter for Blog / Posts (posts page entity, not home template). */
export const BLOG_POSTS_FILTER = 'blog-posts';

/**
 * True when Templates purpose-nav is previewing a page entity (`/page/{id}`)
 * and the left sidebar must stay on Templates (not core Pages).
 */
export function isTemplatesOwnedPagePreview(
	filter: FilterId | null | undefined
): boolean {
	return filter === HOMEPAGE_NAV_ID || filter === BLOG_POSTS_FILTER;
}

export const LAYER_FILTER: Record<HomepageLayerSlug, FilterId> = {
	'front-page': FILTER_IDS.frontPage,
	home: FILTER_IDS.home,
	index: FILTER_IDS.index,
};

export function getFilterIdForHomepageSlug(slug: HomepageLayerSlug): FilterId {
	return LAYER_FILTER[slug];
}

export function isStaticFrontPage(
	site: SiteReadingSettings | undefined | null
): boolean {
	return site?.show_on_front === 'page';
}

export function normalizePageId(
	value: number | string | undefined | null
): number | null {
	const id = typeof value === 'string' ? parseInt(value, 10) : value;
	if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
		return null;
	}
	return id;
}

/** Site Editor path for a page entity (`/page/{id}`). */
export function buildPageItemPath(pageId: number | string): string {
	return `${ROUTES.pages}/${pageId}`;
}

/**
 * Template slug that wins for `/` among homepage types.
 * Static front page: only `front-page` (never `home` — that is the posts page).
 * Latest posts: first existing of front-page → home → index.
 */
export function getSiteRootActiveSlug(
	findBySlug: (slug: string) => TemplateLike | undefined,
	site?: SiteReadingSettings | null
): HomepageLayerSlug | null {
	if (isStaticFrontPage(site)) {
		return findBySlug('front-page') ? 'front-page' : null;
	}

	for (const slug of HOMEPAGE_LAYER_SLUGS) {
		if (findBySlug(slug)) {
			return slug;
		}
	}
	return null;
}

export function getHomepageLayerStatus(
	slug: HomepageLayerSlug,
	activeSlug: HomepageLayerSlug | null,
	exists: boolean,
	site?: SiteReadingSettings | null
): HomepageLayerStatus {
	if (!exists) {
		return 'unused';
	}

	// Static homepage: front-page wins `/` when present; Index remains the
	// site-wide fallback. Blog Home (`home`) is for the posts page, not `/`.
	if (isStaticFrontPage(site)) {
		if (slug === 'front-page' && activeSlug === 'front-page') {
			return 'active';
		}
		if (slug === 'index') {
			return 'fallback';
		}
		return 'unused';
	}

	if (activeSlug && slug === activeSlug) {
		return 'active';
	}
	if (!activeSlug) {
		return 'unused';
	}
	const activeIndex = HOMEPAGE_LAYER_SLUGS.indexOf(activeSlug);
	const slugIndex = HOMEPAGE_LAYER_SLUGS.indexOf(slug);
	if (slugIndex > activeIndex) {
		return 'fallback';
	}
	return 'unused';
}

export function getHomepageStatusLabel(status: HomepageLayerStatus): string {
	switch (status) {
		case 'active':
			return __('Active', 'blockera');
		case 'fallback':
			return __('Fallback', 'blockera');
		case 'static':
			return getStaticPageStatusLabel();
		case 'unused':
		default:
			return __('Not used', 'blockera');
	}
}

export function shouldShowBlogPostsRow(
	site: SiteReadingSettings | undefined | null
): boolean {
	if (!isStaticFrontPage(site)) {
		return false;
	}
	return normalizePageId(site?.page_for_posts) !== null;
}
