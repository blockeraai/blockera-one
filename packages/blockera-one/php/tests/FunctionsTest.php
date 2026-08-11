<?php
/**
 * Integration tests for companion plugin helpers.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests;

/**
 * Covers packages/blockera-one/php/functions.php.
 */
class FunctionsTest extends TestCase {

	/**
	 * Relative companion plugin file used by helpers.
	 */
	private const PLUGIN_FILE = 'blockera/blockera.php';

	/**
	 * Whether this test created a stub plugin file.
	 *
	 * @var bool
	 */
	private bool $created_stub_plugin = false;

	/**
	 * Absolute path to stub plugin file when created.
	 *
	 * @var string|null
	 */
	private ?string $stub_plugin_path = null;

	/**
	 * Clean stub plugin / activation state after each test.
	 *
	 * @return void
	 */
	public function tear_down(): void {
		if ( function_exists( 'deactivate_plugins' ) ) {
			deactivate_plugins( self::PLUGIN_FILE, true );
		}

		if ( $this->created_stub_plugin && is_string( $this->stub_plugin_path ) && file_exists( $this->stub_plugin_path ) ) {
			unlink( $this->stub_plugin_path );
			$stub_dir = dirname( $this->stub_plugin_path );
			if ( is_dir( $stub_dir ) && 2 === count( scandir( $stub_dir ) ) ) {
				rmdir( $stub_dir );
			}
		}

		$this->created_stub_plugin = false;
		$this->stub_plugin_path    = null;

		wp_scripts()->remove( 'updates' );
		wp_scripts()->remove( 'wp-blocks' );

		parent::tear_down();
	}

	/**
	 * functions.php must hard-exit when loaded outside WordPress (no ABSPATH).
	 *
	 * @return void
	 */
	public function test_functions_file_exits_when_abspath_undefined(): void {
		$file = dirname( __DIR__ ) . '/functions.php';
		$this->assertFileExists( $file );

		$script = 'if ( defined( "ABSPATH" ) ) { fwrite( STDERR, "ABSPATH already defined" . PHP_EOL ); exit( 2 ); }'
			. ' include ' . var_export( $file, true ) . ';'
			. ' fwrite( STDERR, "functions.php did not exit" . PHP_EOL ); exit( 3 );';

		$cmd = escapeshellarg( PHP_BINARY ) . ' -r ' . escapeshellarg( $script );
		exec( $cmd, $output, $exit_code );

		$this->assertSame(
			0,
			$exit_code,
			'Expected functions.php ABSPATH guard to exit(0); stderr/output: ' . implode( "\n", $output )
		);
	}

	/**
	 * With ABSPATH + add_action stubs, helpers become available (Composer autoload path).
	 *
	 * @return void
	 */
	public function test_functions_file_loads_helpers_when_abspath_defined(): void {
		$file = dirname( __DIR__ ) . '/functions.php';
		$this->assertFileExists( $file );

		$script = 'if ( ! function_exists( "add_action" ) ) { function add_action( ...$args ) { return true; } }'
			. ' if ( ! defined( "ABSPATH" ) ) { define( "ABSPATH", "/tmp/" ); }'
			. ' include ' . var_export( $file, true ) . ';'
			. ' exit( function_exists( "blockera_one_get_companion_plugin_status" ) ? 0 : 4 );';

		$cmd = escapeshellarg( PHP_BINARY ) . ' -r ' . escapeshellarg( $script );
		exec( $cmd, $output, $exit_code );

		$this->assertSame(
			0,
			$exit_code,
			'Expected helpers to load when ABSPATH is defined; output: ' . implode( "\n", $output )
		);
	}

	/**
	 * @return void
	 */
	public function test_get_companion_plugin_status_not_installed(): void {
		$this->removeCompanionPluginIfStub();

		if ( file_exists( WP_PLUGIN_DIR . '/' . self::PLUGIN_FILE ) ) {
			$this->markTestSkipped( 'Standalone Blockera plugin is present in this environment.' );
		}

		$this->assertSame( 'not-installed', blockera_one_get_companion_plugin_status() );
	}

	/**
	 * @return void
	 */
	public function test_get_companion_plugin_status_inactive(): void {
		$this->ensureStubCompanionPlugin();

		if ( function_exists( 'deactivate_plugins' ) ) {
			deactivate_plugins( self::PLUGIN_FILE, true );
		}

		$this->assertSame( 'inactive', blockera_one_get_companion_plugin_status() );
	}

	/**
	 * @return void
	 */
	public function test_get_companion_plugin_status_active(): void {
		$this->ensureStubCompanionPlugin();
		$this->actingAsAdministrator();

		$result = activate_plugin( self::PLUGIN_FILE );
		$this->assertFalse( is_wp_error( $result ), is_wp_error( $result ) ? $result->get_error_message() : '' );

		$this->assertSame( 'active', blockera_one_get_companion_plugin_status() );
	}

	/**
	 * @return void
	 */
	public function test_should_enqueue_companion_plugin_assets_false_when_active(): void {
		$this->ensureStubCompanionPlugin();
		$this->actingAsAdministrator();
		activate_plugin( self::PLUGIN_FILE );

		$this->assertFalse( blockera_one_should_enqueue_companion_plugin_assets() );
	}

	/**
	 * @return void
	 */
	public function test_should_enqueue_companion_plugin_assets_true_for_capable_user(): void {
		$this->removeCompanionPluginIfStub();
		$this->actingAsAdministrator();

		if ( file_exists( WP_PLUGIN_DIR . '/' . self::PLUGIN_FILE ) && is_plugin_active( self::PLUGIN_FILE ) ) {
			$this->markTestSkipped( 'Companion plugin is already active.' );
		}

		$this->assertTrue( blockera_one_should_enqueue_companion_plugin_assets() );
	}

	/**
	 * @return void
	 */
	public function test_should_enqueue_companion_plugin_assets_false_without_caps(): void {
		$this->removeCompanionPluginIfStub();
		$this->actingAsSubscriber();

		if ( file_exists( WP_PLUGIN_DIR . '/' . self::PLUGIN_FILE ) && is_plugin_active( self::PLUGIN_FILE ) ) {
			$this->markTestSkipped( 'Companion plugin is already active.' );
		}

		$this->assertFalse( blockera_one_should_enqueue_companion_plugin_assets() );
	}

	/**
	 * @return void
	 */
	public function test_get_companion_plugin_config_shape(): void {
		$this->actingAsAdministrator();

		$config = blockera_one_get_companion_plugin_config();

		$this->assertSame( 'blockera', $config['slug'] );
		$this->assertSame( self::PLUGIN_FILE, $config['plugin'] );
		$this->assertSame( 'Blockera Site Builder', $config['name'] );
		$this->assertArrayHasKey( 'status', $config );
		$this->assertTrue( $config['canInstall'] );
		$this->assertTrue( $config['canActivate'] );
	}

	/**
	 * @return void
	 */
	public function test_enqueue_companion_plugin_assets_noop_when_disabled(): void {
		$this->ensureStubCompanionPlugin();
		$this->actingAsAdministrator();
		activate_plugin( self::PLUGIN_FILE );

		blockera_one_enqueue_companion_plugin_assets();

		$this->assertFalse( wp_script_is( 'updates', 'enqueued' ) );
	}

	/**
	 * @return void
	 */
	public function test_enqueue_companion_plugin_assets_adds_inline_to_updates(): void {
		$this->removeCompanionPluginIfStub();
		$this->actingAsAdministrator();

		if ( file_exists( WP_PLUGIN_DIR . '/' . self::PLUGIN_FILE ) && is_plugin_active( self::PLUGIN_FILE ) ) {
			$this->markTestSkipped( 'Companion plugin is already active.' );
		}

		wp_register_script( 'updates', false, array(), '1.0', true );

		blockera_one_enqueue_companion_plugin_assets();

		$this->assertTrue( wp_script_is( 'updates', 'enqueued' ) );

		$before = wp_scripts()->get_data( 'updates', 'before' );
		$this->assertIsArray( $before );
		$this->assertNotEmpty( $before );
		$this->assertStringContainsString( 'window.blockeraCompanionPlugin', implode( "\n", $before ) );
	}

	/**
	 * @return void
	 */
	public function test_enqueue_companion_plugin_assets_prefers_wp_blocks_when_registered(): void {
		$this->removeCompanionPluginIfStub();
		$this->actingAsAdministrator();

		if ( file_exists( WP_PLUGIN_DIR . '/' . self::PLUGIN_FILE ) && is_plugin_active( self::PLUGIN_FILE ) ) {
			$this->markTestSkipped( 'Companion plugin is already active.' );
		}

		wp_register_script( 'updates', false, array(), '1.0', true );
		wp_register_script( 'wp-blocks', false, array(), '1.0', true );

		blockera_one_enqueue_companion_plugin_assets();

		$before_blocks = wp_scripts()->get_data( 'wp-blocks', 'before' );
		$this->assertIsArray( $before_blocks );
		$this->assertStringContainsString( 'window.blockeraCompanionPlugin', implode( "\n", $before_blocks ) );
	}

	/**
	 * @return void
	 */
	public function test_register_companion_plugin_hooks_attaches_actions(): void {
		blockera_one_register_companion_plugin_hooks();

		$this->assertNotFalse( has_action( 'enqueue_block_editor_assets', 'blockera_one_enqueue_companion_plugin_assets' ) );
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', 'blockera_one_enqueue_companion_plugin_assets' ) );
	}

	/**
	 * Create a minimal stub companion plugin when the real one is absent.
	 *
	 * @return void
	 */
	private function ensureStubCompanionPlugin(): void {
		$path = WP_PLUGIN_DIR . '/' . self::PLUGIN_FILE;

		if ( file_exists( $path ) ) {
			$this->stub_plugin_path    = $path;
			$this->created_stub_plugin = false;
			return;
		}

		$dir = dirname( $path );
		if ( ! is_dir( $dir ) ) {
			mkdir( $dir, 0777, true );
		}

		file_put_contents(
			$path,
			"<?php\n/**\n * Plugin Name: Blockera Stub\n */\n"
		);

		wp_cache_delete( 'plugins', 'plugins' );
		if ( function_exists( 'wp_clean_plugins_cache' ) ) {
			wp_clean_plugins_cache( false );
		}

		$this->stub_plugin_path    = $path;
		$this->created_stub_plugin = true;
	}

	/**
	 * Remove stub plugin created by this test class (never delete a real install).
	 *
	 * @return void
	 */
	private function removeCompanionPluginIfStub(): void {
		if ( ! $this->created_stub_plugin || ! is_string( $this->stub_plugin_path ) ) {
			return;
		}

		if ( function_exists( 'deactivate_plugins' ) ) {
			deactivate_plugins( self::PLUGIN_FILE, true );
		}

		if ( file_exists( $this->stub_plugin_path ) ) {
			unlink( $this->stub_plugin_path );
		}

		$this->created_stub_plugin = false;
		$this->stub_plugin_path    = null;
	}
}
