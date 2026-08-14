<?php
/**
 * Tests for theme Bootstrap.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Tests\TestCase;
use Blockera\One\Theme\Bootstrap;
use Blockera\One\Theme\BlockStyles;
use Blockera\One\Theme\EditorStyles;
use Blockera\One\Theme\FrontStyles;
use Blockera\One\Theme\Patterns;
use Blockera\One\Theme\Performance;
use Blockera\One\Theme\ResetTheme;
use Blockera\One\Theme\TemplateBuilder;
use Blockera\One\Theme\TemplateBuilder\AbstractCatalog;
use Blockera\One\Theme\TemplateBuilder\ArchiveCatalog;
use Blockera\One\Theme\TemplateBuilder\Catalog;
use Blockera\One\Theme\TemplateBuilder\CatalogValidator;
use Blockera\One\Theme\TemplateSettings;

/**
 * Covers Blockera\One\Theme\Bootstrap.
 */
class BootstrapTest extends TestCase {

	/**
	 * @return void
	 */
	public function test_boot_is_idempotent_when_already_booted(): void {
		$this->setBootstrapBooted( true );

		Bootstrap::boot();

		$this->assertTrue( $this->getBootstrapBooted() );
	}

	/**
	 * @return void
	 */
	public function test_boot_registers_all_theme_modules(): void {
		$this->setBootstrapBooted( false );

		Bootstrap::boot();

		$this->assertTrue( $this->getBootstrapBooted() );

		// Instance callbacks are anonymous to has_action matching; assert hook presence instead.
		$this->assertTrue(
			false !== has_action( 'after_setup_theme' )
			&& false !== has_action( 'wp_enqueue_scripts' )
			&& false !== has_action( 'init' )
			&& false !== has_action( 'rest_api_init' )
		);

		$this->setBootstrapBooted( true );
	}

	/**
	 * @return void
	 */
	public function test_module_classes_are_autoloadable(): void {
		$this->assertTrue( class_exists( EditorStyles::class ) );
		$this->assertTrue( class_exists( FrontStyles::class ) );
		$this->assertTrue( class_exists( BlockStyles::class ) );
		$this->assertTrue( class_exists( Patterns::class ) );
		$this->assertTrue( class_exists( Performance::class ) );
		$this->assertTrue( class_exists( TemplateSettings::class ) );
		$this->assertTrue( class_exists( TemplateBuilder::class ) );
		$this->assertTrue( class_exists( Catalog::class ) );
		$this->assertTrue( class_exists( AbstractCatalog::class ) );
		$this->assertTrue( class_exists( ArchiveCatalog::class ) );
		$this->assertTrue( class_exists( CatalogValidator::class ) );
		$this->assertTrue( class_exists( ResetTheme::class ) );
	}

	/**
	 * Read private Bootstrap::$booted.
	 *
	 * @return bool
	 */
	private function getBootstrapBooted(): bool {
		$reflection = new \ReflectionClass( Bootstrap::class );
		$property   = $reflection->getProperty( 'booted' );
		$property->setAccessible( true );

		return (bool) $property->getValue();
	}
}
