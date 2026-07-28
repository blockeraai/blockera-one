<?php
/**
 * Bootstrap The blockera application.
 * 
 * @package blockera-one/inc/blockera.php
 */

### BEGIN AUTO-GENERATED AUTOLOADER
require_once __DIR__ . '/packages/autoloader-coordinator/bootstrap.php';
blockera_bootstrap_shared_autoloader('blockera-one', __DIR__, 10, true);
### END AUTO-GENERATED AUTOLOADER

if (! defined('BLOCKERA_SB_FILE')) {
    define('BLOCKERA_SB_FILE', __FILE__);
}

if (! defined('BLOCKERA_SB_URI')) {
    define('BLOCKERA_SB_URI', get_template_directory_uri() . '/');
}

if (! defined('BLOCKERA_SB_PATH')) {
    define('BLOCKERA_SB_PATH', get_template_directory() . '/');
}

### BEGIN AUTO-GENERATED DEFINES
if (! defined('BLOCKERA_SB_MODE')) {
    define('BLOCKERA_SB_MODE', 'development');
}

if (! defined('BLOCKERA_SB_VERSION')) {
    define('BLOCKERA_SB_VERSION', wp_get_theme()->get( 'Version' ));
}
### END AUTO-GENERATED DEFINES

if (file_exists(BLOCKERA_SB_PATH . '.env')) {
    // Env Loading ...
    $blockera_dotenv = Dotenv\Dotenv::createImmutable(BLOCKERA_SB_PATH);
    $blockera_dotenv->safeLoad();
}

global $blockera_env_mode, $blockera_mode, $blockera_block_supports;

// Set the blockera environment mode.
$blockera_env_mode = 'development' === ( isset($_ENV['APP_MODE']) ? sanitize_text_field($_ENV['APP_MODE']) : 'production' );
// Set the blockera mode.
$blockera_mode = defined('BLOCKERA_SB_MODE') && 'development' === BLOCKERA_SB_MODE && $blockera_env_mode;

global $blockera_compat_free_with_pro;

$blockera_compat_free_with_pro = new \Blockera\PluginCompatibility\CompatibilityCheck(
    [
		'file' => BLOCKERA_SB_FILE,
		'slug' => 'blockera-one',
		'version' => BLOCKERA_SB_VERSION,
		'plugin_path' => BLOCKERA_SB_PATH,
		'compatible_with_slug' => 'blockera-pro',
		'transient_key' => 'blockera-compat-redirect',
		'mode' => $blockera_mode ? 'development' : 'production',
	],
	new Blockera\Utils\Utils()
);

/**
 * Blockera is loading ...
 *
 * @return void
 */
function blockera_one_load_compatibility_check(): void {

	global $blockera_compat_free_with_pro, $blockera_is_compatible_with_pro;

	$blockera_is_compatible_with_pro = $blockera_compat_free_with_pro->load();
}

// Themes load after plugins_loaded; run immediately when that hook already fired.
if ( did_action( 'plugins_loaded' ) ) {
	blockera_one_load_compatibility_check();
} else {
	add_action( 'plugins_loaded', 'blockera_one_load_compatibility_check', 5 );
}

/**
 * Filter the block supports.
 *
 * @hook  'blockera.block.supports'
 * @since 1.12.2
 * @param array $block_supports The block supports.
 * 
 * @return array The filtered block supports.
 */
$blockera_block_supports = apply_filters(
	'blockera.block.supports',
	blockera_get_available_block_supports()
);

// Initialize hooks on Front Controller.
blockera_load('bootstrap.hooks', BLOCKERA_SB_PATH);

add_action('init', 'blockera_one_init', 10);

function blockera_one_init(): void {

	blockera_load('bootstrap.init', BLOCKERA_SB_PATH);

    /**
     * This hook for extendable setup process from internal or third-party developers.
     *
     * @hook  'blockera/before/setup'
     * @since 1.3.0
     */
    do_action('blockera/before/setup');

	global $blockera_compat_free_with_pro, $blockera_is_compatible_with_pro;

	if (! $blockera_is_compatible_with_pro) {
		// Add compatibility check hooks.
		add_action('admin_init', [ $blockera_compat_free_with_pro, 'adminInitialize' ]);
		add_action('admin_menu', [ $blockera_compat_free_with_pro, 'adminMenus' ]);
	}

    new \Blockera\Telemetry\Jobs(
        new \Blockera\WordPress\Sender(),
        blockera_core_config('telemetry')
    );

    ### BEGIN AUTO-GENERATED FRONT CONTROLLERS
    /**
     * For developers: Blockera debugging mode.
     *
     * Change this to true to enable the display of notices during development.
     * It is strongly recommended that internal developers use of "APP_MODE" env variable with "development" value
     * in their development environments.
     *
     * For information on other constants that can be used for debugging,
     * visit the documentation.
     *
     * @link TODO: please insert link of docs.
     */
    if (blockera_core_config('app.debug') && class_exists(\Whoops\Run::class)) {

        $whoops = new \Whoops\Run();
        $whoops->pushHandler(new \Whoops\Handler\PrettyPageHandler());
        $whoops->register();
    }
    require BLOCKERA_SB_PATH . 'packages/blockera/php/app.php';
    require BLOCKERA_SB_PATH . 'packages/blockera-one/php/functions.php';
    ### END AUTO-GENERATED FRONT CONTROLLERS

    /**
     * This hook for extendable setup process from internal or third-party developers.
     *
     * @hook  'blockera/after/setup'
     * @since 1.3.0
     */
    do_action('blockera/after/setup');
}
