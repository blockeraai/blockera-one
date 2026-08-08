/**
 * Helpers for Site Editor main panel navigation.
 */

import { useEffect } from '@wordpress/element';
import { addQueryArgs, getQueryArg } from '@wordpress/url';

/**
 * Blockera dependencies
 */
import { isSiteEditorUrl } from '@blockera/utils';

/**
 * Internal dependencies
 */
import { CORE_NAV_UIDS, ROUTES, type MainNavKey } from './constants';

export { isSiteEditorUrl };

/** Fired after SPA history changes (patched push/replace + popstate). */
export const SITE_EDITOR_NAVIGATE_EVENT = 'blockera-site-editor-navigate';

let historyPatched = false;
let originalPushState: typeof window.history.pushState | null = null;
let originalReplaceState: typeof window.history.replaceState | null = null;

/**
 * Patch history once; notify listeners on SPA navigations (incl. core router).
 */
export function ensureSiteEditorHistoryPatch(): () => void {
	if (typeof window === 'undefined') {
		return () => {};
	}

	const emit = () => {
		window.dispatchEvent(new CustomEvent(SITE_EDITOR_NAVIGATE_EVENT));
	};

	if (!historyPatched) {
		originalPushState = window.history.pushState;
		originalReplaceState = window.history.replaceState;

		window.history.pushState = function (...args) {
			const result = originalPushState!.apply(this, args);
			emit();
			return result;
		};
		window.history.replaceState = function (...args) {
			const result = originalReplaceState!.apply(this, args);
			emit();
			return result;
		};

		historyPatched = true;
	}

	window.addEventListener('popstate', emit);

	return () => {
		window.removeEventListener('popstate', emit);
	};
}

/**
 * Subscribe to Site Editor URL changes (core router + Blockera SPA navigate).
 */
export function useSiteEditorNavigate(listener: () => void): void {
	useEffect(() => {
		if (!isSiteEditorUrl()) {
			return;
		}

		const removePop = ensureSiteEditorHistoryPatch();
		const onNavigate = () => listener();
		window.addEventListener(SITE_EDITOR_NAVIGATE_EVENT, onNavigate);
		onNavigate();

		return () => {
			window.removeEventListener(SITE_EDITOR_NAVIGATE_EVENT, onNavigate);
			removePop();
		};
	}, [listener]);
}

/**
 * Dashboard URL for the site-hub logo (back to wp-admin).
 * Prefer the core site-hub / view-mode-toggle href when present.
 */
export function getWpAdminDashboardUrl(): string {
	if (typeof window === 'undefined') {
		return '/wp-admin/';
	}

	// Prefer core hub (hidden but still in DOM) — our hub uses only blockera classes.
	const fromToggle = document
		.querySelector<HTMLAnchorElement>(
			'.edit-site-layout__sidebar > .edit-site-site-hub .edit-site-layout__view-mode-toggle, .edit-site-editor__view-mode-toggle a, .edit-site-editor__view-mode-toggle button[href]'
		)
		?.getAttribute('href');

	if (fromToggle) {
		return fromToggle;
	}

	try {
		const { origin, pathname } = window.location;
		const match = pathname.match(/^(.*\/wp-admin\/)/);
		if (match?.[1]) {
			return `${origin}${match[1]}`;
		}
	} catch (_e) {
		// fall through
	}

	return '/wp-admin/';
}

/**
 * Current Site Editor router path from the `p` query arg (e.g. `/styles`).
 */
export function getSiteEditorPath(): string {
	if (typeof window === 'undefined') {
		return ROUTES.home;
	}

	const p = getQueryArg(window.location.href, 'p');
	if (typeof p === 'string' && p.length > 0) {
		return p.split('?')[0] || ROUTES.home;
	}

	return ROUTES.home;
}

/**
 * Routes that keep the Design list chrome (vs drill-down Styles / Pages / …).
 * Styles / Identity / Homepage / Performance collapse the main nav like Templates.
 */
export function isDesignRootPath(path: string = getSiteEditorPath()): boolean {
	const normalized = path.split('?')[0] || ROUTES.home;

	return normalized === ROUTES.home;
}

/**
 * Map the current `p` path to a highlighted main-nav key.
 */
export function getActiveMainNavKey(
	path: string = getSiteEditorPath()
): MainNavKey | null {
	const normalized = path.split('?')[0] || ROUTES.home;

	if (
		normalized === ROUTES.styles ||
		normalized.startsWith(`${ROUTES.styles}/`)
	) {
		return 'styles';
	}

	if (
		normalized === ROUTES.identity ||
		normalized.startsWith(`${ROUTES.identity}/`)
	) {
		return 'identity';
	}

	if (
		normalized === ROUTES.homepage ||
		normalized.startsWith(`${ROUTES.homepage}/`)
	) {
		return 'homepage';
	}

	if (
		normalized === ROUTES.performance ||
		normalized.startsWith(`${ROUTES.performance}/`)
	) {
		return 'performance';
	}

	if (
		normalized === ROUTES.pages ||
		normalized.startsWith(`${ROUTES.pages}/`)
	) {
		return 'pages';
	}

	if (
		normalized === ROUTES.navigation ||
		normalized.startsWith(`${ROUTES.navigation}/`) ||
		normalized.startsWith('/wp_navigation/')
	) {
		return 'navigation';
	}

	if (
		normalized === ROUTES.patterns ||
		normalized.startsWith(`${ROUTES.patterns}/`) ||
		normalized.startsWith('/wp_block/')
	) {
		return 'patterns';
	}

	if (
		normalized === ROUTES.templates ||
		normalized.startsWith(`${ROUTES.templates}/`) ||
		normalized.startsWith('/wp_template/') ||
		normalized.startsWith('/wp_template_part/')
	) {
		return 'templates';
	}

	return null;
}

/**
 * Trigger SPA navigation by clicking the hidden core Design nav item.
 */
export function clickCoreNavItem(uid: string): void {
	const el = document.getElementById(uid);
	if (el instanceof HTMLElement) {
		el.click();
	}
}

export function navigateViaCoreUid(key: keyof typeof CORE_NAV_UIDS): void {
	clickCoreNavItem(CORE_NAV_UIDS[key]);
}

/**
 * Navigate to a custom Site Editor path (e.g. `/identity`, `/homepage`).
 *
 * Uses the same `p` query pattern as core. Avoids full reload by updating
 * the URL with pushState and dispatching `popstate` so the `history` package
 * instance inside `@wordpress/router` re-reads location and rematches routes
 * (when no navigation blockers are active).
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
	if (typeof window === 'undefined') {
		return;
	}

	if (options?.direction) {
		setPendingSidebarNavDirection(options.direction);
	}

	const absoluteUrl = addQueryArgs(window.location.href, { p: path });
	let nextUrl = absoluteUrl;

	try {
		const parsed = new URL(absoluteUrl);
		nextUrl = `${parsed.pathname}${parsed.search}${parsed.hash}`;
	} catch (_e) {
		// Keep absoluteUrl fallback.
	}

	const prevState =
		typeof window.history.state === 'object' && window.history.state
			? window.history.state
			: {};
	const nextIdx =
		typeof (prevState as { idx?: number }).idx === 'number'
			? (prevState as { idx: number }).idx + 1
			: 0;

	window.history.pushState(
		{
			...prevState,
			usr: (prevState as { usr?: unknown }).usr ?? null,
			key: Math.random().toString(36).slice(2, 10),
			idx: nextIdx,
		},
		'',
		nextUrl
	);
	window.dispatchEvent(new PopStateEvent('popstate'));
}

/** Direction for Blockera sidebar enter animations (matches core slide classes). */
export type SidebarNavDirection = 'forward' | 'back';

let pendingSidebarNavDirection: SidebarNavDirection | null = null;

/**
 * Record the next sidebar screen enter animation.
 * Consumed once by the destination screen on mount.
 */
export function setPendingSidebarNavDirection(
	direction: SidebarNavDirection | null
): void {
	pendingSidebarNavDirection = direction;
}

/**
 * Read and clear the pending sidebar enter animation direction.
 */
export function consumePendingSidebarNavDirection(): SidebarNavDirection | null {
	const direction = pendingSidebarNavDirection;
	pendingSidebarNavDirection = null;
	return direction;
}

/**
 * Strip core slide classes from the screen wrapper.
 *
 * Core `SidebarContentWrapper` may apply a stale
 * `SidebarNavigationContext` direction when `shouldAnimate` is true
 * (homepage / performance). We animate Blockera screens ourselves instead.
 */
export function clearCoreSidebarSlideClasses(): void {
	if (typeof document === 'undefined') {
		return;
	}

	const wrapper = document.querySelector(
		'.edit-site-layout__sidebar .edit-site-sidebar__screen-wrapper'
	);

	if (!(wrapper instanceof HTMLElement)) {
		return;
	}

	wrapper.classList.remove('slide-from-right', 'slide-from-left');
}
