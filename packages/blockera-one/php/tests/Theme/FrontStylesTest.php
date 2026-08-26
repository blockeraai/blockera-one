<?php
/**
 * Tests for FrontStyles.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Tests\TestCase;
use Blockera\One\Theme\FrontStyles;

/**
 * Covers Blockera\One\Theme\FrontStyles.
 */
class FrontStylesTest extends TestCase {

	/**
	 * Style handle under test.
	 */
	private const HANDLE = 'blockera-one-style';

	/**
	 * @return void
	 */
	public function tear_down(): void {
		remove_all_filters( 'blockera_one_front_styles_script_debug' );
		wp_dequeue_style( self::HANDLE );
		wp_deregister_style( self::HANDLE );

		parent::tear_down();
	}

	/**
	 * @return void
	 */
	public function test_register_hooks_wp_enqueue_scripts(): void {
		$module = new FrontStyles();
		$module->register();

		$this->assertSame( 10, has_action( 'wp_enqueue_scripts', array( $module, 'enqueue' ) ) );
	}

	/**
	 * @return void
	 */
	public function test_enqueue_registers_minified_style_by_default(): void {
		add_filter( 'blockera_one_front_styles_script_debug', '__return_false' );

		$module = new FrontStyles();
		$module->enqueue();

		$this->assertTrue( wp_style_is( self::HANDLE, 'enqueued' ) );

		$registered = wp_styles()->registered[ self::HANDLE ];
		$this->assertStringContainsString( 'style.min.css', $registered->src );

		$path = wp_styles()->get_data( self::HANDLE, 'path' );
		$this->assertIsString( $path );
		$this->assertStringEndsWith( 'style.min.css', $path );
	}

	/**
	 * @return void
	 */
	public function test_enqueue_registers_unminified_style_when_script_debug_enabled(): void {
		add_filter( 'blockera_one_front_styles_script_debug', '__return_true' );

		$module = new FrontStyles();
		$module->enqueue();

		$this->assertTrue( wp_style_is( self::HANDLE, 'enqueued' ) );

		$registered = wp_styles()->registered[ self::HANDLE ];
		$this->assertMatchesRegularExpression( '/style\.css(\?|$)/', $registered->src );
		$this->assertStringNotContainsString( 'style.min.css', $registered->src );

		$path = wp_styles()->get_data( self::HANDLE, 'path' );
		$this->assertIsString( $path );
		$this->assertStringEndsWith( 'style.css', $path );
	}
}
