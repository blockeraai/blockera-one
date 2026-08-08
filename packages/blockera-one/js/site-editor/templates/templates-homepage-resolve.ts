/**
 * Homepage purpose-nav resolution: site-root active slug, layer badges,
 * and Homepage / Blog·Posts section items from Reading settings.
 */

import { createElement, Fragment, type ReactNode } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

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

/** Body copy for a Homepage status badge tooltip. */
function getHomepageStatusTooltipBody(
	status: HomepageLayerStatus,
	slug?: HomepageLayerSlug
): string {
	if (slug === 'index') {
		switch (status) {
			case 'active':
				return __(
					'Used for the site homepage (/), and as the final fallback for all templates when a more specific one is missing.',
					'blockera'
				);
			case 'fallback':
				return __(
					'Final fallback for all templates on the site when a more specific template is missing — not only the homepage.',
					'blockera'
				);
			case 'unused':
			default:
				return __(
					'Not serving the homepage right now. Index can still act as the final fallback for other templates.',
					'blockera'
				);
		}
	}

	switch (status) {
		case 'active':
			return __('Currently used for your site homepage (/).', 'blockera');
		case 'fallback':
			return __(
				'Used when a more specific homepage template is missing.',
				'blockera'
			);
		case 'static':
			return __(
				'Assigned as a static page in Reading settings (Homepage or Posts page).',
				'blockera'
			);
		case 'unused':
		default:
			return __(
				'Not used for the site homepage with your current Reading settings.',
				'blockera'
			);
	}
}

/**
 * Status badge tooltip: h5 with template file name, then explanation.
 * Example heading: “home.html template”.
 */
export function getHomepageStatusTooltip(
	status: HomepageLayerStatus,
	slug?: HomepageLayerSlug
): ReactNode {
	const body = getHomepageStatusTooltipBody(status, slug);
	const heading = slug
		? sprintf(
				/* translators: %s: template slug without extension (e.g. home, front-page) */
				__('%s.html template', 'blockera'),
				slug
			)
		: getStaticPageStatusLabel();

	return createElement(
		Fragment,
		null,
		createElement('h5', null, heading),
		createElement('p', null, body)
	);
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
		homepageItem.statusLabel = getHomepageStatusLabel('static');
		homepageItem.statusTooltip = getHomepageStatusTooltip('static');
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
			statusLabel: getHomepageStatusLabel('static'),
			statusTooltip: getHomepageStatusTooltip('static'),
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
 * Front Page is omitted when unused; keeps showChildren for front-page-* when shown.
 */
export function buildHomepageFallbackNavItems(
	findBySlug: (slug: string) => TemplateLike | undefined,
	site?: SiteReadingSettings | null
): TemplatesNavItemConfig[] {
	const activeSlug = getSiteRootActiveSlug(findBySlug, site);

	return HOMEPAGE_LAYER_SLUGS.flatMap((slug) => {
		const exists = !!findBySlug(slug);
		const status = getHomepageLayerStatus(slug, activeSlug, exists, site);

		// Front Page / Blog Home — hide when not in use for the site root.
		if ((slug === 'front-page' || slug === 'home') && status === 'unused') {
			return [];
		}

		return [
			{
				id: `homepage-fallback:${slug}`,
				label: LAYER_LABEL[slug](),
				icon: LAYER_ICON[slug],
				filter: LAYER_FILTER[slug],
				baseSlug: slug,
				showChildren: slug === 'front-page',
				status,
				statusLabel: getHomepageStatusLabel(status),
				statusTooltip: getHomepageStatusTooltip(status, slug),
			},
		];
	});
}
