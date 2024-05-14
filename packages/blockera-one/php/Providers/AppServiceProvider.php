<?php

namespace BlockeraOne\Setup\Providers;

use Blockera\Exceptions\BaseException;
use Blockera\Bootstrap\ServiceProvider;

/**
 * Class AppServiceProvider for providing all application services.
 */
class AppServiceProvider extends ServiceProvider {

	/**
	 * Bootstrap services.
	 *
	 * @return void
	 */
	public function boot(): void {

		parent::boot();

		add_action( 'init', [ $this, 'loadTextDomain' ] );

		add_action( 'after_setup_theme', [ $this, 'after_setup_theme' ] );
	}

	/**
	 * After theme setup
	 */
	public function after_setup_theme(): void {

		// Enqueue editor styles and fonts.
		add_editor_style( 'style.css' );

		// Remove core block patterns.
		remove_theme_support( 'core-block-patterns' );
	}


	/**
	 * Loading text domain.
	 *
	 * @hooked `init`
	 *
	 * @return void
	 */
	public function loadTextDomain(): void {

		load_plugin_textdomain( 'blockera-one', false, BLOCKERA_ONE_PATH . '/languages' );
	}

}
