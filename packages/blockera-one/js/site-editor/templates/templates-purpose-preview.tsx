/**
 * Keep purpose-nav selection (and Templates Builder nested stack) when leaving
 * canvas edit on a wp_template preview.
 *
 * Core “Open Navigation” on template-item routes to `/template` (All templates)
 * via getNavigationPath — dropping `boFilter` / `boBuilder`. Intercept while a
 * purpose filter is active and return to the same template preview instead.
 *
 * Mounted around the resolved Editor (see wrapTemplateItemPurposePreview) so the
 * click listener stays alive in full-canvas edit when the sidebar is unmounted.
 */

import type { ReactNode } from 'react';

import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	FILTER_IDS,
	getTemplatesUrlState,
	navigateTemplates,
} from './constants';
import { stopContentOnlySectionEdit } from '../templates-builder';
import useOpenNavigationInterceptor from './use-open-navigation-interceptor';

type TemplatesPurposePreviewProps = {
	children?: ReactNode;
};

export default function TemplatesPurposePreview({
	children,
}: TemplatesPurposePreviewProps) {
	useOpenNavigationInterceptor((path) => {
		const { filter, optionsPanel } = getTemplatesUrlState();
		const canvas = getQueryArg(window.location.href, 'canvas');

		if (
			canvas !== 'edit' ||
			!path.startsWith('/wp_template/') ||
			!filter ||
			filter === FILTER_IDS.all
		) {
			return false;
		}

		stopContentOnlySectionEdit();
		navigateTemplates(path, {
			filter,
			optionsPanel,
			partsArea: null,
			activeView: null,
			canvas: null,
		});
		return true;
	});

	return <>{children}</>;
}
