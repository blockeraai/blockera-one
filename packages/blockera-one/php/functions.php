<?php
/**
 * Blockera One companion plugin helpers.
 *
 * @package blockera-one/functions.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'blockera_one_get_companion_plugin_status' ) ) :
	/**
	 * Resolve companion plugin install/activation status.
	 *
	 * @return string One of: not-installed, inactive, active.
	 */
	function blockera_one_get_companion_plugin_status(): string {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$plugin_file = 'blockera/blockera.php';

		if ( ! file_exists( WP_PLUGIN_DIR . '/' . $plugin_file ) ) {
			return 'not-installed';
		}

		if ( is_plugin_active( $plugin_file ) ) {
			return 'active';
		}

		return 'inactive';
	}
endif;

if ( ! function_exists( 'blockera_one_should_enqueue_companion_plugin_assets' ) ) :
	/**
	 * Whether companion plugin install UI assets should load.
	 *
	 * @return bool
	 */
	function blockera_one_should_enqueue_companion_plugin_assets(): bool {
		if ( blockera_one_get_companion_plugin_status() === 'active' ) {
			return false;
		}

		return current_user_can( 'install_plugins' ) || current_user_can( 'activate_plugins' );
	}
endif;

if ( ! function_exists( 'blockera_one_get_companion_plugin_config' ) ) :
	/**
	 * Companion plugin config exposed to JavaScript.
	 *
	 * @return array<string, mixed>
	 */
	function blockera_one_get_companion_plugin_config(): array {
		return array(
			'slug'         => 'blockera',
			'plugin'       => 'blockera/blockera.php',
			'name'         => 'Blockera Site Builder',
			'status'       => blockera_one_get_companion_plugin_status(),
			'canInstall'   => current_user_can( 'install_plugins' ),
			'canActivate'  => current_user_can( 'activate_plugins' ),
		);
	}
endif;

if ( ! function_exists( 'blockera_one_enqueue_companion_plugin_assets' ) ) :
	/**
	 * Enqueue WordPress updates script and companion plugin config.
	 *
	 * @return void
	 */
	function blockera_one_enqueue_companion_plugin_assets(): void {
		if ( ! blockera_one_should_enqueue_companion_plugin_assets() ) {
			return;
		}

		wp_enqueue_script( 'updates' );

		$inline_script = 'window.blockeraCompanionPlugin = ' . wp_json_encode(
			blockera_one_get_companion_plugin_config()
		) . ';';

		if ( wp_script_is( 'wp-blocks', 'enqueued' ) || wp_script_is( 'wp-blocks', 'registered' ) ) {
			wp_add_inline_script( 'wp-blocks', $inline_script, 'before' );
			return;
		}

		wp_add_inline_script( 'updates', $inline_script, 'before' );
	}
endif;

if ( ! function_exists( 'blockera_one_register_companion_plugin_hooks' ) ) :
	/**
	 * Register companion plugin asset hooks.
	 *
	 * @return void
	 */
	function blockera_one_register_companion_plugin_hooks(): void {
		add_action( 'enqueue_block_editor_assets', 'blockera_one_enqueue_companion_plugin_assets', 5 );
		add_action( 'admin_enqueue_scripts', 'blockera_one_enqueue_companion_plugin_assets', 5 );
	}
endif;

if ( ! function_exists( 'blockera_one_get_theme_root_path' ) ) :
	/**
	 * Theme root filesystem path with trailing slash.
	 *
	 * Companion plugin defines BLOCKERA_SB_PATH as the plugin directory, so
	 * theme dist lookups must use the theme root — not those constants.
	 *
	 * @return string
	 */
	function blockera_one_get_theme_root_path(): string {
		return trailingslashit( get_template_directory() );
	}
endif;

if ( ! function_exists( 'blockera_one_get_theme_root_url' ) ) :
	/**
	 * Theme root URL with trailing slash.
	 *
	 * @return string
	 */
	function blockera_one_get_theme_root_url(): string {
		return trailingslashit( get_template_directory_uri() );
	}
endif;

if ( ! function_exists( 'blockera_one_is_one_named_package' ) ) :
	/**
	 * Whether an asset slug matches the theme `*-one` package pattern.
	 *
	 * Matches `blockera-one` and follow-on entries such as `blockera-one-styles`.
	 *
	 * @param string $name Asset / package slug from config/assets.php.
	 *
	 * @return bool
	 */
	function blockera_one_is_one_named_package( string $name ): bool {
		return str_ends_with( $name, '-one' ) || str_contains( $name, '-one-' );
	}
endif;

if ( ! function_exists( 'blockera_one_get_one_named_editor_assets' ) ) :
	/**
	 * Editor asset slugs from the theme config that match `*-one`.
	 *
	 * Cached per request — config/assets.php is a small include, not a glob.
	 *
	 * @return string[]
	 */
	function blockera_one_get_one_named_editor_assets(): array {
		static $cached = null;

		if ( null !== $cached ) {
			return $cached;
		}

		$config_file = blockera_one_get_theme_root_path() . 'config/assets.php';
		if ( ! is_readable( $config_file ) ) {
			$cached = array();
			return $cached;
		}

		$config      = include $config_file;
		$editor_list = is_array( $config ) ? ( $config['editor']['list'] ?? array() ) : array();
		$cached      = array();

		if ( ! is_array( $editor_list ) ) {
			return $cached;
		}

		foreach ( $editor_list as $name ) {
			if ( ! is_string( $name ) || ! blockera_one_is_one_named_package( $name ) ) {
				continue;
			}

			$cached[] = $name;
		}

		return $cached;
	}
endif;

if ( ! function_exists( 'blockera_one_get_product_details' ) ) :
	/**
	 * Blockera One theme product details for the products registry.
	 *
	 * Shape follows blockera/products `product-details.schema.json`.
	 * Details are read from the theme headers so version bumps need no code change.
	 *
	 * @return array<string, mixed>
	 */
	function blockera_one_get_product_details(): array {
		$theme = wp_get_theme( get_template() );

		return array(
			'name'        => $theme->get( 'Name' ) ?: 'Blockera One',
			'description' => $theme->get( 'Description' ) ?: '',
			'slug'        => get_template(),
			'version'     => $theme->get( 'Version' ) ?: '0.0.0',
			'type'        => 'theme',
			// This code only runs while the theme is the active template.
			'status'      => 'active',
			'isCompanion' => false,
			'author'      => $theme->get( 'Author' ) ?: '',
			'homepage'    => $theme->get( 'ThemeURI' ) ?: '',
			'requires'    => array(
				'wordpress' => $theme->get( 'RequiresWP' ) ?: '',
				'php'       => $theme->get( 'RequiresPHP' ) ?: '',
			),
		);
	}
endif;

if ( ! function_exists( 'blockera_one_register_product' ) ) :
	/**
	 * Register the Blockera One theme into the blockera products registry.
	 *
	 * Hooked on `blockera/products/registry/init` (fires once, on first read
	 * access of the registry) — see packages/blockera-one/php/hooks.php.
	 *
	 * @return void
	 */
	function blockera_one_register_product(): void {
		// The blockera/products package may be absent in stripped-down builds.
		if ( ! function_exists( 'blockera_register_product' ) ) {
			return;
		}

		blockera_register_product( blockera_one_get_product_details() );
	}
endif;

// Only register when WordPress APIs exist. Composer may autoload this file after a
// test prepend defines ABSPATH but before add_action() is available.
if ( function_exists( 'add_action' ) ) {
	blockera_one_register_companion_plugin_hooks();
}
