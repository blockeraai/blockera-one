/**
 * Strip stale core sidebar slide classes on mount (and once more on the next
 * frame, after core's layout effect may have re-applied them).
 * Shared by MainNavigation and DrillDownScreen — Blockera animates its own
 * screens via useSidebarEnterClass instead of core SidebarNavigationContext.
 */

import { useEffect } from '@wordpress/element';

import { clearCoreSidebarSlideClasses } from '../utils';

export default function useClearCoreSidebarSlide(): void {
	useEffect(() => {
		clearCoreSidebarSlideClasses();
		const id = window.requestAnimationFrame(() => {
			clearCoreSidebarSlideClasses();
		});
		return () => window.cancelAnimationFrame(id);
	}, []);
}
