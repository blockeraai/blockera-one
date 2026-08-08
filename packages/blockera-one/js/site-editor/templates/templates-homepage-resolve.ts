/**
 * Homepage purpose-nav resolution: site-root active slug, layer badges,
 * and Homepage / Blog·Posts section items from Reading settings.
 */

import { __ } from '@wordpress/i18n';

import { ROUTES } from '../constants';
import {
	FILTER_IDS,
	getParentFilterFromChildrenFilter,
	isChildrenFilter,
	type FilterId,
} from './constants';
import type { TemplateLike } from './templates-matchers';
import type { TemplatesNavItemConfig } from './templates-nav-config';

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

const LAYER_FILTER: Record<HomepageLayerSlug, FilterId> = {
	'front-page': FILTER_IDS.frontPage,
	home: FILTER_IDS.home,
	index: FILTER_IDS.index,
};

const LAYER_LABEL: Record<HomepageLayerSlug, () => string> = {
	'front-page': () => __('Front Page', 'blockera'),
	home: () => __('Blog Home', 'blockera'),
	index: () => __('Index', 'blockera'),
};

const LAYER_ICON: Record<HomepageLayerSlug, TemplatesNavItemConfig['icon']> = {
	'front-page': 'home',
	home: 'verse',
	index: 'list',
};

export function getFilterIdForHomepageSlug(slug: HomepageLayerSlug): FilterId {
	return LAYER_FILTER[slug];
}

export function isStaticFrontPage(
	site: SiteReadingSettings | undefined | null
): boolean {
	return site?.show_on_front === 'page';
}

function normalizePageId(
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

	// Static homepage: only front-page applies to `/`. home/index are not
	// site-root fallbacks (home is for the posts page via Blog / Posts).
	if (isStaticFrontPage(site)) {
		if (slug === 'front-page' && activeSlug === 'front-page') {
			return 'active';
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

/**
 * Primary Homepage (+ optional Blog / Posts) rows for the homepage section.
 * Inline fallback layers are built separately in the nav.
 */
export function buildHomepageSectionItems(
	findBySlug: (slug: string) => TemplateLike | undefined,
	site: SiteReadingSettings | undefined | null
): TemplatesNavItemConfig[] {
	const activeSlug = getSiteRootActiveSlug(findBySlug, site);
	const frontPageId = normalizePageId(site?.page_on_front);
	const postsPageId = normalizePageId(site?.page_for_posts);

	const homepageItem: TemplatesNavItemConfig = {
		id: HOMEPAGE_NAV_ID,
		label: __('Homepage', 'blockera'),
		icon: 'home',
		showHomepageFallbacks: true,
		filter: activeSlug
			? getFilterIdForHomepageSlug(activeSlug)
			: FILTER_IDS.frontPage,
		baseSlug: activeSlug || 'front-page',
	};

	// Static front without front-page template → open the selected homepage page.
	if (isStaticFrontPage(site) && !activeSlug && frontPageId) {
		homepageItem.entityPath = buildPageItemPath(frontPageId);
		homepageItem.baseSlug = undefined;
		homepageItem.filter = HOMEPAGE_NAV_ID;
	}

	// Reading settings use a static homepage page — surface that on the row.
	if (isStaticFrontPage(site) && frontPageId) {
		homepageItem.status = 'static';
		homepageItem.statusLabel = getStaticPageStatusLabel();
	}

	const items: TemplatesNavItemConfig[] = [homepageItem];

	if (shouldShowBlogPostsRow(site) && postsPageId) {
		items.push({
			id: BLOG_POSTS_NAV_ID,
			label: __('Blog Home', 'blockera'),
			icon: 'verse',
			filter: BLOG_POSTS_FILTER,
			// Posts page entity — not the home.html template.
			entityPath: buildPageItemPath(postsPageId),
			status: 'static',
			statusLabel: getStaticPageStatusLabel(),
		});
	}

	return items;
}

/**
 * True when the purpose filter belongs to Homepage or one of its
 * fallback / child-template rows (so inline fallbacks should expand).
 */
export function isHomepageBranchFilter(
	filter: FilterId | null | undefined,
	homepageItem: TemplatesNavItemConfig,
	fallbacks: TemplatesNavItemConfig[]
): boolean {
	if (!filter) {
		return false;
	}

	if (filter === homepageItem.filter || filter === HOMEPAGE_NAV_ID) {
		return true;
	}

	const branchFilters = new Set<string>([
		String(homepageItem.filter),
		HOMEPAGE_NAV_ID,
		...fallbacks.map((row) => String(row.filter)),
	]);

	if (branchFilters.has(String(filter))) {
		return true;
	}

	if (isChildrenFilter(filter)) {
		const parent = getParentFilterFromChildrenFilter(filter);
		return !!parent && branchFilters.has(String(parent));
	}

	return false;
}

/**
 * Inline child rows: Front Page / Blog Home / Index with status badges.
 * Front Page keeps showChildren for front-page-* templates.
 */
export function buildHomepageFallbackNavItems(
	findBySlug: (slug: string) => TemplateLike | undefined,
	site?: SiteReadingSettings | null
): TemplatesNavItemConfig[] {
	const activeSlug = getSiteRootActiveSlug(findBySlug, site);

	return HOMEPAGE_LAYER_SLUGS.map((slug) => {
		const exists = !!findBySlug(slug);
		const status = getHomepageLayerStatus(slug, activeSlug, exists, site);

		return {
			id: `homepage-fallback:${slug}`,
			label: LAYER_LABEL[slug](),
			icon: LAYER_ICON[slug],
			filter: LAYER_FILTER[slug],
			baseSlug: slug,
			showChildren: slug === 'front-page',
			status,
			statusLabel: getHomepageStatusLabel(status),
		};
	});
}
