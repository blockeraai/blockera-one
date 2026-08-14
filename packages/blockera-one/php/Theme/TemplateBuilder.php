<?php
/**
 * Templates Builder theme module.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

use Blockera\One\Theme\TemplateBuilder\Catalog;

/**
 * Exposes the PHP variant catalog to the Site Editor JS
 * (`window.blockeraOneTemplateBuilder`). Pattern HTML is intentionally NOT
 * part of this payload — JS resolves markup from the core patterns store.
 */
class TemplateBuilder {

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueueCatalog' ) );
	}

	/**
	 * Print the catalog payload before wp-core-data on the Site Editor
	 * screen only (the Templates Builder panel exists nowhere else).
	 *
	 * @return void
	 */
	public function enqueueCatalog(): void {
		if ( ! is_admin() || ! function_exists( 'get_current_screen' ) ) {
			return;
		}

		$screen = get_current_screen();

		if ( ! $screen || 'site-editor' !== $screen->id ) {
			return;
		}

		wp_add_inline_script(
			'wp-core-data',
			'window.blockeraOneTemplateBuilder = ' . wp_json_encode( array( 'catalog' => ( new Catalog() )->get() ) ) . ';',
			'before'
		);
	}
}
