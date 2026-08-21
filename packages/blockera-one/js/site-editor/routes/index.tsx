/**
 * Register / override Site Editor routes for styles, templates, identity,
 * homepage, and performance.
 *
 * Uses Redux `REGISTER_ROUTE` / `UNREGISTER_ROUTE` on `core/edit-site`
 * (same pattern as SiteEditorPostItemRouteRegistration). Do not import
 * `@wordpress/edit-site` internals.
 *
 * These routes are sidebar-only drill-downs (like Navigation): main Design
 * nav collapses; settings / Global Styles / Templates purpose-nav render
 * inside the primary sidebar.
 */

import type { ReactNode } from 'react';

import { useRegistry } from '@wordpress/data';
import {
	cloneElement,
	isValidElement,
	useLayoutEffect,
} from '@wordpress/element';

import { EDIT_SITE_STORE_NAME } from '../constants';
import { getSettingsRouteItems } from '../navigation/nav-config';
import StylesDrillDown from '../styles-drill-down';
import { TemplatesDrillDown } from '../templates';
import TemplatesAreaHub from '../templates/templates-area-hub';
import { isSiteEditorUrl } from '../utils';
import { buildSettingsRoute } from './register-settings-routes';
import {
	type RouteAreaFn,
	type RouteAreas,
	wrapPageItemSidebar,
	wrapTemplateItemPurposePreview,
	wrapTemplatesBrowseArea,
	wrapTemplatesBrowsePreview,
} from './wrap-templates-areas';
import '../styles-panel.scss';

let didRegister = false;

type EditSiteRoute = {
	name?: string;
	path?: string;
	areas?: RouteAreas;
	widths?: Record<string, number | ((args: unknown) => unknown)>;
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
 * Duplicate a route area node so sidebar + mobileSidebar each get an instance.
 * Function areas pass through unchanged (the router invokes them per area).
 */
function duplicateAreaNode(
	node: ReactNode | RouteAreaFn
): ReactNode | RouteAreaFn {
	if (isValidElement(node)) {
		return cloneElement(node);
	}
	return node;
}

// Core styles content is an element in practice; a function area would pass
// through untouched (same runtime behavior as before the type widening).
function wrapStylesDrillDown(content: ReactNode | RouteAreaFn): ReactNode {
	return <StylesDrillDown>{content as ReactNode}</StylesDrillDown>;
}

/**
 * Bootstrap styles / templates / identity / homepage / performance routes once
 * core routes are ready.
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
			const styles = routes.find((r) => r?.name === 'styles');

			// Styles needs its own content + preview (Style Book / Editor).
			if (!styles?.areas?.content || !styles?.areas?.preview) {
				return false;
			}

			const templates = routes.find((r) => r?.name === 'templates');

			// Templates purpose-nav needs the core templates route (preview Editor).
			if (!templates?.areas?.sidebar || !templates?.areas?.preview) {
				return false;
			}

			const home = routes.find((r) => r?.name === 'home');
			const navigation = routes.find((r) => r?.name === 'navigation');

			// Site settings panels prefer `home` preview to avoid canvas remount.
			const settingsPreview =
				home?.areas?.preview ??
				navigation?.areas?.preview ??
				styles.areas.preview;

			if (!settingsPreview) {
				return false;
			}

			const stylesContent = styles.areas.content;
			const stylesPreview = styles.areas.preview;
			const stylesMobileContent =
				styles.areas.mobileContent ?? styles.areas.content;

			unregisterIfPresent(reduxStore, 'styles');
			reduxStore.dispatch({
				type: 'REGISTER_ROUTE',
				route: {
					name: 'styles',
					path: '/styles',
					areas: {
						sidebar: wrapStylesDrillDown(
							duplicateAreaNode(stylesContent)
						),
						preview: stylesPreview,
						mobileSidebar: wrapStylesDrillDown(
							duplicateAreaNode(stylesMobileContent)
						),
					},
				},
			});

			unregisterIfPresent(reduxStore, 'templates');
			reduxStore.dispatch({
				type: 'REGISTER_ROUTE',
				route: {
					name: 'templates',
					path: '/template',
					areas: {
						sidebar: <TemplatesDrillDown />,
						// Core content is a function — must stay callable so
						// PageTemplates receives siteData (see wrapTemplatesBrowseArea).
						content: wrapTemplatesBrowseArea(
							templates.areas.content
						),
						preview: wrapTemplatesBrowsePreview(
							templates.areas.preview
						),
						mobileSidebar: <TemplatesDrillDown />,
						mobileContent: wrapTemplatesBrowseArea(
							templates.areas.mobileContent ??
								templates.areas.content
						),
					},
					widths: templates.widths,
				},
			});

			const templateItem = routes.find(
				(r) => r?.name === 'template-item'
			);
			const templatePartItem = routes.find(
				(r) => r?.name === 'template-part-item'
			);

			if (templateItem?.areas?.preview) {
				unregisterIfPresent(reduxStore, 'template-item');
				reduxStore.dispatch({
					type: 'REGISTER_ROUTE',
					route: {
						name: 'template-item',
						path: templateItem.path || '/wp_template/*postId',
						areas: {
							sidebar: <TemplatesDrillDown />,
							preview: wrapTemplateItemPurposePreview(
								templateItem.areas.preview
							),
							mobileSidebar: <TemplatesDrillDown />,
						},
					},
				});
			}

			if (templatePartItem?.areas?.preview) {
				unregisterIfPresent(reduxStore, 'template-part-item');
				reduxStore.dispatch({
					type: 'REGISTER_ROUTE',
					route: {
						name: 'template-part-item',
						path:
							templatePartItem.path ||
							'/wp_template_part/*postId',
						areas: {
							sidebar: <TemplatesDrillDown />,
							preview: (
								<TemplatesAreaHub>
									{
										templatePartItem.areas
											.preview as ReactNode
									}
								</TemplatesAreaHub>
							),
							mobileSidebar: <TemplatesDrillDown />,
						},
					},
				});
			}

			const pageItem = routes.find((r) => r?.name === 'page-item');
			if (pageItem?.areas?.preview) {
				const corePageSidebar = pageItem.areas.sidebar;
				const corePageMobileSidebar =
					pageItem.areas.mobileSidebar ?? pageItem.areas.sidebar;

				unregisterIfPresent(reduxStore, 'page-item');
				reduxStore.dispatch({
					type: 'REGISTER_ROUTE',
					route: {
						name: 'page-item',
						path: pageItem.path || '/page/:postId',
						areas: {
							sidebar: wrapPageItemSidebar(corePageSidebar),
							preview: pageItem.areas.preview,
							mobileSidebar: wrapPageItemSidebar(
								corePageMobileSidebar
							),
						},
					},
				});
			}

			// Identity / Homepage / Performance — one catalog entry each.
			for (const item of getSettingsRouteItems()) {
				const route = buildSettingsRoute({
					name: item.key,
					path: item.path,
					title: item.label,
					Panel: item.settingsPanel,
					preview: settingsPreview,
				});
				unregisterIfPresent(reduxStore, route.name);
				reduxStore.dispatch({
					type: 'REGISTER_ROUTE',
					route,
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
