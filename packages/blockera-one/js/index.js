// @flow

/**
 * External dependencies
 */
import { addFilter, applyFilters } from '@wordpress/hooks';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import SiteEditorMainPanel from './site-editor/index.tsx';

/**
 * Theme is not the companion plugin. Pass the current value through so an
 * active Blockera plugin (priority 10) can report true without being overwritten.
 */
addFilter(
	'blockera.products.isCompanionPlugin',
	'blockera-one/products.isCompanionPlugin',
	(isCompanionPlugin) => isCompanionPlugin,
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

function registerSiteEditorMainPanel(): void {
	// Idempotent — after.bootstrap + immediate path may both run.
	if (window.__blockeraOneSiteEditorMainPanelRegistered) {
		return;
	}
	window.__blockeraOneSiteEditorMainPanelRegistered = true;

	registerPlugin('blockera-one-site-editor-main-panel', {
		render: SiteEditorMainPanel,
		icon: null,
	});
}

/**
 * Prefer after.bootstrap when available; also register immediately so companion
 * mode still works if this script loads after plugin bootstrap already ran.
 */
addFilter(
	'blockera.after.bootstrap',
	'blockera-one/site-editor-main-panel',
	(previous) => {
		registerSiteEditorMainPanel();
		return previous;
	}
);

registerSiteEditorMainPanel();
