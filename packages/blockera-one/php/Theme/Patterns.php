<?php
/**
 * Pattern-related theme setup.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

use Blockera\WordPress\Patterns\DirectoryRegistrar;

/**
 * Registers pattern categories and conditional pattern directories.
 */
class Patterns {

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'after_setup_theme', array( $this, 'setup' ) );
		add_action( 'init', array( $this, 'registerCategories' ) );
		add_action( 'init', array( $this, 'registerConditionalPatterns' ) );
	}

	/**
	 * Theme setup for patterns.
	 *
	 * @return void
	 */
	public function setup(): void {
		// Remove core block patterns so the inserter only shows theme patterns.
		remove_theme_support( 'core-block-patterns' );
	}

	/**
	 * Registers pattern categories used by theme patterns.
	 *
	 * @return void
	 */
	public function registerCategories(): void {
		register_block_pattern_category(
			'blockera-one/page',
			array(
				'label'       => __( 'Pages', 'blockera-one' ),
				'description' => __( 'A collection of full page layouts.', 'blockera-one' ),
			)
		);

		register_block_pattern_category(
			'blockera-one/template-builder',
			array(
				'label'       => __( 'Templates Builder', 'blockera-one' ),
				'description' => __( 'Hidden variants used by the Blockera One Templates Builder.', 'blockera-one' ),
			)
		);
	}

	/**
	 * Registers conditional pattern directories (outside core patterns/).
	 *
	 * Core still auto-registers theme patterns/. Extra folders are registered
	 * here only when their condition is met.
	 *
	 * @return void
	 */
	public function registerConditionalPatterns(): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}

		$theme = wp_get_theme();

		( new DirectoryRegistrar() )->register(
			get_template_directory() . '/patterns-woocommerce',
			array(
				'text_domain' => 'blockera-one',
				'version'     => (string) $theme->get( 'Version' ),
			)
		);
	}
}
