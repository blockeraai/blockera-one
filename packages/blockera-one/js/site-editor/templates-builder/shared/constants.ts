/** Site setting key registered by Theme\TemplateSettings (REST on root/site). */
export const TEMPLATE_SETTINGS_KEY = 'blockera_one_template_settings';

export type TemplateSettingsRecord = {
	posts_per_page?: Record<string, number>;
};
