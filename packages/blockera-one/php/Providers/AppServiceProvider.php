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

		add_filter( 'default_wp_template_part_areas',  [ $this, 'template_part_areas' ] );
	}

	/**
	 * After theme setup
	 * 
	 * @hooked `after_setup_theme`
	 * 
	 * @return void
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

	/**
	 * Add a Sidebar template part area
	 * 
	 * @hooked `default_wp_template_part_areas`
	 * 
	 * @param  array $areas Template part areas list
	 * 
	 * @return array
	 */
	function template_part_areas( array $areas ) {

		$areas[] = array(
			'area'        => 'sidebar',
			'area_tag'    => 'section',
			'label'       => __( 'Sidebar', 'blockera-one' ),
			'description' => __( 'The Sidebar template specifies a page area that is available in the Page (With Sidebar) template.', 'blockera-one' ),
			'icon'        => 'sidebar',
		);

		return $areas;
	}
}
