<?php
/**
 * The application bootstrapper.
 *
 * @package BlockeraOne
 */

global $blockeraOne;

$blockeraOne = new \BlockeraOne\Setup\BlockeraOne();

// LOADING: other bootstrap files ...
if ( ! defined( 'BLOCKERA_ONE_APP_MODE' ) && 'development' === BLOCKERA_ONE_APP_MODE ) {

	// Experimental filter for variables.
	blockera_one_load( 'hooks', [], __DIR__ );
}

$blockeraOne->bootstrap();
