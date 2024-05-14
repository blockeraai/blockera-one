<?php
/**
 * Class Blockera to contains all services and entities.
 *
 * @package BlockeraOne
 */

namespace BlockeraOne\Setup;

use Blockera\Bootstrap\Application;

class BlockeraOne extends Application {

	/**
	 * Blockera constructor.
	 */
	public function __construct() {

		/**
		 * This hook for extendable service providers list from internal or third-party developers.
		 *
		 * @hook  'blockera/service/providers'
		 * @since 1.0.0
		 */
		$this->service_providers = apply_filters( 'blockera-one/service/providers', blockera_one_config( 'app.providers' ) );

		// Keep parent functionalities.
		parent::__construct();

	}

}
