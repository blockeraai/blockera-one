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
import { __ } from '@wordpress/i18n';

import { EDIT_SITE_STORE_NAME } from './constants';
import DrillDownScreen from './drill-down-screen';
import HomepageSettingsPanel from './homepage-settings-panel';
import PerformancePanel from './performance-panel';
import SiteIdentityPanel from './site-identity-panel';
import StylesDrillDown from './styles-drill-down';
import { TemplatesBrowseContent, TemplatesDrillDown } from './templates';
import { isSiteEditorUrl } from './utils';
import './styles-panel.scss';

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
 */
function duplicateAreaNode(node: ReactNode): ReactNode {
	if (isValidElement(node)) {
		return cloneElement(node);
	}
	return node;
}

type RouteAreaFn = (args: unknown) => ReactNode;

/**
 * Invoke a core route area (element or `({ siteData, query }) => …` function).
 */
function resolveAreaNode(
	area: ReactNode | RouteAreaFn | undefined,
	args: unknown
): ReactNode {
	if (typeof area === 'function') {
		return (area as RouteAreaFn)(args);
	}
	return area ?? null;
}

/**
 * Keep core area as a function so the router still passes `siteData` / `query`,
 * then gate the resolved node (e.g. missing-base empty state).
 */
function wrapTemplatesBrowseArea(
	area: ReactNode | RouteAreaFn | undefined
): RouteAreaFn {
	return (args: unknown) => {
		const resolved = resolveAreaNode(area, args);
		return <TemplatesBrowseContent>{resolved}</TemplatesBrowseContent>;
	};
}

function wrapStylesDrillDown(content: ReactNode): ReactNode {
	return <StylesDrillDown>{content}</StylesDrillDown>;
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
						preview: templates.areas.preview,
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
							preview: templateItem.areas.preview,
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
							preview: templatePartItem.areas.preview,
							mobileSidebar: <TemplatesDrillDown />,
						},
					},
				});
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
						preview: settingsPreview,
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
						preview: settingsPreview,
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
						preview: settingsPreview,
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
