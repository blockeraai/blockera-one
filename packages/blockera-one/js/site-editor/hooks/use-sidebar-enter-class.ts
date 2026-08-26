/**
 * Consume pending sidebar enter direction once on mount.
 * Shared by DrillDownScreen and MainNavigation (Design root).
 */

import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { consumePendingSidebarNavDirection } from '../utils';
// Enter-animation chrome ships with the hook so consumers don't import it.
import './sidebar-enter.scss';

/**
 * CSS class for the enter slide (`is-entering-forward` | `is-entering-back` | '').
 */
export default function useSidebarEnterClass(): string {
	const [enterClass] = useState(() => {
		const direction = consumePendingSidebarNavDirection();
		// Only animate when an explicit forward/back nav was requested.
		// Remounts from `p` changes leave direction null — treating null as
		// forward caused spurious slides.
		if (direction === 'forward') {
			return 'is-entering-forward';
		}
		if (direction === 'back') {
			return 'is-entering-back';
		}
		return '';
	});
	return enterClass;
}
