/**
 * Intercept core “Open Navigation” clicks (view-mode toggle) in capture phase.
 *
 * Core routes those clicks through getNavigationPath, which drops Blockera's
 * `blockera-builder` context. Consumers pass a handler that decides — per
 * current Site Editor `p` path — whether to take over navigation; when it
 * returns true the original click is fully suppressed.
 *
 * Shared by TemplatesPurposePreview (wp_template purpose filters) and
 * TemplatesAreaHub (wp_template_part hubs).
 */

import { useEffect, useRef } from '@wordpress/element';

import { getSiteEditorPath } from '../utils';

export function isOpenNavigationControl(target: Element): boolean {
	return !!target.closest(
		'button[aria-label="Open Navigation"], .edit-site-editor__view-mode-toggle, .edit-site-editor__view-mode-toggle-icon, .edit-site-layout__view-mode-toggle'
	);
}

/**
 * @param handler Return true after handling navigation to suppress the click.
 * @param enabled Detach the listener entirely when false.
 */
export default function useOpenNavigationInterceptor(
	handler: (path: string) => boolean,
	enabled: boolean = true
): void {
	// Latest handler without re-subscribing the document listener.
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const onClick = (event: MouseEvent) => {
			const target = event.target as Element | null;
			if (!target?.closest || !isOpenNavigationControl(target)) {
				return;
			}
			if (!handlerRef.current(getSiteEditorPath())) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
		};

		document.addEventListener('click', onClick, true);
		return () => document.removeEventListener('click', onClick, true);
	}, [enabled]);
}
