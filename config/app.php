<?php
/**
 * Direct access is not allowed.
 *
 * @package config/app.php
 */

if (! defined('ABSPATH')) {

    exit;
}

global $blockera_one_mode;

return [
    'root_url'       => BLOCKERA_ONE_URI,
    'root_path'      => BLOCKERA_ONE_PATH,
    'name'           => 'blockera',
    'dashboard_page' => 'blockera-settings-dashboard',
    'dist_url'       => BLOCKERA_ONE_URI . 'dist/',
    'dist_path'      => BLOCKERA_ONE_PATH . 'dist/',
    'packages_url'   => BLOCKERA_ONE_URI . 'packages/',
    'packages_path'  => blockera_core_env('APP_MODE', 'production') === 'development' ? BLOCKERA_ONE_PATH . 'packages/' : BLOCKERA_ONE_PATH . 'vendor/',
    'vendor_path'    => BLOCKERA_ONE_PATH . 'vendor/',
    'vendor_url'     => BLOCKERA_ONE_URI . 'vendor/',
    'version'        => defined('BLOCKERA_ONE_VERSION') ? BLOCKERA_ONE_VERSION : blockera_core_env('VERSION'),
    'namespaces'     => [
        'controllers' => '\Blockera\Setup\Http\Controllers\\',
    ],
    'debug'          => (bool) $blockera_one_mode,
    'upgrade_url' 	 => 'https://blockera.ai/products/site-builder/upgrade/?utm_source=blockera-admin&utm_medium=referral&utm_campaign=upgrade-page&utm_content=cta-link',
    /**
     * Extendable blockera application providers by external developers.
     *
     * @since 1.0.0
     */
    'providers'      => apply_filters(
        'blockera.application.providers',
        [
            \Blockera\Admin\Providers\AdminProvider::class,
            \Blockera\Setup\Providers\EditorAssetsProvider::class,
            \Blockera\Setup\Providers\RestAPIProvider::class,
            \Blockera\Setup\Providers\AppServiceProvider::class,
			\Blockera\Editor\Providers\StyleDefinitionsProvider::class,
            \Blockera\Admin\Providers\AdminAssetsProvider::class,
        ]
    ),
];
