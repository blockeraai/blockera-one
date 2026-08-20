/**
 * Site Editor main panel plugin.
 * Hides core Design ItemGroup; portals Blockera branding / nav chrome.
 */

import type { ReactNode } from 'react';

import { createPortal, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	BODY_CLASS,
	DESIGN_ROOT_BODY_CLASS,
	MAIN_PANEL_HEADER_MOUNT_CLASS,
	STABLE_SIDEBAR_CONTENT_SELECTOR,
	STABLE_SIDEBAR_SELECTOR,
} from './constants';
import usePortalHost from './hooks/use-portal-host';
import MainNavigation from './main-navigation';
import MainPanelHeader from './main-panel-header';
import SiteEditorMainPanelRoutes from './routes';
import { getSiteEditorPath, isDesignRootPath, isSiteEditorUrl } from './utils';
import './admin-ui-card.scss';
import './style.scss';

/**
 * Ensure a mount node exists at the top of the view-mode sidebar (before
 * `.edit-site-sidebar__content`). Gutenberg 7.1+ no longer renders desktop
 * SiteHub here (mobile-only); if a legacy `.edit-site-site-hub` sibling exists,
 * keep the mount after it. React may drop unknown siblings on reconcile —
 * caller re-runs via observer.
 */
function ensureMainPanelHeaderMount(sidebar: Element): Element {
	const existing = sidebar.querySelector(
		`:scope > .${MAIN_PANEL_HEADER_MOUNT_CLASS}`
	);
	const hub = sidebar.querySelector(':scope > .edit-site-site-hub');
	const content = sidebar.querySelector(
		':scope > .edit-site-sidebar__content'
	);

	const placeMount = (mount: Element) => {
		if (hub) {
			if (mount.previousElementSibling !== hub) {
				hub.after(mount);
			}
			return;
		}

		if (content) {
			if (mount.nextElementSibling !== content) {
				sidebar.insertBefore(mount, content);
			}
			return;
		}

		if (sidebar.firstElementChild !== mount) {
			sidebar.insertBefore(mount, sidebar.firstChild);
		}
	};

	if (existing) {
		placeMount(existing);
		return existing;
	}

	const mount = document.createElement('div');
	mount.className = MAIN_PANEL_HEADER_MOUNT_CLASS;
	placeMount(mount);
	return mount;
}

/**
 * Portal MainPanelHeader into `.edit-site-layout__sidebar` whenever the
 * sidebar is present (all Site Editor view-mode pages).
 */
function MainPanelHeaderInjector(): ReactNode {
	const host = usePortalHost(
		useCallback(() => {
			const sidebar = document.querySelector(STABLE_SIDEBAR_SELECTOR);
			if (!sidebar) {
				return null;
			}
			return ensureMainPanelHeaderMount(sidebar);
		}, []),
		() => {
			document
				.querySelectorAll(`.${MAIN_PANEL_HEADER_MOUNT_CLASS}`)
				.forEach((node) => node.remove());
		}
	);

	if (!host) {
		return null;
	}

	return createPortal(<MainPanelHeader />, host);
}

/**
 * Portal MainNavigation into `.edit-site-sidebar__content` on Design-root
 * routes only.
 */
function SiteEditorMainPanelNavigationInjector(): ReactNode {
	const host = usePortalHost(
		useCallback(() => {
			const designRoot = isDesignRootPath(getSiteEditorPath());
			document.body?.classList?.toggle(
				DESIGN_ROOT_BODY_CLASS,
				designRoot
			);
			if (!designRoot) {
				return null;
			}
			return document.querySelector(STABLE_SIDEBAR_CONTENT_SELECTOR);
		}, [])
	);

	if (!host) {
		return null;
	}

	return createPortal(<MainNavigation />, host);
}

/**
 * Root plugin render for Site Editor main panel customization.
 */
export default function SiteEditorMainPanel(): ReactNode {
	useEffect(() => {
		if (!isSiteEditorUrl()) {
			return;
		}

		document.body?.classList?.add(BODY_CLASS);

		return () => {
			document.body?.classList?.remove(BODY_CLASS);
			document.body?.classList?.remove(DESIGN_ROOT_BODY_CLASS);
		};
	}, []);

	if (!isSiteEditorUrl()) {
		return null;
	}

	return (
		<>
			<SiteEditorMainPanelRoutes />
			<MainPanelHeaderInjector />
			<SiteEditorMainPanelNavigationInjector />
		</>
	);
}
