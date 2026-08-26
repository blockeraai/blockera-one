/**
 * Templates Builder public API (thin barrel).
 */

export {
	default as TemplateOptionsPanel,
	TemplateOptionsTitleActions,
} from './shared/panel';
export {
	getOptionsConfigForFilter,
	getOptionsConfigForPartsArea,
	ARCHIVE_OPTIONS_CONFIG,
	SINGLE_OPTIONS_CONFIG,
	NOT_FOUND_OPTIONS_CONFIG,
	GLOBAL_FOOTER_OPTIONS_CONFIG,
	GLOBAL_HEADER_OPTIONS_CONFIG,
	GLOBAL_SIDEBAR_OPTIONS_CONFIG,
} from './registry';
export { TEMPLATE_SETTINGS_KEY } from './shared/constants';
export {
	resolveEnableScrollTarget,
	resolveNestedPanelScrollTarget,
	resolveOptionsPanelGroups,
} from './shared/resolve/resolve-options-panel';
export {
	cancelStampCanvasReveal,
	scrollStampIntoCanvas,
} from './shared/canvas/scroll-stamp-into-canvas';
export { resolveTemplateIdForFilter } from './shared/resolve/resolve-template-id';
export { stopContentOnlySectionEdit } from './shared/canvas/select-section-in-canvas';
export type { TemplateOptionsConfig } from './shared/types';
