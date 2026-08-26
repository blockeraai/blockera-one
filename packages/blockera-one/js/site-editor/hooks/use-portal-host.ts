/**
 * Resolve a portal host element inside the (React-owned) Site Editor DOM and
 * keep it in sync across reconciles (MutationObserver) and SPA navigations.
 *
 * `resolveHost` must be referentially stable (useCallback in the caller); it
 * may perform per-sync side effects (e.g. body-class toggles, mount-node
 * creation) before returning the host.
 */

import { useEffect, useRef, useState } from '@wordpress/element';

import { isSiteEditorUrl, useSiteEditorNavigate } from '../utils';

export default function usePortalHost(
	resolveHost: () => Element | null,
	onCleanup?: () => void
): Element | null {
	const [host, setHost] = useState<Element | null>(null);

	// Keep the latest cleanup without re-subscribing the observer.
	const cleanupRef = useRef(onCleanup);
	cleanupRef.current = onCleanup;

	const syncRef = useRef(() => {});
	syncRef.current = () => setHost(resolveHost());

	useEffect(() => {
		if (!isSiteEditorUrl()) {
			return;
		}

		syncRef.current();

		const observer = new MutationObserver(() => syncRef.current());
		observer.observe(document.body, { childList: true, subtree: true });

		return () => {
			observer.disconnect();
			cleanupRef.current?.();
		};
	}, []);

	useSiteEditorNavigate(() => syncRef.current());

	return host;
}
