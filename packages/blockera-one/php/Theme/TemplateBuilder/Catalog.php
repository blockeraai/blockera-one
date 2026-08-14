<?php
/**
 * Templates Builder catalog assembler.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * Assembles every registered type catalog, runs the public child-theme
 * filters, and (in dev mode only) validates the result against the catalog
 * schema. The payload shape is documented in
 * `packages/blockera-one/schemas/template-builder-catalog.schema.json` and
 * `packages/blockera-one/js/site-editor/templates-builder/CATALOG.md`.
 */
class Catalog {

	/**
	 * Public filter over the fully assembled catalog (all types).
	 */
	public const FILTER_CATALOG = 'blockera-one/template-builder/catalog';

	/**
	 * Registered type catalogs. Adding a template type = new
	 * `<Type>Catalog extends AbstractCatalog` listed here.
	 *
	 * @var array<int,class-string<AbstractCatalog>>
	 */
	private const TYPE_CATALOGS = array(
		ArchiveCatalog::class,
	);

	/**
	 * Assemble the catalog payload: type → pool → Variant[].
	 *
	 * @return array<string,array<string,array<int,array<string,mixed>>>>
	 */
	public function get(): array {
		$catalog = array();

		foreach ( self::TYPE_CATALOGS as $catalog_class ) {
			$type_catalog = new $catalog_class();
			$type         = $type_catalog->type();

			/**
			 * Filters one template type's variant pools (child-theme API).
			 *
			 * Add, remove, relabel, or reorder variants for a single type.
			 * The first variant of a pool is the toggle-on default.
			 *
			 * @param array  $pools Pool id → Variant[].
			 * @param string $type  Template type id (e.g. `archive`).
			 */
			$pools = apply_filters( self::FILTER_CATALOG . '/' . $type, $type_catalog->pools(), $type );

			$catalog[ $type ] = is_array( $pools ) ? $pools : array();
		}

		/**
		 * Filters the fully assembled Templates Builder catalog (all types).
		 *
		 * Runs after every per-type filter.
		 *
		 * @param array $catalog Type → pool → Variant[].
		 */
		$catalog = apply_filters( self::FILTER_CATALOG, $catalog );

		if ( ! is_array( $catalog ) ) {
			$catalog = array();
		}

		// Schema validation is a pure dev-time aid: production sites skip the
		// schema load and per-variant checks entirely.
		if ( self::shouldValidate() ) {
			$catalog = ( new CatalogValidator() )->validate( $catalog );
		}

		return $catalog;
	}

	/**
	 * Whether dev-mode catalog validation should run.
	 *
	 * `BLOCKERA_SB_MODE` is the theme's own build flag (`development` in the
	 * repo, rewritten to `production` in shipped zips). `wp_is_development_mode`
	 * is the standard WordPress opt-in for child-theme developers running a
	 * production parent build.
	 *
	 * @return bool
	 */
	public static function shouldValidate(): bool {
		if ( defined( 'BLOCKERA_SB_MODE' ) && 'development' === BLOCKERA_SB_MODE ) {
			return true;
		}

		return function_exists( 'wp_is_development_mode' ) && wp_is_development_mode( 'theme' );
	}
}
