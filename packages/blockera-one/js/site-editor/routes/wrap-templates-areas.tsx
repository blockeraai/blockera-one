/**
 * Gutenberg Site Editor route area types + wrappers for Templates browse /
 * purpose-preview. No REGISTER_ROUTE dispatch here.
 */

import type { ReactNode } from 'react';

import {
	TemplatesBrowseContent,
	isTemplatesOwnedPagePreview,
} from '../templates';
import TemplatesDrillDown from '../templates/templates-drill-down';
import TemplatesPurposePreview from '../templates/templates-purpose-preview';
import { getTemplatesUrlState } from '../templates/constants';

export type RouteAreaFn = (args: unknown) => ReactNode | Promise<ReactNode>;

export type RouteAreas = {
	sidebar?: ReactNode | RouteAreaFn;
	content?: ReactNode | RouteAreaFn;
	preview?: ReactNode | RouteAreaFn;
	mobile?: ReactNode | RouteAreaFn;
	mobileContent?: ReactNode | RouteAreaFn;
	mobileSidebar?: ReactNode | RouteAreaFn;
};

/**
 * Invoke a core route area (element or `({ siteData, query }) => …` function).
 * Core preview/widths may be async — callers must await thenables.
 */
export function resolveAreaNode(
	area: ReactNode | RouteAreaFn | undefined,
	args: unknown
): ReactNode | Promise<ReactNode> {
	if (typeof area === 'function') {
		return area(args);
	}
	return area ?? null;
}

/**
 * Resolve a core route area and await it when async (core preview areas can
 * return promises: list → Editor, grid → undefined).
 */
export async function resolveAreaNodeAsync(
	area: ReactNode | RouteAreaFn | undefined,
	args: unknown
): Promise<ReactNode> {
	const resolved = resolveAreaNode(area, args);
	if (
		!!resolved &&
		typeof (resolved as { then?: unknown }).then === 'function'
	) {
		return await (resolved as Promise<ReactNode>);
	}
	return resolved as ReactNode;
}

/**
 * Keep core area as a function so the router still passes `siteData` / `query`,
 * then gate the resolved node (e.g. missing-base empty state).
 */
export function wrapTemplatesBrowseArea(
	area: ReactNode | RouteAreaFn | undefined
): RouteAreaFn {
	return async (args: unknown) => {
		const node = await resolveAreaNodeAsync(area, args);
		return <TemplatesBrowseContent>{node}</TemplatesBrowseContent>;
	};
}

/**
 * Await core async preview. Return null when empty or when Area Hub owns the
 * view so layout does not mount an empty canvas.
 */
export function wrapTemplatesBrowsePreview(
	area: ReactNode | RouteAreaFn | undefined
): RouteAreaFn {
	return async (args: unknown) => {
		if (getTemplatesUrlState().partsArea) {
			return null;
		}

		return (await resolveAreaNodeAsync(area, args)) ?? null;
	};
}

/**
 * Keep `template-item` preview as a route area function so the router still
 * resolves core `({ siteData }) => <Editor />`. Wrapping the function as JSX
 * children leaves a blank canvas.
 */
export function wrapTemplateItemPurposePreview(
	area: ReactNode | RouteAreaFn | undefined
): RouteAreaFn {
	return async (args: unknown) => {
		const node = await resolveAreaNodeAsync(area, args);
		return <TemplatesPurposePreview>{node}</TemplatesPurposePreview>;
	};
}

/**
 * Homepage / Blog·Posts preview pages via `/page/{id}` but keep Templates
 * purpose-nav when `blockera-builder` marks a Templates-owned preview.
 */
export function wrapPageItemSidebar(
	coreSidebar: ReactNode | RouteAreaFn | undefined
): RouteAreaFn {
	return (args: unknown) => {
		const keepTemplates = isTemplatesOwnedPagePreview(
			getTemplatesUrlState().filter
		);

		if (keepTemplates) {
			return <TemplatesDrillDown />;
		}
		return resolveAreaNode(coreSidebar, args);
	};
}
