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

import { getQueryArg } from '@wordpress/url';

import { EDIT_SITE_STORE_NAME } from './constants';
import DrillDownScreen from './drill-down-screen';
import HomepageSettingsPanel from './homepage-settings-panel';
import PerformancePanel from './performance-panel';
import SiteIdentityPanel from './site-identity-panel';
import StylesDrillDown from './styles-drill-down';
import {
	TEMPLATES_FILTER_QUERY,
	TemplatesBrowseContent,
	TemplatesDrillDown,
	isTemplatesOwnedPagePreview,
} from './templates';
import TemplatesAreaHub from './templates/templates-area-hub';
import TemplatesPurposePreview from './templates/templates-purpose-preview';
import { getTemplatesUrlState } from './templates/constants';
import { isSiteEditorUrl } from './utils';
import './styles-panel.scss';

let didRegister = false;

type RouteAreaFn = (args: unknown) => ReactNode | Promise<ReactNode>;

type RouteAreas = {
	sidebar?: ReactNode | RouteAreaFn;
	content?: ReactNode | RouteAreaFn;
	preview?: ReactNode | RouteAreaFn;
	mobile?: ReactNode | RouteAreaFn;
	mobileContent?: ReactNode | RouteAreaFn;
	mobileSidebar?: ReactNode | RouteAreaFn;
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

/**
 * Invoke a core route area (element or `({ siteData, query }) => …` function).
 * Core preview/widths may be async — callers must await thenables.
 */
function resolveAreaNode(
	area: ReactNode | RouteAreaFn | undefined,
	args: unknown
): ReactNode | Promise<ReactNode> {
	if (typeof area === 'function') {
		return area(args);
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
	return async (args: unknown) => {
		const resolved = resolveAreaNode(area, args);
		const node =
			!!resolved &&
			typeof (resolved as { then?: unknown }).then === 'function'
				? await (resolved as Promise<ReactNode>)
				: resolved;
		return <TemplatesBrowseContent>{node}</TemplatesBrowseContent>;
	};
}

/**
 * Await core async preview (list → Editor, grid → undefined). Return null when
 * empty or when Area Hub owns the view so layout does not mount an empty canvas.
 */
function wrapTemplatesBrowsePreview(
	area: ReactNode | RouteAreaFn | undefined
): RouteAreaFn {
	return async (args: unknown) => {
		if (getTemplatesUrlState().partsArea) {
			return null;
		}

		const resolved = resolveAreaNode(area, args);
		const node =
			!!resolved &&
			typeof (resolved as { then?: unknown }).then === 'function'
				? await (resolved as Promise<ReactNode>)
				: resolved;

		return node ?? null;
	};
}

/**
 * Keep `template-item` preview as a route area function so the router still
 * resolves core `({ siteData }) => <Editor />`. Wrapping the function as JSX
 * children leaves a blank canvas.
 */
function wrapTemplateItemPurposePreview(
	area: ReactNode | RouteAreaFn | undefined
): RouteAreaFn {
	return async (args: unknown) => {
		const resolved = resolveAreaNode(area, args);
		const node =
			!!resolved &&
			typeof (resolved as { then?: unknown }).then === 'function'
				? await (resolved as Promise<ReactNode>)
				: resolved;

		return <TemplatesPurposePreview>{node}</TemplatesPurposePreview>;
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

			// Homepage / Blog·Posts preview pages via `/page/{id}` but keep
			// Templates purpose-nav when `boFilter` marks a Templates-owned preview.
			const pageItem = routes.find((r) => r?.name === 'page-item');
			if (pageItem?.areas?.preview) {
				const corePageSidebar = pageItem.areas.sidebar;
				const corePageMobileSidebar =
					pageItem.areas.mobileSidebar ?? pageItem.areas.sidebar;

				const templatesOrPagesSidebar = (
					coreSidebar: ReactNode | ((args: unknown) => ReactNode)
				): RouteAreaFn => {
					return (args: unknown) => {
						const boFilter = getQueryArg(
							typeof window !== 'undefined'
								? window.location.href
								: '',
							TEMPLATES_FILTER_QUERY
						);
						const keepTemplates = isTemplatesOwnedPagePreview(
							typeof boFilter === 'string' ? boFilter : null
						);

						if (keepTemplates) {
							return <TemplatesDrillDown />;
						}
						return resolveAreaNode(coreSidebar, args);
					};
				};

				unregisterIfPresent(reduxStore, 'page-item');
				reduxStore.dispatch({
					type: 'REGISTER_ROUTE',
					route: {
						name: 'page-item',
						path: pageItem.path || '/page/:postId',
						areas: {
							sidebar: templatesOrPagesSidebar(corePageSidebar),
							preview: pageItem.areas.preview,
							mobileSidebar: templatesOrPagesSidebar(
								corePageMobileSidebar
							),
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
