<?php
/**
 * Tests for companion-mode *-one editor asset helpers and provider.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests;

use Blockera\One\Providers\BlockeraOneEditorAssetsProvider;
use Blockera\Setup\Providers\EditorAssetsProvider;

/**
 * Covers companion-mode theme editor asset loading.
 */
class EditorAssetsProviderTest extends TestCase {

	/**
	 * Load hooks.php once for this class (registers the providers filter).
	 *
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();

		$hooks = dirname( __DIR__ ) . '/hooks.php';
		if ( is_readable( $hooks ) ) {
			require_once $hooks;
		}
	}

	/**
	 * @return void
	 */
	public function test_is_one_named_package_matches_suffix_and_segment(): void {
		$this->assertTrue( blockera_one_is_one_named_package( 'blockera-one' ) );
		$this->assertTrue( blockera_one_is_one_named_package( 'blockera-one-styles' ) );
		$this->assertFalse( blockera_one_is_one_named_package( 'blockera' ) );
		$this->assertFalse( blockera_one_is_one_named_package( 'icons' ) );
		$this->assertFalse( blockera_one_is_one_named_package( 'someone' ) );
	}

	/**
	 * @return void
	 */
	public function test_get_one_named_editor_assets_reads_theme_config(): void {
		$assets = blockera_one_get_one_named_editor_assets();

		$this->assertContains( 'blockera-one', $assets );
		$this->assertContains( 'blockera-one-styles', $assets );
		$this->assertNotContains( 'blockera', $assets );
		$this->assertNotContains( 'utils', $assets );
		$this->assertNotContains( 'icons', $assets );
	}

	/**
	 * @return void
	 */
	public function test_theme_root_helpers_point_at_theme_not_plugin_constants(): void {
		$path = blockera_one_get_theme_root_path();
		$url  = blockera_one_get_theme_root_url();

		$this->assertStringEndsWith( '/', $path );
		$this->assertStringEndsWith( '/', $url );
		$this->assertStringContainsString( 'blockera-one', $path );
		$this->assertTrue( is_readable( $path . 'config/assets.php' ) );
	}

	/**
	 * @return void
	 */
	public function test_register_editor_assets_provider_appends_without_replacing_core(): void {
		$providers = array( EditorAssetsProvider::class );

		$result = blockera_one_register_editor_assets_provider( $providers );

		$this->assertContains( EditorAssetsProvider::class, $result );
		$this->assertContains( BlockeraOneEditorAssetsProvider::class, $result );
		$this->assertSame( EditorAssetsProvider::class, $result[0] );
	}

	/**
	 * @return void
	 */
	public function test_register_editor_assets_provider_is_idempotent(): void {
		$providers = array(
			EditorAssetsProvider::class,
			BlockeraOneEditorAssetsProvider::class,
		);

		$result = blockera_one_register_editor_assets_provider( $providers );

		$found = 0;
		foreach ( $result as $provider ) {
			if ( BlockeraOneEditorAssetsProvider::class === $provider ) {
				++$found;
			}
		}

		$this->assertSame( 1, $found );
	}

	/**
	 * @return void
	 */
	public function test_hooks_file_registers_providers_filter(): void {
		$this->assertNotFalse(
			has_filter( 'blockera.application.providers', 'blockera_one_register_editor_assets_provider' )
		);
	}

	/**
	 * @return void
	 */
	public function test_provider_id_and_assets_and_fallback(): void {
		$app      = $this->createMock( \Blockera\Bootstrap\Application::class );
		$provider = new BlockeraOneEditorAssetsProvider( $app );

		$this->assertSame( 'blockera-one-assets-loader', $provider->getId() );

		$assets = $this->invokeMethod( $provider, 'getAssets' );
		$this->assertContains( 'blockera-one', $assets );
		$this->assertNotContains( 'blockera', $assets );

		$fallback = $this->invokeMethod( $provider, 'getFallbackArgs' );
		$this->assertSame( blockera_one_get_theme_root_url(), $fallback['url'] );
		$this->assertSame( blockera_one_get_theme_root_path(), $fallback['path'] );
		$this->assertArrayHasKey( 'debug-mode', $fallback );
	}

	/**
	 * @return void
	 */
	public function test_provider_url_and_path_use_theme_root(): void {
		$app      = $this->createMock( \Blockera\Bootstrap\Application::class );
		$provider = new BlockeraOneEditorAssetsProvider( $app );

		$this->assertSame(
			blockera_one_get_theme_root_url(),
			$this->invokeMethod( $provider, 'getURL' )
		);
		$this->assertSame(
			blockera_one_get_theme_root_path(),
			$this->invokeMethod( $provider, 'getPATH' )
		);
	}
}
