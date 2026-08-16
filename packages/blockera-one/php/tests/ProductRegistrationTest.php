<?php
/**
 * Integration tests for the theme product registration into blockera/products.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests;

use Blockera\Products\Registry;
use ReflectionProperty;

/**
 * Covers blockera_one_get_product_details() / blockera_one_register_product()
 * and the `blockera/products/registry/init` wiring in php/hooks.php.
 */
class ProductRegistrationTest extends TestCase {

	/**
	 * Load the products registrant helpers and start from a clean registry.
	 *
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();

		$this->resetProductsRegistry();
	}

	/**
	 * Leave a clean registry for other suites.
	 *
	 * @return void
	 */
	public function tear_down(): void {
		$this->resetProductsRegistry();

		parent::tear_down();
	}

	/**
	 * Reset the products Registry singleton (private static instance).
	 *
	 * @return void
	 */
	private function resetProductsRegistry(): void {
		$property = new ReflectionProperty( Registry::class, 'instance' );
		$property->setAccessible( true );
		$property->setValue( null, null );
	}

	/**
	 * Product details must follow product-details.schema.json and mirror theme headers.
	 *
	 * @return void
	 */
	public function test_product_details_shape(): void {
		$details = blockera_one_get_product_details();
		$theme   = wp_get_theme( get_template() );

		$this->assertSame( get_template(), $details['slug'] );
		$this->assertSame( 'theme', $details['type'] );
		$this->assertSame( 'active', $details['status'] );
		$this->assertFalse( $details['isCompanion'] );
		$this->assertSame( $theme->get( 'Version' ) ?: '0.0.0', $details['version'] );
		$this->assertSame( $theme->get( 'Name' ) ?: 'Blockera One', $details['name'] );

		// Required schema keys must all be present.
		foreach ( array( 'name', 'slug', 'version', 'type', 'status', 'isCompanion' ) as $key ) {
			$this->assertArrayHasKey( $key, $details );
		}
	}

	/**
	 * The registrant must store a valid product into the registry.
	 *
	 * @return void
	 */
	public function test_registrant_stores_theme_product(): void {
		blockera_one_register_product();

		$product = blockera_get_product( get_template() );

		$this->assertIsArray( $product );
		$this->assertSame( blockera_one_get_product_details(), $product );
	}

	/**
	 * hooks.php must wire the registrant so lazy registry access includes the theme.
	 *
	 * @return void
	 */
	public function test_lazy_registration_via_registry_init_action(): void {
		require_once dirname( __DIR__ ) . '/hooks.php';

		$this->assertNotFalse( has_action( 'blockera/products/registry/init', 'blockera_one_register_product' ) );

		// First read access fires the init action which registers the theme.
		$products = blockera_get_products();

		$this->assertArrayHasKey( get_template(), $products );
		$this->assertSame( 'theme', $products[ get_template() ]['type'] );

		// The theme product must also appear in the localized payload.
		$payload = blockera_products_localize();
		$this->assertArrayHasKey( get_template(), $payload['products'] );
	}
}
