<?php
/**
 * Small theme features and customizations.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Registers theme feature supports and other small customizations.
 */
class Features {

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'after_setup_theme', array( $this, 'registerSupports' ) );
	}

	/**
	 * Adds theme support for post formats and other feature flags.
	 *
	 * @return void
	 */
	public function registerSupports(): void {
		add_theme_support(
			'post-formats',
			array( 'aside', 'audio', 'chat', 'gallery', 'image', 'link', 'quote', 'status', 'video' )
		);
	}
}
