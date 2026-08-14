/**
 * Shared Site Editor nested-panel navigation (URL stack + gateway UI).
 * Feature panels (Templates Builder, Homepage, …) consume this module.
 */

export type { NestedPanelNode, ResolvedNestedPanel } from './types';
export { resolveNestedPanel } from './resolve-panel';
export {
	readPanelStack,
	serializePanelStack,
	pushPanelStackQuery,
} from './url-stack';
export {
	default as useUrlPanelStack,
	type UrlPanelStackApi,
} from './use-url-panel-stack';
export { default as GatewayCard, type GatewayCardProps } from './gateway-card';
export { default as GatewayRow, type GatewayRowProps } from './gateway-row';
