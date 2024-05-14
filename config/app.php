<?php

$wp_debug = defined( 'WP_DEBUG' ) && WP_DEBUG;
$env_mode = 'development' === blockera_one_env( 'APP_MODE', 'production' );

return [
	'root_url'      => BLOCKERA_ONE_URI,
	'root_path'     => BLOCKERA_ONE_PATH,
	'url'           => BLOCKERA_ONE_URI . 'app/',
	'path'          => BLOCKERA_ONE_PATH . 'app/',
	'name'          => 'blockera-one',
	'dist_url'      => BLOCKERA_ONE_URI . 'dist/',
	'dist_path'     => BLOCKERA_ONE_PATH . 'dist/',
	'packages_url'  => BLOCKERA_ONE_URI . 'packages/',
	'packages_path' => BLOCKERA_ONE_PATH . 'packages/',
	'vendor_path'   => BLOCKERA_ONE_PATH . 'vendor/',
	'version'       => defined( 'BLOCKERA_ONE_VERSION' ) ? BLOCKERA_ONE_VERSION : blockera_one_env( 'VERSION' ),
	'namespaces'    => [],
	'debug'         => defined( 'BLOCKERA_ONE_APP_MODE' ) && 'development' === BLOCKERA_ONE_APP_MODE ? BLOCKERA_ONE_APP_MODE : ( $env_mode || $wp_debug ),
	'providers'     => [
		\BlockeraOne\Setup\Providers\AssetsProvider::class,
		\BlockeraOne\Setup\Providers\AppServiceProvider::class,
	],
];
