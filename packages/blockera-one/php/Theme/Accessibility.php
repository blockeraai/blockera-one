<?php
/**
 * Front-end accessibility helpers for theme review compliance.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Enqueues block styles and theme supports required for skip links and navigation.
 */
class Accessibility {

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'after_setup_theme', array( $this, 'addThemeSupport' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueueBlockStyles' ), 11 );
	}

	/**
	 * Enable bundled core block styles (navigation submenu interactions).
	 *
	 * @return void
	 */
	public function addThemeSupport(): void {
		add_theme_support( 'wp-block-styles' );
	}

	/**
	 * Ensure navigation block CSS loads on the front end for keyboard submenu behavior.
	 *
	 * @return void
	 */
	public function enqueueBlockStyles(): void {
		if ( is_admin() ) {
			return;
		}

		wp_enqueue_style( 'wp-block-navigation' );
	}
}
