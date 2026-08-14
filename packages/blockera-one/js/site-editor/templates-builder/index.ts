/**
 * Templates Builder public API (thin barrel).
 */

export {
	default as TemplateOptionsPanel,
	TemplateOptionsTitleActions,
} from './shared/template-options-panel';
export { getOptionsConfigForFilter, ARCHIVE_OPTIONS_CONFIG } from './registry';
export { TEMPLATE_SETTINGS_KEY } from './shared/constants';
export { resolveOptionsPanelGroups } from './shared/resolve-options-panel';
export { resolveTemplateIdForFilter } from './shared/resolve-template-id';
export type { TemplateOptionsConfig } from './shared/types';
