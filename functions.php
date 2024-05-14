<?php
/**
 * This file adds functions to the Blockera one WordPress theme.
 *
 * @author  Blockera Team
 * @license GNU General Public License v2 or later
 * @link    https://blockera.ai/one-theme/
 */

// security code.
if ( ! defined( 'ABSPATH' ) ) {
	die( 'Access Denied!' );

}

// loading autoloader.
require __DIR__ . '/vendor/autoload.php';

// Env Loading ...
$dotenv = Dotenv\Dotenv::createImmutable( __DIR__ );
$dotenv->safeLoad();

define( 'BLOCKERA_ONE_FILE', __FILE__ );
define( 'BLOCKERA_ONE_URI', get_template_directory_uri() );
define( 'BLOCKERA_ONE_PATH', get_template_directory() . '/' );

### BEGIN AUTO-GENERATED DEFINES
define( 'BLOCKERA_ONE_APP_MODE', 'development' );
### END AUTO-GENERATED DEFINES

/**
 * This hook for extendable setup process from internal or third-party developers.
 *
 * @hook  'blockera/before/setup'
 * @since 1.0.0
 */
do_action( 'blockera-one/before/setup' );

### BEGIN AUTO-GENERATED FRONT CONTROLLERS
/**
 * For developers: Blockera debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that internal developers use of "APP_MODE" env variable with "development" value
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link TODO: please insert link of docs.
 */
if ( blockera_one_config( 'app.mode' ) ) {

	$whoops = new \Whoops\Run();
	$whoops->pushHandler( new \Whoops\Handler\PrettyPageHandler() );
	$whoops->register();
}

require BLOCKERA_ONE_PATH . 'packages/blockera-one/php/app.php';
### END AUTO-GENERATED FRONT CONTROLLERS

/**
 * This hook for extendable setup process from internal or third-party developers.
 *
 * @hook  'blockera-one/after/setup'
 * @since 1.0.0
 */
do_action( 'blockera-one/after/setup' );
