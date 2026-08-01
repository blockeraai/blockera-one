<?php
/**
 * Pattern-related theme setup.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Registers pattern categories and other pattern setup.
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
			'blockera_one_page',
			array(
				'label'       => __( 'Pages', 'blockera-one' ),
				'description' => __( 'A collection of full page layouts.', 'blockera-one' ),
			)
		);
	}
}
