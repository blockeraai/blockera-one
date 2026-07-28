// @flow

/**
 * External dependencies
 */
import { addFilter, applyFilters } from '@wordpress/hooks';

/**
 * This plugin defines the companion (Blockera Site Builder) plugin as installed.
 */
addFilter(
	'blockera.products.isCompanionPlugin',
	'blockera-one/products.isCompanionPlugin',
	() => false,
	20
);

/**
 * Theme mode: one open tab until the companion plugin is active.
 * Pro free-tier limits apply once the companion is present.
 */
addFilter(
	'blockera.editor.tabs',
	'blockera-one/editor.tabs.companion',
	(tabsConfig) => {
		if (applyFilters('blockera.products.isCompanionPlugin', false)) {
			return tabsConfig;
		}

		return {
			...tabsConfig,
			limits: {
				...(tabsConfig?.limits || {}),
				regular: 1,
			},
		};
	}
);

/**
 * Default companion plugin install configuration for theme mode.
 */
addFilter(
	'blockera.companionPlugin.config',
	'blockera-one/companionPlugin.config',
	(config) => ({
		...config,
		slug: 'blockera',
		plugin: 'blockera/blockera.php',
		name: 'Blockera Site Builder',
	})
);
