<?php
/**
 * Shared helpers for Blockera One PHP package tests.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests;

use Blockera\Dev\PHPUnit\AppTestCase;
use Blockera\One\Theme\Bootstrap;
use ReflectionClass;

/**
 * Base test case for theme package integration tests.
 */
abstract class TestCase extends AppTestCase {

	/**
	 * Load companion helpers after WordPress boots.
	 *
	 * packages/blockera-one/php/functions.php keeps a hard ABSPATH exit (theme
	 * convention). Composer may also autoload that file early — PHPUnit uses
	 * --prepend so ABSPATH exists before vendor/autoload.php. If helpers are
	 * still missing (files autoload not registered), require them now that WP
	 * has defined ABSPATH.
	 *
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();

		if ( ! function_exists( 'blockera_one_get_companion_plugin_status' ) ) {
			require_once dirname( __DIR__ ) . '/functions.php';
		}

		if ( function_exists( 'blockera_one_register_companion_plugin_hooks' ) ) {
			blockera_one_register_companion_plugin_hooks();
		}
	}

	/**
	 * Reset Bootstrap idempotency flag between scenarios that need a fresh boot.
	 *
	 * @param bool $booted Desired flag value.
	 *
	 * @return void
	 */
	protected function setBootstrapBooted( bool $booted ): void {
		$reflection = new ReflectionClass( Bootstrap::class );
		$property   = $reflection->getProperty( 'booted' );
		$property->setAccessible( true );
		$property->setValue( null, $booted );
	}

	/**
	 * Create and set an administrator as the current user.
	 *
	 * @return int User ID.
	 */
	protected function actingAsAdministrator(): int {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Create and set a subscriber as the current user.
	 *
	 * @return int User ID.
	 */
	protected function actingAsSubscriber(): int {
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		return $user_id;
	}
}
