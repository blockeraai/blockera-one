<?php
/**
 * Tests for Accessibility.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Tests\TestCase;
use Blockera\One\Theme\Accessibility;

/**
 * Covers Blockera\One\Theme\Accessibility.
 */
class AccessibilityTest extends TestCase {

	/**
	 * @return void
	 */
	public function test_register_hooks(): void {
		$module = new Accessibility();
		$module->register();

		$this->assertSame( 10, has_action( 'after_setup_theme', array( $module, 'addThemeSupport' ) ) );
		$this->assertSame( 11, has_action( 'wp_enqueue_scripts', array( $module, 'enqueueBlockStyles' ) ) );
	}

	/**
	 * @return void
	 */
	public function test_add_theme_support_registers_wp_block_styles(): void {
		$module = new Accessibility();
		$module->addThemeSupport();

		$this->assertTrue( current_theme_supports( 'wp-block-styles' ) );
	}

	/**
	 * @return void
	 */
	public function test_enqueue_block_styles_loads_navigation_css_on_front(): void {
		wp_dequeue_style( 'wp-block-navigation' );
		wp_deregister_style( 'wp-block-navigation' );
		wp_register_style( 'wp-block-navigation', false );

		$module = new Accessibility();
		$module->enqueueBlockStyles();

		$this->assertTrue( wp_style_is( 'wp-block-navigation', 'enqueued' ) );
	}
}
