/**
 * Templates Builder public API (thin barrel).
 */

export {
	default as TemplateOptionsPanel,
	TemplateOptionsTitleActions,
} from './shared/template-options-panel';
export {
	getOptionsConfigForFilter,
	getOptionsConfigForPartsArea,
	ARCHIVE_OPTIONS_CONFIG,
	GLOBAL_FOOTER_OPTIONS_CONFIG,
	GLOBAL_HEADER_OPTIONS_CONFIG,
	GLOBAL_SIDEBAR_OPTIONS_CONFIG,
} from './registry';
export { TEMPLATE_SETTINGS_KEY } from './shared/constants';
export {
	resolveEnableScrollTarget,
	resolveNestedPanelScrollTarget,
	resolveOptionsPanelGroups,
} from './shared/resolve-options-panel';
export {
	cancelStampCanvasReveal,
	scrollStampIntoCanvas,
} from './shared/scroll-stamp-into-canvas';
export { resolveTemplateIdForFilter } from './shared/resolve-template-id';
export type { TemplateOptionsConfig } from './shared/types';
