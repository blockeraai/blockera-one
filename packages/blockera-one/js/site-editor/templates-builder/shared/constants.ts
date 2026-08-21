/** Site setting key registered by Theme\TemplateSettings (REST on root/site). */
export const TEMPLATE_SETTINGS_KEY = 'blockera_one_template_settings';

export type TemplateSettingsRecord = {
	posts_per_page?: Record<string, number>;
	sidebar_width?: string;
	header_sticky?: string;
};

/**
 * Shared empty settings object. `useSelect` must not return `|| {}` or
 * every store tick allocates a new identity and re-runs control memos.
 */
export const EMPTY_TEMPLATE_SETTINGS: TemplateSettingsRecord = {};
