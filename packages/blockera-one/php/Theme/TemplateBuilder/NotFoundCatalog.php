<?php
/**
 * Templates Builder pools for the 404 template type.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * 404 variant pools. Markup lives in `patterns/404/builder-*.php`.
 */
class NotFoundCatalog extends AbstractCatalog {

	/**
	 * Thumbnail folder under assets/templates-builder/.
	 */
	private const THUMBNAIL_DIR = 'archive';

	/**
	 * {@inheritDoc}
	 *
	 * @return string
	 */
	public function type(): string {
		return '404';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	public function pools(): array {
		return array_merge(
			$this->chromeHeaderPool( self::THUMBNAIL_DIR ),
			$this->templatePools(),
			$this->layoutPool( self::THUMBNAIL_DIR ),
			$this->chromeFooterPool( self::THUMBNAIL_DIR )
		);
	}

	/**
	 * 404 template section and inner-element pools.
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	private function templatePools(): array {
		return array(
			'404-template'           => array(
				$this->patternVariant(
					'default',
					__( 'Default', 'blockera-one' ),
					'blockera-one/builder-404-template-default',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'list' ) )
				),
				$this->patternVariant(
					'stacked',
					__( 'Stacked', 'blockera-one' ),
					'blockera-one/builder-404-template-stacked',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'full-width' ) )
				),
			),
			'not-found-image'        => $this->listingElementPool(
				__( 'Image', 'blockera-one' ),
				'blockera-one/builder-404-image'
			),
			'not-found-title'        => $this->listingElementPool(
				__( 'Title', 'blockera-one' ),
				'blockera-one/builder-404-title'
			),
			'not-found-description'  => $this->listingElementPool(
				__( 'Description', 'blockera-one' ),
				'blockera-one/builder-404-description'
			),
			'not-found-search'       => $this->listingElementPool(
				__( 'Search Form', 'blockera-one' ),
				'blockera-one/builder-404-search'
			),
		);
	}
}
