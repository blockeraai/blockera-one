/**
 * Keep purpose-nav selection when leaving canvas edit on a wp_template preview.
 *
 * Core “Open Navigation” on template-item routes to `/template` (All templates)
 * via getNavigationPath — dropping `boFilter`. Intercept while a purpose filter
 * is active and return to the same template preview instead.
 *
 * Mounted around the resolved Editor (see wrapTemplateItemPurposePreview) so the
 * click listener stays alive in full-canvas edit when the sidebar is unmounted.
 */

import type { ReactNode } from 'react';

import { getQueryArg } from '@wordpress/url';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getSiteEditorPath } from '../utils';
import {
	FILTER_IDS,
	getTemplatesUrlState,
	navigateTemplates,
} from './constants';

type TemplatesPurposePreviewProps = {
	children?: ReactNode;
};

export function isOpenNavigationControl(target: Element): boolean {
	return !!target.closest(
		'button[aria-label="Open Navigation"], .edit-site-editor__view-mode-toggle, .edit-site-editor__view-mode-toggle-icon, .edit-site-layout__view-mode-toggle'
	);
}

export default function TemplatesPurposePreview({
	children,
}: TemplatesPurposePreviewProps) {
	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const target = event.target as Element | null;
			if (!target?.closest || !isOpenNavigationControl(target)) {
				return;
			}

			const path = getSiteEditorPath();
			const { filter } = getTemplatesUrlState();
			const canvas = getQueryArg(window.location.href, 'canvas');

			if (
				canvas !== 'edit' ||
				!path.startsWith('/wp_template/') ||
				!filter ||
				filter === FILTER_IDS.all
			) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			navigateTemplates(path, {
				filter,
				partsArea: null,
				activeView: null,
				canvas: null,
			});
		};

		document.addEventListener('click', onClick, true);
		return () => document.removeEventListener('click', onClick, true);
	}, []);

	return <>{children}</>;
}
