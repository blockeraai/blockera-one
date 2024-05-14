<?php
/**
 * The functions Blockera app.
 *
 * @package BlockeraOne
 */

use Blockera\Utils\Env;

if ( ! function_exists( 'blockera_one_config' ) ) {

	/**
	 * Retrieve the config with key param or return all config as array
	 *
	 * @param string $key  the key of config.
	 * @param array  $args the extra arguments.
	 *
	 * @return mixed config value.
	 */
	function blockera_one_config( string $key, array $args = [] ) {

		if ( ! $key ) {

			return false;
		}

		$keyNodes = explode( '.', $key );

		$config_dir = ! empty( $args['root'] ) && file_exists( $args['root'] ) ? $args['root'] : BLOCKERA_ONE_PATH;

		$configIncludes = array(
			'app'         => $config_dir . '/config/app.php',
			'assets'      => $config_dir . '/config/assets.php',
		);

		$firstNode = array_shift( $keyNodes );

		if ( ! $configIncludes[ $firstNode ] ) {

			return false;
		}

		$config = require $configIncludes[ $firstNode ];

		foreach ( $keyNodes as $node ) {

			if ( ! isset( $config[ $node ] ) ) {

				return $config;
			}

			$config = $config[ $node ];
		}

		return $config;
	}
}

if ( ! function_exists( 'blockera_one_env' ) ) {

	/**
	 * Gets the value of an environment variable.
	 *
	 * @param string $key     the key of config.
	 * @param mixed  $default the default value.
	 *
	 * @return mixed
	 */
	function blockera_one_env( string $key, $default = null ) {

		return Env::get( $key, $default );
	}
}

if ( ! function_exists( 'blockera_one_load' ) ) {

	/**
	 * Loading file by path and params.
	 *
	 * @param string $path    the path of file to load.
	 * @param array  $params  the required params to load file data.
	 * @param string $baseDir the path current base directory.
	 *
	 * @return mixed file data on success, false on otherwise!
	 */
	function blockera_one_load( string $path, array $params = [], string $baseDir = '' ) {

		$file = str_replace( '.', DIRECTORY_SEPARATOR, $path ) . '.php';

		$filename = ( empty( $baseDir ) ? __DIR__ : $baseDir ) . '/' . $file;

		if ( ! file_exists( $filename ) ) {

			return false;
		}

		extract( $params );

		return include $filename;
	}
}
