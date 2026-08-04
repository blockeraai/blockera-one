/**
 * Register / override Site Editor routes for identity + homepage.
 *
 * Uses Redux `REGISTER_ROUTE` / `UNREGISTER_ROUTE` on `core/edit-site`
 * (same pattern as SiteEditorPostItemRouteRegistration). Do not import
 * `@wordpress/edit-site` internals.
 */

import type { ReactNode } from 'react';

import { useRegistry } from '@wordpress/data';
import { useLayoutEffect } from '@wordpress/element';

import { CONTENT_PANEL_WIDTH, EDIT_SITE_STORE_NAME } from './constants';
import HomepageSettingsPanel from './homepage-settings-panel';
import SiteIdentityPanel from './site-identity-panel';
import { isSiteEditorUrl } from './utils';

let didRegister = false;

type RouteAreas = {
	sidebar?: ReactNode | ((args: unknown) => ReactNode);
	content?: ReactNode | ((args: unknown) => ReactNode);
	preview?: ReactNode | ((args: unknown) => ReactNode);
	mobile?: ReactNode | ((args: unknown) => ReactNode);
	mobileContent?: ReactNode | ((args: unknown) => ReactNode);
	mobileSidebar?: ReactNode | ((args: unknown) => ReactNode);
};

type EditSiteRoute = {
	name?: string;
	path?: string;
	areas?: RouteAreas;
	widths?: Record<string, number>;
};

type DataRegistryWithStores = {
	stores?: Record<
		string,
		{
			store?: {
				dispatch?: (action: {
					type: string;
					route?: unknown;
					name?: string;
				}) => void;
				getState?: () => { routes?: EditSiteRoute[] };
			};
		}
	>;
	subscribe?: (listener: () => void) => () => void;
};

function getEditSiteReduxStore(registry: unknown) {
	return (registry as DataRegistryWithStores).stores?.[EDIT_SITE_STORE_NAME]
		?.store;
}

/**
 * Bootstrap identity override + homepage route once core routes are ready.
 */
export default function SiteEditorMainPanelRoutes(): null {
	const registry = useRegistry();

	useLayoutEffect(() => {
		if (didRegister || !isSiteEditorUrl()) {
			return;
		}

		const tryRegister = (): boolean => {
			const reduxStore = getEditSiteReduxStore(registry);

			if (typeof reduxStore?.dispatch !== 'function') {
				return false;
			}

			const routes = reduxStore?.getState?.()?.routes ?? [];
			// Runtime WP may not ship a core `identity` route.
			// Clone sidebar/preview from `styles`, which always exists for block themes.
			const styles = routes.find((r) => r?.name === 'styles');

			if (!styles?.areas?.sidebar || !styles?.areas?.preview) {
				return false;
			}

			const sidebar = styles.areas.sidebar;
			const preview = styles.areas.preview;
			const coreIdentity = routes.find((r) => r?.name === 'identity');

			// Override core identity when present; otherwise register fresh.
			if (coreIdentity) {
				reduxStore.dispatch({
					type: 'UNREGISTER_ROUTE',
					name: 'identity',
				});
			}

			reduxStore.dispatch({
				type: 'REGISTER_ROUTE',
				route: {
					name: 'identity',
					path: '/identity',
					areas: {
						sidebar,
						content: <SiteIdentityPanel />,
						preview,
						mobileContent: <SiteIdentityPanel />,
					},
					widths: {
						content: CONTENT_PANEL_WIDTH,
					},
				},
			});

			const alreadyHasHomepage = (
				reduxStore.getState?.()?.routes ?? []
			).some((r) => r?.name === 'homepage');

			if (!alreadyHasHomepage) {
				reduxStore.dispatch({
					type: 'REGISTER_ROUTE',
					route: {
						name: 'homepage',
						path: '/homepage',
						areas: {
							sidebar,
							content: <HomepageSettingsPanel />,
							preview,
							mobileContent: <HomepageSettingsPanel />,
						},
						widths: {
							content: CONTENT_PANEL_WIDTH,
						},
					},
				});
			}

			didRegister = true;
			return true;
		};

		if (tryRegister()) {
			return;
		}

		const unsubscribe = registry.subscribe(() => {
			if (tryRegister()) {
				unsubscribe();
			}
		});

		return () => {
			unsubscribe();
		};
	}, [registry]);

	return null;
}
