/**
 * Preserve Templates purpose-nav scroll across core sidebar remounts.
 *
 * Core `SidebarContent` uses `key={routeKey}`, so `templates` → `template-item`
 * remounts DrillDownScreen. Scroll lives on `.blockera-site-editor-drill-down__content`.
 */

const DRILL_DOWN_CONTENT_SELECTOR = '.blockera-site-editor-drill-down__content';

let savedScrollTop: number | null = null;

function getDrillDownScroller(root?: ParentNode | null): HTMLElement | null {
	const scope = root ?? document;
	const el = scope.querySelector(DRILL_DOWN_CONTENT_SELECTOR);
	return el instanceof HTMLElement ? el : null;
}

/** Call before SPA navigations that may remount the Templates drill-down. */
export function rememberTemplatesSidebarScroll(): void {
	if (typeof document === 'undefined') {
		return;
	}
	const scroller = getDrillDownScroller();
	if (scroller) {
		savedScrollTop = scroller.scrollTop;
	}
}

/** Restore after TemplatesDrillDown mounts (useLayoutEffect). */
export function restoreTemplatesSidebarScroll(root?: ParentNode | null): void {
	const scroller = getDrillDownScroller(root);
	if (scroller && savedScrollTop !== null) {
		scroller.scrollTop = savedScrollTop;
	}
}
