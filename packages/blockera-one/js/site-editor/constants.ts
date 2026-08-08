/**
 * Site Editor main panel — paths, core nav uids, selectors, and resource URLs.
 */

export const EDIT_SITE_STORE_NAME = 'core/edit-site';

export const BODY_CLASS = 'has-blockera-site-editor-main-panel';

/** Toggled while Design-root routes are active (home only). */
export const DESIGN_ROOT_BODY_CLASS = 'has-blockera-site-editor-design-root';

export const COMPONENT_SELECTOR = '.blockera-site-editor-main-navigation';

/** Hidden core Design ItemGroup (still in DOM for uid clicks). */
export const CORE_NAV_ITEM_GROUP_SELECTOR =
	'.edit-site-sidebar-navigation-screen-main';

/**
 * Stable portal host — parent of core's `key={routeKey}` screen wrapper.
 * Survives Design-root route changes so MainNavigation does not remount/flash.
 */
export const STABLE_SIDEBAR_CONTENT_SELECTOR = '.edit-site-sidebar__content';

/** Parent of core SiteHub — stable while Site Editor sidebar is in view mode. */
export const STABLE_SIDEBAR_SELECTOR = '.edit-site-layout__sidebar';

/** Mount node we insert as first child of the sidebar for the Blockera site hub. */
export const SITE_HUB_MOUNT_CLASS = 'blockera-site-editor-site-hub-mount';

/** Core Design sidebar item ids (SidebarNavigationItem `uid`). */
export const CORE_NAV_UIDS = {
	styles: 'global-styles-navigation-item',
	pages: 'page-navigation-item',
	navigation: 'navigation-navigation-item',
	patterns: 'patterns-navigation-item',
	templates: 'template-navigation-item',
	identity: 'identity-navigation-item',
} as const;

export const ROUTES = {
	home: '/',
	styles: '/styles',
	navigation: '/navigation',
	pages: '/page',
	templates: '/template',
	patterns: '/pattern',
	identity: '/identity',
	homepage: '/homepage',
	performance: '/performance',
} as const;

/** Site entity / REST setting: disable WP emoji scripts (default enabled when missing). */
export const DISABLE_EMOJIS_SETTING = 'blockera_one_disable_emojis';

export type DesignNavKey =
	'styles' | 'navigation' | 'pages' | 'templates' | 'patterns';

export type SiteNavKey = 'identity' | 'homepage';

export type FeaturesNavKey = 'performance';

export type MainNavKey = DesignNavKey | SiteNavKey | FeaturesNavKey;

/**
 * Resource links — same destinations as blockera-admin dashboard,
 * with site-editor UTM params.
 */
export const RESOURCE_LINKS = {
	community:
		'https://community.blockera.ai/?utm_source=blockera-one-site-editor&utm_medium=referral&utm_campaign=community-page&utm_content=cta-link',
	roadmap:
		'https://community.blockera.ai/roadmap?utm_source=blockera-one-site-editor&utm_medium=referral&utm_campaign=roadmap-page&utm_content=cta-link',
	featureRequests:
		'https://community.blockera.ai/feature-request-1rsjg2ck?utm_source=blockera-one-site-editor&utm_medium=referral&utm_campaign=feature-request-page&utm_content=cta-link',
} as const;
