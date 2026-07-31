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
		add_action( 'init', array( $this, 'registerCategories' ) );
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

		register_block_pattern_category(
			'blockera_one_post-format',
			array(
				'label'       => __( 'Post formats', 'blockera-one' ),
				'description' => __( 'A collection of post format patterns.', 'blockera-one' ),
			)
		);
	}
}
