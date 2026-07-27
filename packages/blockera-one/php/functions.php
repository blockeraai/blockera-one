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

blockera_one_register_companion_plugin_hooks();
