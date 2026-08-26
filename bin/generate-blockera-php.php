#!/usr/bin/env php
<?php

/**
 * Generates the production (theme build) version of `blockera.php` or `functions.php`.
 *
 * Pass the target filename as the first argument (default: `blockera.php`).
 * - `blockera.php`: production defines + `inc/app.php` front controller.
 * - `functions.php`: shared autoloader from `inc/bootstrap.php`.
 *
 * @package blockera-build
 */

$root            = dirname( __DIR__ );
$target          = isset( $argv[1] ) ? basename( (string) $argv[1] ) : 'blockera.php';
$allowed_targets = array(
	'blockera.php',
	'functions.php',
);

if ( ! in_array( $target, $allowed_targets, true ) ) {
	fwrite( STDERR, "Unsupported generate target: {$target}\n" );
	exit( 1 );
}

$f = fopen( $root . '/' . $target, 'r' );

if ( false === $f ) {
	fwrite( STDERR, "Could not read {$target}\n" );
	exit( 1 );
}

$theme_version = null;
$inside_block  = false;

/**
 * Read theme version from style.css header.
 *
 * @return string
 */
function blockera_one_read_theme_version(): string {
	$style = dirname( __DIR__ ) . '/style.css';
	$css   = file_get_contents( $style );

	if ( false === $css ) {
		return '0.0.0';
	}

	// style.css theme headers are plain `Version:` lines (not `* Version:`).
	if ( preg_match( '/^Version:\s*([0-9.]+)/mi', $css, $matches ) ) {
		return $matches[1];
	}

	return '0.0.0';
}

/**
 * Prints `define` statements for the production version of `blockera.php`.
 */
function print_production_defines() {
	global $theme_version;

	$version    = $theme_version ?: blockera_one_read_theme_version();
	$git_commit = trim( (string) shell_exec( 'git rev-parse HEAD' ) );

	echo "if (! defined('BLOCKERA_SB_VERSION')) { define( 'BLOCKERA_SB_VERSION', '{$version}' ); }\n";
	echo "if (! defined('BLOCKERA_SB_MODE')) { define( 'BLOCKERA_SB_MODE', 'production' ); }\n";
	echo "if (! defined('BLOCKERA_GIT_COMMIT')) { define( 'BLOCKERA_GIT_COMMIT', '{$git_commit}' ); }\n";
}

$theme_version = blockera_one_read_theme_version();

while ( true ) {
	$line = fgets( $f );
	if ( false === $line ) {
		break;
	}

	switch ( trim( $line ) ) {
		case '### BEGIN AUTO-GENERATED DEFINES':
			$inside_block = true;
			echo $line;
			print_production_defines();
			break;

		case '### END AUTO-GENERATED DEFINES':
		case '### END AUTO-GENERATED FRONT CONTROLLERS':
		case '### END AUTO-GENERATED AUTOLOADER':
			$inside_block = false;
			echo $line;
			break;

		case '### BEGIN AUTO-GENERATED FRONT CONTROLLERS':
			$inside_block = true;
			echo $line;
			echo "\trequire BLOCKERA_SB_PATH . 'inc/app.php';\n";
			break;

		case '### BEGIN AUTO-GENERATED AUTOLOADER':
			$inside_block = true;
			echo $line;
			echo <<<'PHP'
require_once __DIR__ . '/inc/bootstrap.php';
blockera_bootstrap_shared_autoloader(
	'blockera-one',
	__DIR__,
	[
		'priority'         => 10,
		'default'          => blockera_one_should_load_embedded_blockera(),
		'file'             => __FILE__,
		'type'             => 'theme',
		'theme_stylesheet' => 'blockera-one',
		'entry_constant'   => 'BLOCKERA_SB_FILE',
		'companions'       => [
			[
				'slug'           => 'blockera',
				'plugin_file'    => 'blockera/blockera.php',
				'entry_constant' => 'BLOCKERA_SB_FILE',
			],
			[
				'slug'           => 'blockera-pro',
				'plugin_file'    => 'blockera-pro/blockera-pro.php',
				'entry_constant' => 'BLOCKERA_PRO_FILE',
			],
		],
	]
);

PHP;
			break;

		default:
			if ( ! $inside_block ) {
				echo $line;
			}
			break;
	}
}

fclose( $f );
