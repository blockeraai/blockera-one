/**
 * Site Editor main panel plugin.
 * Hides core Design ItemGroup + SiteHub; portals Blockera hub / nav chrome.
 */

import type { ReactNode } from 'react';

import {
	createPortal,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	BODY_CLASS,
	DESIGN_ROOT_BODY_CLASS,
	SITE_HUB_MOUNT_CLASS,
	STABLE_SIDEBAR_CONTENT_SELECTOR,
	STABLE_SIDEBAR_SELECTOR,
} from './constants';
import MainNavigation from './main-navigation';
import MainPanelHeader from './main-panel-header';
import SiteEditorMainPanelRoutes from './routes';
import SiteHub from './site-hub';
import {
	getSiteEditorPath,
	isDesignRootPath,
	isSiteEditorUrl,
	useSiteEditorNavigate,
} from './utils';
import './admin-ui-card.scss';
import './style.scss';

/**
 * Ensure a mount node exists as the first child of the Site Editor sidebar.
 * React may drop unknown siblings on reconcile — caller re-runs via observer.
 */
function ensureSiteHubMount(sidebar: Element): Element {
	const existing = sidebar.querySelector(`:scope > .${SITE_HUB_MOUNT_CLASS}`);
	if (existing) {
		if (sidebar.firstElementChild !== existing) {
			sidebar.insertBefore(existing, sidebar.firstChild);
		}
		return existing;
	}

	const mount = document.createElement('div');
	mount.className = SITE_HUB_MOUNT_CLASS;
	sidebar.insertBefore(mount, sidebar.firstChild);
	return mount;
}

/**
 * Portal SiteHub + MainPanelHeader into `.edit-site-layout__sidebar` whenever
 * the sidebar is present (all Site Editor view-mode pages). Components stay
 * separate; this injector only composes them. Core hub is CSS-hidden always.
 */
function SiteHubInjector(): ReactNode {
	const [host, setHost] = useState<Element | null>(null);

	const syncHost = useCallback(() => {
		const sidebar = document.querySelector(STABLE_SIDEBAR_SELECTOR);
		if (!sidebar) {
			setHost(null);
			return;
		}
		setHost(ensureSiteHubMount(sidebar));
	}, []);

	useEffect(() => {
		if (!isSiteEditorUrl()) {
			return;
		}

		syncHost();

		const observer = new MutationObserver(syncHost);
		observer.observe(document.body, { childList: true, subtree: true });

		return () => {
			observer.disconnect();
			document
				.querySelectorAll(`.${SITE_HUB_MOUNT_CLASS}`)
				.forEach((node) => node.remove());
		};
	}, [syncHost]);

	useSiteEditorNavigate(syncHost);

	if (!host) {
		return null;
	}

	return createPortal(
		<>
			<SiteHub />
			<MainPanelHeader />
		</>,
		host
	);
}

/**
 * Portal MainNavigation into `.edit-site-sidebar__content` on Design-root
 * routes only.
 */
function SiteEditorMainPanelNavigationInjector(): ReactNode {
	const [host, setHost] = useState<Element | null>(null);
	const [isDesignRoot, setIsDesignRoot] = useState(() => isDesignRootPath());

	const sync = useCallback(() => {
		const designRoot = isDesignRootPath(getSiteEditorPath());
		setIsDesignRoot(designRoot);
		document.body?.classList?.toggle(DESIGN_ROOT_BODY_CLASS, designRoot);
		setHost(document.querySelector(STABLE_SIDEBAR_CONTENT_SELECTOR));
	}, []);

	useEffect(() => {
		if (!isSiteEditorUrl()) {
			return;
		}

		sync();

		const observer = new MutationObserver(sync);
		observer.observe(document.body, { childList: true, subtree: true });

		return () => {
			observer.disconnect();
		};
	}, [sync]);

	useSiteEditorNavigate(sync);

	if (!host || !isDesignRoot) {
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
			<SiteHubInjector />
			<SiteEditorMainPanelNavigationInjector />
		</>
	);
}
