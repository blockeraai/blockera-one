/**
 * Homepage purpose-nav resolution (barrel): status/slug helpers + nav builders.
 */

export {
	HOMEPAGE_LAYER_SLUGS,
	HOMEPAGE_NAV_ID,
	BLOG_POSTS_NAV_ID,
	BLOG_POSTS_FILTER,
	getStaticPageStatusLabel,
	isTemplatesOwnedPagePreview,
	getFilterIdForHomepageSlug,
	isStaticFrontPage,
	buildPageItemPath,
	getSiteRootActiveSlug,
	getHomepageLayerStatus,
	getHomepageStatusLabel,
	shouldShowBlogPostsRow,
	type HomepageLayerSlug,
	type HomepageLayerStatus,
	type SiteReadingSettings,
} from './templates-homepage-status';
export {
	getHomepageStatusTooltip,
	buildHomepageSectionItems,
	isHomepageBranchFilter,
	buildHomepageFallbackNavItems,
} from './templates-homepage-nav';
