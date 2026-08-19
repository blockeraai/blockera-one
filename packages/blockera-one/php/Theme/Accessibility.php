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
		add_action( 'wp_body_open', array( $this, 'printSkipLinks' ), 1 );
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

	/**
	 * Print WordPress theme review skip link markup.
	 *
	 * Theme Review expects the anchor with id `wp-skip-link` and href
	 * `#wp--skip-link--target` to exist as the first tabbable element.
	 *
	 * @return void
	 */
	public function printSkipLinks(): void {
		static $printed = false;
		if ( $printed || is_admin() ) {
			return;
		}

		$printed = true;

		// Theme Review: https://github.com/WordPress/theme-review-action/blob/trunk/docs/ui-warnings.md#should-have-skip-links
		echo '<a class="skip-link screen-reader-text" id="wp-skip-link" href="#wp--skip-link--target">' .
			esc_html__( 'Skip to content', 'blockera-one' ) .
		'</a>';
		echo '<div id="wp--skip-link--target" tabindex="-1"></div>';
	}
}
