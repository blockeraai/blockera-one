/**
 * Register / override Site Editor routes for identity, homepage, performance.
 *
 * Uses Redux `REGISTER_ROUTE` / `UNREGISTER_ROUTE` on `core/edit-site`
 * (same pattern as SiteEditorPostItemRouteRegistration). Do not import
 * `@wordpress/edit-site` internals.
 *
 * These routes are sidebar-only drill-downs (like Navigation): main Design
 * nav collapses; settings render inside the primary sidebar — no second
 * `edit-site-layout__area` content column.
 */

import type { ReactNode } from 'react';

import { useRegistry } from '@wordpress/data';
import { useLayoutEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { EDIT_SITE_STORE_NAME } from './constants';
import DrillDownScreen from './drill-down-screen';
import HomepageSettingsPanel from './homepage-settings-panel';
import PerformancePanel from './performance-panel';
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

function unregisterIfPresent(
	reduxStore: NonNullable<ReturnType<typeof getEditSiteReduxStore>>,
	name: string
): void {
	const routes = reduxStore?.getState?.()?.routes ?? [];
	if (routes.some((r) => r?.name === name)) {
		reduxStore.dispatch?.({
			type: 'UNREGISTER_ROUTE',
			name,
		});
	}
}

/**
 * Bootstrap identity / homepage / performance drill-down routes once core
 * routes are ready.
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
			// Prefer `home` preview (`Editor`) so Design-root `/` → our panels keeps
			// the same canvas tree. Cloning `styles` preview (StylesPreviewArea)
			// remounts the iframe and flashes the canvas.
			const home = routes.find((r) => r?.name === 'home');
			const styles = routes.find((r) => r?.name === 'styles');
			const navigation = routes.find((r) => r?.name === 'navigation');

			const preview =
				home?.areas?.preview ??
				navigation?.areas?.preview ??
				styles?.areas?.preview;

			if (!preview) {
				return false;
			}

			const identityScreen = (
				<DrillDownScreen title={__('Site Identity', 'blockera')}>
					<SiteIdentityPanel />
				</DrillDownScreen>
			);

			unregisterIfPresent(reduxStore, 'identity');
			reduxStore.dispatch({
				type: 'REGISTER_ROUTE',
				route: {
					name: 'identity',
					path: '/identity',
					areas: {
						sidebar: identityScreen,
						preview,
						mobileSidebar: (
							<DrillDownScreen
								title={__('Site Identity', 'blockera')}
							>
								<SiteIdentityPanel />
							</DrillDownScreen>
						),
					},
				},
			});

			const homepageScreen = (
				<DrillDownScreen title={__('Homepage Settings', 'blockera')}>
					<HomepageSettingsPanel />
				</DrillDownScreen>
			);

			unregisterIfPresent(reduxStore, 'homepage');
			reduxStore.dispatch({
				type: 'REGISTER_ROUTE',
				route: {
					name: 'homepage',
					path: '/homepage',
					areas: {
						sidebar: homepageScreen,
						preview,
						mobileSidebar: (
							<DrillDownScreen
								title={__('Homepage Settings', 'blockera')}
							>
								<HomepageSettingsPanel />
							</DrillDownScreen>
						),
					},
				},
			});

			unregisterIfPresent(reduxStore, 'performance');
			reduxStore.dispatch({
				type: 'REGISTER_ROUTE',
				route: {
					name: 'performance',
					path: '/performance',
					areas: {
						sidebar: (
							<DrillDownScreen
								title={__('Performance', 'blockera')}
							>
								<PerformancePanel />
							</DrillDownScreen>
						),
						preview,
						mobileSidebar: (
							<DrillDownScreen
								title={__('Performance', 'blockera')}
							>
								<PerformancePanel />
							</DrillDownScreen>
						),
					},
				},
			});

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
