/**
 * Homepage purpose-nav React tooltip + nav-item builders.
 */

import type { ReactNode } from 'react';
import { createElement, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import {
	FILTER_IDS,
	getParentFilterFromChildrenFilter,
	isChildrenFilter,
	type FilterId,
} from './filter-ids';
import type { TemplateLike } from './template-display';
import type { TemplatesNavItemConfig } from './templates-nav-config';
import {
	BLOG_POSTS_FILTER,
	BLOG_POSTS_NAV_ID,
	HOMEPAGE_LAYER_SLUGS,
	HOMEPAGE_NAV_ID,
	LAYER_FILTER,
	buildPageItemPath,
	getFilterIdForHomepageSlug,
	getHomepageLayerStatus,
	getHomepageStatusLabel,
	getSiteRootActiveSlug,
	getStaticPageStatusLabel,
	isStaticFrontPage,
	normalizePageId,
	shouldShowBlogPostsRow,
	type HomepageLayerSlug,
	type HomepageLayerStatus,
	type SiteReadingSettings,
} from './templates-homepage-status';

const LAYER_LABEL: Record<HomepageLayerSlug, () => string> = {
	'front-page': () => __('Front Page', 'blockera'),
	home: () => __('Blog Home', 'blockera'),
	index: () => __('Index', 'blockera'),
};

const LAYER_ICON: Record<HomepageLayerSlug, TemplatesNavItemConfig['icon']> = {
	'front-page': { library: 'wp', icon: 'home' },
	home: { library: 'ui', icon: 'home-blog' },
	index: { library: 'ui', icon: 'home-base' },
};

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
		icon: { library: 'wp', icon: 'home' },
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
			icon: { library: 'ui', icon: 'home-blog' },
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
 * - Front Page / Blog Home omitted when unused.
 * - Active site-root winner omitted (already represented by Homepage).
 * - All other available layers are shown.
 */
export function buildHomepageFallbackNavItems(
	findBySlug: (slug: string) => TemplateLike | undefined,
	site?: SiteReadingSettings | null
): TemplatesNavItemConfig[] {
	const activeSlug = getSiteRootActiveSlug(findBySlug, site);

	return HOMEPAGE_LAYER_SLUGS.flatMap((slug) => {
		const exists = !!findBySlug(slug);
		const status = getHomepageLayerStatus(slug, activeSlug, exists, site);

		// Unused Front Page / Blog Home — not available for the site root.
		if ((slug === 'front-page' || slug === 'home') && status === 'unused') {
			return [];
		}

		// Active winner is Homepage itself — don't duplicate under it.
		if (status === 'active') {
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
