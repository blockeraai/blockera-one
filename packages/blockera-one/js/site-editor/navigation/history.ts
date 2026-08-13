/**
 * Sidebar enter-animation direction for Site Editor drill-down screens.
 *
 * SPA URL writes live in `@blockera/utils` (`pushSiteEditorHistory`). Set
 * direction here, then push — the destination screen consumes it on mount.
 *
 * Mirrors core `SidebarNavigationContext.navigate('forward' | 'back')`
 * without unlocking `@wordpress/edit-site`.
 */

/** Direction for Blockera sidebar enter animations (matches core slide classes). */
export type SidebarNavDirection = 'forward' | 'back';

let pendingSidebarNavDirection: SidebarNavDirection | null = null;

/**
 * Survive a remount / double useState init shortly after consuming a direction
 * (core routeKey remount or React Strict Mode). Without this, the destination
 * mounts with the enter class then remounts empty and the animation is lost.
 */
let lastConsumedDirection: SidebarNavDirection | null = null;
let lastConsumedAt = 0;
const DIRECTION_STICKY_MS = 150;

/**
 * Record the next sidebar screen enter animation.
 * Consumed once by the destination screen on mount.
 */
export function setPendingSidebarNavDirection(
	direction: SidebarNavDirection | null
): void {
	pendingSidebarNavDirection = direction;
	if (direction === null) {
		lastConsumedDirection = null;
		lastConsumedAt = 0;
	}
}

/**
 * Read and clear the pending sidebar enter animation direction.
 */
export function consumePendingSidebarNavDirection(): SidebarNavDirection | null {
	const direction = pendingSidebarNavDirection;
	pendingSidebarNavDirection = null;
	if (direction === 'forward' || direction === 'back') {
		lastConsumedDirection = direction;
		lastConsumedAt = Date.now();
		return direction;
	}
	if (
		lastConsumedDirection &&
		Date.now() - lastConsumedAt < DIRECTION_STICKY_MS
	) {
		return lastConsumedDirection;
	}
	return null;
}
