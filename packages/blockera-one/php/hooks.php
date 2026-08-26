<?php
/**
 * Companion-mode hooks: inject theme `*-one` editor assets into Blockera.
 *
 * @package blockera-one
 */

use Blockera\Setup\Providers\EditorAssetsProvider;
use Blockera\One\Providers\BlockeraOneEditorAssetsProvider;

if ( ! function_exists( 'blockera_one_register_editor_assets_provider' ) ) :

	/**
	 * Register the theme editor assets provider alongside the companion's.
	 *
	 * Appends rather than replacing {@see EditorAssetsProvider}: Pro already
	 * replaces that class and owns the single AssetsLoader fallback path.
	 *
	 * @param array $providers the previous application providers.
	 *
	 * @return array the filtered application providers.
	 */
	function blockera_one_register_editor_assets_provider( array $providers ): array {
		if ( ! class_exists( EditorAssetsProvider::class ) || ! class_exists( BlockeraOneEditorAssetsProvider::class ) ) {
			return $providers;
		}

		// Already registered (idempotent if the filter runs more than once).
		if ( in_array( BlockeraOneEditorAssetsProvider::class, $providers, true ) ) {
			return $providers;
		}

		$providers[] = BlockeraOneEditorAssetsProvider::class;

		return $providers;
	}
endif;

add_filter( 'blockera.application.providers', 'blockera_one_register_editor_assets_provider' );

// Companion-only fallback when functions.php was autoloaded before add_action().
if ( function_exists( 'blockera_one_register_product_hooks' ) ) {
	blockera_one_register_product_hooks();
} else {
	add_action( 'blockera/products/registry/init', 'blockera_one_register_product' );
}
