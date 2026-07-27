// @flow

/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';

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
