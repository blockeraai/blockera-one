/**
 * Single catalog for Site Editor main-panel navigation.
 *
 * One entry per item drives:
 * - MainNavigation rendering (categories + rows),
 * - custom settings-route registration (identity / homepage / performance),
 * - active-key matching (`getActiveMainNavKeyFromConfig`).
 *
 * Adding a new settings panel = one entry here (label, icon, path, panel).
 */

import type { ComponentType } from 'react';

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { NavItemIcon } from '../components/nav-item';
import {
	CORE_NAV_UIDS,
	RESOURCE_LINKS,
	ROUTES,
	type MainNavKey,
} from '../constants';
import HomepageSettingsPanel from '../panels/homepage-settings-panel';
import PerformancePanel from '../panels/performance-panel';
import SiteIdentityPanel from '../panels/site-identity-panel';

export type MainNavCategory = 'design' | 'site' | 'features' | 'resources';

export type MainNavItemConfig = {
	key: string;
	label: string;
	icon: NavItemIcon;
	category: MainNavCategory;
	/** Click strategy: hidden core uid click, custom `p` path, external link. */
	navigate: 'coreUid' | 'path' | 'external';
	/**
	 * Site Editor `p` path. Used for `path` navigation, active-key matching,
	 * and settings-route registration.
	 */
	path?: string;
	/** Extra `p` prefixes that keep the item highlighted (core entity routes). */
	activePathPrefixes?: string[];
	/** Core SidebarNavigationItem uid key (navigate: 'coreUid'). */
	coreUid?: keyof typeof CORE_NAV_UIDS;
	/** Play the forward enter animation on the destination screen. */
	forwardDirection?: boolean;
	/** External URL (navigate: 'external'). */
	href?: string;
	/** Custom settings route: drill-down panel registered under key + path. */
	settingsPanel?: ComponentType;
};

export const MAIN_NAV_CATEGORIES: Array<{
	id: MainNavCategory;
	label: string;
}> = [
	{ id: 'design', label: __('Design', 'blockera') },
	{ id: 'site', label: __('Site', 'blockera') },
	{ id: 'features', label: __('Features', 'blockera') },
	{ id: 'resources', label: __('Resources', 'blockera') },
];

export const MAIN_NAV_ITEMS: MainNavItemConfig[] = [
	// Design — SPA navigation through hidden core nav item uids.
	{
		category: 'design',
		key: 'styles',
		label: __('Styles', 'blockera'),
		icon: { library: 'wp', icon: 'styles' },
		navigate: 'coreUid',
		coreUid: 'styles',
		path: ROUTES.styles,
		forwardDirection: true,
	},
	{
		category: 'design',
		key: 'navigation',
		label: __('Navigation', 'blockera'),
		icon: { library: 'wp', icon: 'navigation' },
		navigate: 'coreUid',
		coreUid: 'navigation',
		path: ROUTES.navigation,
		activePathPrefixes: ['/wp_navigation/'],
	},
	{
		category: 'design',
		key: 'pages',
		label: __('Pages', 'blockera'),
		icon: { library: 'wp', icon: 'page' },
		navigate: 'coreUid',
		coreUid: 'pages',
		path: ROUTES.pages,
	},
	{
		category: 'design',
		key: 'templates',
		label: __('Template Builder', 'blockera'),
		icon: { library: 'ui', icon: 'template' },
		navigate: 'coreUid',
		coreUid: 'templates',
		path: ROUTES.templates,
		forwardDirection: true,
		activePathPrefixes: ['/wp_template/', '/wp_template_part/'],
	},
	{
		category: 'design',
		key: 'patterns',
		label: __('Patterns', 'blockera'),
		icon: { library: 'wp', icon: 'symbol' },
		navigate: 'coreUid',
		coreUid: 'patterns',
		path: ROUTES.patterns,
		activePathPrefixes: ['/wp_block/'],
	},

	// Site — custom drill-down routes navigated via the `p` query
	// (core may not expose a uid/route for these).
	{
		category: 'site',
		key: 'identity',
		label: __('Site Identity', 'blockera'),
		icon: { library: 'wp', icon: 'site-logo' },
		navigate: 'path',
		path: ROUTES.identity,
		settingsPanel: SiteIdentityPanel,
	},
	{
		category: 'site',
		key: 'homepage',
		label: __('Homepage Settings', 'blockera'),
		icon: { library: 'wp', icon: 'home' },
		navigate: 'path',
		path: ROUTES.homepage,
		settingsPanel: HomepageSettingsPanel,
	},

	// Features
	{
		category: 'features',
		key: 'performance',
		label: __('Performance', 'blockera'),
		icon: { library: 'ui', icon: 'zap-fast-flat' },
		navigate: 'path',
		path: ROUTES.performance,
		settingsPanel: PerformancePanel,
	},

	// Resources — external links.
	{
		category: 'resources',
		key: 'community',
		label: __('Community', 'blockera'),
		icon: { library: 'ui', icon: 'community-conversation' },
		navigate: 'external',
		href: RESOURCE_LINKS.community,
	},
	{
		category: 'resources',
		key: 'roadmap',
		label: __('Roadmap', 'blockera'),
		icon: { library: 'ui', icon: 'changelog' },
		navigate: 'external',
		href: RESOURCE_LINKS.roadmap,
	},
	{
		category: 'resources',
		key: 'feature-requests',
		label: __('Feature Requests', 'blockera'),
		// "bolb" is the actual id of the bulb icon in @blockera/icons.
		icon: { library: 'ui', icon: 'bolb' },
		navigate: 'external',
		href: RESOURCE_LINKS.featureRequests,
	},
];

export function getMainNavItemsByCategory(
	category: MainNavCategory
): MainNavItemConfig[] {
	return MAIN_NAV_ITEMS.filter((item) => item.category === category);
}

/** Custom settings routes derived from the catalog. */
export function getSettingsRouteItems(): Array<
	MainNavItemConfig & { path: string; settingsPanel: ComponentType }
> {
	return MAIN_NAV_ITEMS.filter(
		(
			item
		): item is MainNavItemConfig & {
			path: string;
			settingsPanel: ComponentType;
		} => !!item.settingsPanel && !!item.path
	);
}

/**
 * Map a normalized Site Editor `p` path to the highlighted main-nav key.
 * Matches the item path (exact or as `path/` prefix) plus any extra
 * core-entity prefixes declared in the catalog.
 */
export function getActiveMainNavKeyFromConfig(
	normalizedPath: string
): MainNavKey | null {
	for (const item of MAIN_NAV_ITEMS) {
		if (
			item.path &&
			(normalizedPath === item.path ||
				normalizedPath.startsWith(`${item.path}/`))
		) {
			return item.key as MainNavKey;
		}
		if (
			item.activePathPrefixes?.some((prefix) =>
				normalizedPath.startsWith(prefix)
			)
		) {
			return item.key as MainNavKey;
		}
	}
	return null;
}
