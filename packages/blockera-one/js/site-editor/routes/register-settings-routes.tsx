/**
 * Settings drill-down route payloads (identity / homepage / performance).
 * Caller dispatches REGISTER_ROUTE — keep Redux in routes/index.tsx.
 */

import type { ComponentType, ReactNode } from 'react';

import DrillDownScreen from '../components/drill-down-screen';
import type { RouteAreaFn } from './wrap-templates-areas';

export type SettingsRouteInput = {
	name: string;
	path: string;
	title: string;
	Panel: ComponentType;
	preview: ReactNode | RouteAreaFn;
};

export type SettingsRoutePayload = {
	name: string;
	path: string;
	areas: {
		sidebar: ReactNode;
		preview: ReactNode | RouteAreaFn;
		mobileSidebar: ReactNode;
	};
};

/**
 * Register a sidebar-only settings route (drill-down title + panel), building
 * separate sidebar / mobileSidebar screen instances.
 */
export function buildSettingsRoute({
	name,
	path,
	title,
	Panel,
	preview,
}: SettingsRouteInput): SettingsRoutePayload {
	const screen = () => (
		<DrillDownScreen title={title}>
			<Panel />
		</DrillDownScreen>
	);

	return {
		name,
		path,
		areas: {
			sidebar: screen(),
			preview,
			mobileSidebar: screen(),
		},
	};
}
