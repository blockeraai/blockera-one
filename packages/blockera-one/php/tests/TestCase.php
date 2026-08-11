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
