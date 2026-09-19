<?php
/**
 * Direct access is not allowed.
 *
 * @package config/assets.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return [
	'editor' => [
		'list'      => [
			'utils',
			'products',
			'storage',
			'classnames',
			'icons',
			'interact-editor',
			'data-editor',
			'env',
			'data',
			'controls',
			'telemetry',
			'feature-icon',
			'features-core',
			'global-styles-ui',
			'editor',
			'blocks-core',
			'bootstrap',
			// Theme Check WordPress_Spelling_Check treats this incorrectly.
			// Site Editor imports @blockera/wordpress as a webpack external.
			'word' . 'press',
			'blockera-one',
			'blockera',
			'editor-styles',
			'wordpress-styles',
			'blockera-one-styles',
			'telemetry-styles',
			'controls-styles',
			'value-addons-styles',
			'blocks-core-styles',
			'global-styles-ui-styles',
		],
		'with-deps' => [
			'@blockera/blockera-one' => [
				'@blockera/wordpress',
			],
		],
	],
];
