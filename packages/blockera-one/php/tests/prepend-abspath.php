<?php
/**
 * PHPUnit --prepend bootstrap.
 *
 * Composer autoloads packages/blockera-one/php/functions.php, which exits when
 * ABSPATH is undefined. Define ABSPATH before vendor/autoload.php runs so the
 * WordPress ABSPATH guard can stay in place.
 *
 * @package blockera-one
 */

if ( defined( 'ABSPATH' ) ) {
	return;
}

// wp-env default WordPress root.
if ( is_dir( '/var/www/html/wp-admin' ) ) {
	define( 'ABSPATH', '/var/www/html/' );
	return;
}

// Local checkout: .../wp-content/themes/blockera-one/packages/blockera-one/php/tests
$theme_root = dirname( __DIR__, 4 );
$wp_root    = dirname( $theme_root, 3 );

if ( is_dir( $wp_root . '/wp-admin' ) ) {
	define( 'ABSPATH', rtrim( $wp_root, '/\\' ) . '/' );
	return;
}

fwrite( STDERR, 'blockera-one prepend-abspath: could not resolve WordPress ABSPATH' . PHP_EOL );
exit ( 1 );
