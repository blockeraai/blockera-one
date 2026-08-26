/**
 * Helpers for Site Editor main panel navigation.
 *
 * Generic SPA history / path / DOM helpers live in `@blockera/utils`.
 * This module keeps Blockera One IA (nav catalog, core uids) and wraps
 * path navigation with sidebar enter-direction.
 */

/**
 * Blockera dependencies
 */
import {
	clickCoreNavItem,
	clearCoreSidebarSlideClasses,
	ensureSiteEditorHistoryPatch,
	getSiteEditorPath,
	isSiteEditorRootPath,
	isSiteEditorUrl,
	navigateToSiteEditorPath as pushSiteEditorPath,
	pushSiteEditorHistory,
	SITE_EDITOR_NAVIGATE_EVENT,
	useSiteEditorNavigate,
} from '@blockera/utils';

/**
 * Internal dependencies
 */
import { CORE_NAV_UIDS, type MainNavKey } from './constants';
import {
	setPendingSidebarNavDirection,
	type SidebarNavDirection,
} from './navigation/history';
import { getActiveMainNavKeyFromConfig } from './navigation/nav-config';

export {
	clickCoreNavItem,
	clearCoreSidebarSlideClasses,
	ensureSiteEditorHistoryPatch,
	getSiteEditorPath,
	isSiteEditorUrl,
	pushSiteEditorHistory,
	SITE_EDITOR_NAVIGATE_EVENT,
	useSiteEditorNavigate,
};

/** Design-root chrome: Site Editor `p` is `/`. */
export const isDesignRootPath = isSiteEditorRootPath;

export {
	setPendingSidebarNavDirection,
	consumePendingSidebarNavDirection,
	type SidebarNavDirection,
} from './navigation/history';

/**
 * Map the current `p` path to a highlighted main-nav key
 * (derived from the navigation catalog).
 */
export function getActiveMainNavKey(
	path: string = getSiteEditorPath()
): MainNavKey | null {
	const normalized = path.split('?')[0] || '/';

	return getActiveMainNavKeyFromConfig(normalized);
}

export function navigateViaCoreUid(key: keyof typeof CORE_NAV_UIDS): void {
	clickCoreNavItem(CORE_NAV_UIDS[key]);
}

/**
 * Navigate to a custom Site Editor path (e.g. `/identity`, `/homepage`).
 *
 * @param path     Site Editor `p` path.
 * @param options.direction  Pending enter animation for the destination screen
 *                           (`forward` / `back`). Mirrors core
 *                           `SidebarNavigationContext.navigate()` — we cannot
 *                           call that context without edit-site unlock.
 */
export function navigateToSiteEditorPath(
	path: string,
	options?: { direction?: SidebarNavDirection }
): void {
	if (options?.direction) {
		setPendingSidebarNavDirection(options.direction);
	}
	pushSiteEditorPath(path);
}
