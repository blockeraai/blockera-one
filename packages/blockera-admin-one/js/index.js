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
	'blockera-admin-one/products.isCompanionPlugin',
	() => false,
	20
);
