<?php
/**
 * Blockera One functions and definitions.
 *
 * @link https://github.com/blockeraai/blockera-one
 *
 * @package blockeraai
 * @subpackage blockera-one
 * @since Blockera One 0.1.0
 */

if ( ! function_exists( 'blockera_one_should_load_embedded_blockera' ) ) :
	/**
	 * Whether the theme should bootstrap embedded Blockera.
	 *
	 * @return bool
	 */
	function blockera_one_should_load_embedded_blockera(): bool {
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		// Standalone Blockera Site Builder plugin is active — do not bootstrap twice.
		if ( is_plugin_active( 'blockera/blockera.php' ) ) {
			return false;
		}

		// Blockera bootstrap already ran via another loader.
		if ( function_exists( 'blockera_add_cron_interval' ) ) {
			return false;
		}

		if ( defined( 'BLOCKERA_SB_FILE' ) ) {
			return false;
		}

		return true;
	}
endif;

// Load embedded Blockera only when the standalone plugin is not already active.
if ( blockera_one_should_load_embedded_blockera() ) :
	require_once get_template_directory() . '/blockera.php';
endif;

if ( ! class_exists( \Blockera\One\Theme\Bootstrap::class ) ) {
	require_once get_template_directory() . '/vendor/autoload.php';
}

\Blockera\One\Theme\Bootstrap::boot();
