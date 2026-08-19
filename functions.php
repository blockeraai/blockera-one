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

if ( ! function_exists( 'blockera_one_bootstrap_blockera' ) ) :
	/**
	 * Load embedded Blockera or companion-only theme hooks.
	 *
	 * Captures the embedded/companion decision once: loading blockera.php defines
	 * BLOCKERA_SB_FILE, which would flip a second should_load_embedded check.
	 *
	 * @return void
	 */
	function blockera_one_bootstrap_blockera(): void {
		if ( blockera_one_should_load_embedded_blockera() ) {
			require_once __DIR__ . '/blockera.php';
			return;
		}

		// Companion owns Blockera — enqueue theme `*-one` packages from Composer vendor.
		require_once __DIR__ . '/vendor/blockera/blockera-one/php/hooks.php';
	}
endif;

### BEGIN AUTO-GENERATED AUTOLOADER
require_once __DIR__ . '/packages/global-packages/packages/autoloader-coordinator/bootstrap.php';
blockera_bootstrap_shared_autoloader(
	'blockera-one',
	__DIR__,
	[
		'priority'         => 10,
		'default'          => blockera_one_should_load_embedded_blockera(),
		'file'             => __FILE__,
		'type'             => 'theme',
		'theme_stylesheet' => 'blockera-one',
		'entry_constant'   => 'BLOCKERA_SB_FILE',
		'companions'       => [
			[
				'slug'           => 'blockera',
				'plugin_file'    => 'blockera/blockera.php',
				'entry_constant' => 'BLOCKERA_SB_FILE',
			],
			[
				'slug'           => 'blockera-pro',
				'plugin_file'    => 'blockera-pro/blockera-pro.php',
				'entry_constant' => 'BLOCKERA_PRO_FILE',
			],
		],
	]
);
### END AUTO-GENERATED AUTOLOADER

blockera_one_bootstrap_blockera();

\Blockera\One\Theme\Bootstrap::boot();
