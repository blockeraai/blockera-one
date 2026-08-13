/**
 * Parse / serialize slash-separated panel stack query values.
 */

import { getQueryArg } from '@wordpress/url';

/**
 * Blockera dependencies
 */
import { pushSiteEditorHistory } from '@blockera/utils';

/**
 * Internal dependencies
 */
import {
	setPendingSidebarNavDirection,
	type SidebarNavDirection,
} from '../navigation/history';

/**
 * Read a slash stack from a URL query key (e.g. `sidebar` or `sidebar/widgets`).
 */
export function readPanelStack(
	queryKey: string,
	href: string = typeof window !== 'undefined' ? window.location.href : ''
): string[] {
	const raw = getQueryArg(href, queryKey);
	if (typeof raw !== 'string' || !raw.length) {
		return [];
	}
	return raw
		.split('/')
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * Serialize a stack to a slash path (empty → undefined for scrubbing).
 */
export function serializePanelStack(stack: string[]): string | undefined {
	if (!stack.length) {
		return undefined;
	}
	return stack.join('/');
}

/**
 * Write a query key on the current Site Editor URL via the shared SPA
 * history writer. Scrubs empty / `undefined` values for the given key.
 */
export function pushPanelStackQuery(
	queryKey: string,
	stack: string[],
	options?: { direction?: SidebarNavDirection }
): void {
	if (options?.direction) {
		setPendingSidebarNavDirection(options.direction);
	}
	pushSiteEditorHistory(
		{ [queryKey]: serializePanelStack(stack) },
		{ scrubKeys: [queryKey] }
	);
}
