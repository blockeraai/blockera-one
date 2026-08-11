<?php
/**
 * Tests for Patterns.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Tests\TestCase;
use Blockera\One\Theme\Patterns;
use WP_Block_Pattern_Categories_Registry;
use WP_Block_Patterns_Registry;

/**
 * Covers Blockera\One\Theme\Patterns.
 */
class PatternsTest extends TestCase {

	/**
	 * Pattern slugs registered during WooCommerce branch tests.
	 *
	 * @var array<int, string>
	 */
	private array $registered_pattern_slugs = array();

	/**
	 * @return void
	 */
	public function tear_down(): void {
		$categories = WP_Block_Pattern_Categories_Registry::get_instance();
		if ( $categories->is_registered( 'blockera_one_page' ) ) {
			$categories->unregister( 'blockera_one_page' );
		}

		$patterns = WP_Block_Patterns_Registry::get_instance();
		foreach ( $this->registered_pattern_slugs as $slug ) {
			if ( $patterns->is_registered( $slug ) ) {
				$patterns->unregister( $slug );
			}
		}
		$this->registered_pattern_slugs = array();

		parent::tear_down();
	}

	/**
	 * @return void
	 */
	public function test_register_hooks(): void {
		$module = new Patterns();
		$module->register();

		$this->assertSame( 10, has_action( 'after_setup_theme', array( $module, 'setup' ) ) );
		$this->assertSame( 10, has_action( 'init', array( $module, 'registerCategories' ) ) );
		$this->assertSame( 10, has_action( 'init', array( $module, 'registerConditionalPatterns' ) ) );
	}

	/**
	 * @return void
	 */
	public function test_setup_removes_core_block_patterns_support(): void {
		add_theme_support( 'core-block-patterns' );
		$this->assertTrue( current_theme_supports( 'core-block-patterns' ) );

		$module = new Patterns();
		$module->setup();

		$this->assertFalse( current_theme_supports( 'core-block-patterns' ) );
	}

	/**
	 * @return void
	 */
	public function test_register_categories_adds_pages_category(): void {
		$module = new Patterns();
		$module->registerCategories();

		$registry = WP_Block_Pattern_Categories_Registry::get_instance();
		$this->assertTrue( $registry->is_registered( 'blockera_one_page' ) );

		$category = $registry->get_registered( 'blockera_one_page' );
		$this->assertSame( 'Pages', $category['label'] );
		$this->assertNotEmpty( $category['description'] );
	}

	/**
	 * @return void
	 */
	public function test_register_conditional_patterns_skips_without_woocommerce(): void {
		if ( class_exists( 'WooCommerce', false ) ) {
			$this->markTestSkipped( 'WooCommerce class already exists in this process.' );
		}

		$before = array_column(
			WP_Block_Patterns_Registry::get_instance()->get_all_registered(),
			'name'
		);

		$module = new Patterns();
		$module->registerConditionalPatterns();

		$after = array_column(
			WP_Block_Patterns_Registry::get_instance()->get_all_registered(),
			'name'
		);

		// Compare names only — core may mutate transient keys like filePath between reads.
		$this->assertSame( $before, $after );
	}

	/**
	 * Must run after the no-WooCommerce branch so class_exists() stays false for that test.
	 *
	 * @depends test_register_conditional_patterns_skips_without_woocommerce
	 *
	 * @return void
	 */
	public function test_register_conditional_patterns_registers_woo_directory(): void {
		require_once dirname( __DIR__, 2 ) . '/test-support/woocommerce-stub.php';

		$module = new Patterns();
		$module->registerConditionalPatterns();

		$registry = WP_Block_Patterns_Registry::get_instance();
		$slug     = 'blockera-one/woo-shop-cta';

		$this->assertTrue(
			$registry->is_registered( $slug ),
			'Expected patterns-woocommerce/woo-shop-cta.php to register.'
		);

		$this->registered_pattern_slugs[] = $slug;
	}
}
