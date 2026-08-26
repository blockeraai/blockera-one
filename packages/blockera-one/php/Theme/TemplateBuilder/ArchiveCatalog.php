<?php
/**
 * Default Templates Builder pools for the Archive template type.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * Archive variant pools (moved out of hardcoded JS). Markup lives in
 * `patterns/archive/builder-*.php`, `patterns/post-meta/builder-*.php`, and
 * `parts/*.html` (templatePart kinds); this class only lists the tiles.
 */
class ArchiveCatalog extends AbstractCatalog {

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
		return 'archive';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	public function pools(): array {
		return array_merge(
			$this->chromeHeaderPool( self::THUMBNAIL_DIR ),
			$this->pageHeaderPools(),
			$this->listingPools(),
			$this->postMetaPools(),
			$this->layoutPool( self::THUMBNAIL_DIR ),
			$this->chromeFooterPool( self::THUMBNAIL_DIR )
		);
	}

	/**
	 * Archive page-header section and inner-element pools.
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	private function pageHeaderPools(): array {
		return array(
			'page-header'               => array(
				$this->patternVariant(
					'simple',
					__( 'Simple', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-simple',
					array(
						'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'page-header-default' ),
						'placement' => array(
							'relativeTo' => 'content',
							'position'   => 'inside-start',
						),
					)
				),
				$this->patternVariant(
					'banner',
					__( 'Banner', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-banner',
					array(
						'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'page-header-banner' ),
						'placement' => array(
							'relativeTo' => 'main',
							'position'   => 'inside-start',
						),
					)
				),
			),
			'page-header-title'         => array(
				$this->patternVariant(
					'default',
					__( 'Title', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-title'
				),
			),
			'page-header-description'   => array(
				$this->patternVariant(
					'default',
					__( 'Description', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-description'
				),
			),
			'page-header-breadcrumbs'   => array(
				$this->patternVariant(
					'default',
					__( 'Breadcrumbs', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-breadcrumbs'
				),
			),
			'page-header-search-title'  => array(
				$this->patternVariant(
					'default',
					__( 'Title', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-search-title'
				),
			),
			'page-header-search-form'   => array(
				$this->patternVariant(
					'default',
					__( 'Search Form', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-search-form'
				),
			),
			'page-header-results-count' => array(
				$this->patternVariant(
					'default',
					__( 'Results Count', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-results-count'
				),
			),
			'page-header-search'        => array(
				$this->patternVariant(
					'simple',
					__( 'Simple', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-search-simple',
					array(
						'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'page-header-default' ),
						'placement' => array(
							'relativeTo' => 'content',
							'position'   => 'inside-start',
						),
					)
				),
				$this->patternVariant(
					'banner',
					__( 'Banner', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-search-banner',
					array(
						'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'page-header-banner' ),
						'placement' => array(
							'relativeTo' => 'main',
							'position'   => 'inside-start',
						),
					)
				),
			),
		);
	}

	/**
	 * Posts listing, pagination, and loop-item element pools.
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	private function listingPools(): array {
		return array(
			'posts-listing'       => array(
				$this->patternVariant(
					'list',
					__( 'List', 'blockera-one' ),
					'blockera-one/builder-archive-listing-list',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'list' ) )
				),
				$this->patternVariant(
					'grid-2',
					__( '2 Columns', 'blockera-one' ),
					'blockera-one/builder-archive-listing-grid-2',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'grid-2' ) )
				),
				$this->patternVariant(
					'grid-3',
					__( '3 Columns', 'blockera-one' ),
					'blockera-one/builder-archive-listing-grid-3',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'grid-3' ) )
				),
				$this->patternVariant(
					'full-width',
					__( 'Full Width', 'blockera-one' ),
					'blockera-one/builder-archive-listing-full-width',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'full-width' ) )
				),
			),
			'pagination'          => array(
				$this->patternVariant(
					'standard',
					__( 'Standard Buttons', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-standard',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'pagination-standard' ) )
				),
				$this->disabledVariant(
					'load-more',
					__( 'Load More Ajax Button', 'blockera-one' ),
					array(
						'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'pagination-load-more' ),
						'badge'     => __( 'Coming soon', 'blockera-one' ),
					)
				),
			),
			'pagination-previous' => array(
				$this->patternVariant(
					'default',
					__( 'Previous', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-previous'
				),
			),
			'pagination-next'     => array(
				$this->patternVariant(
					'default',
					__( 'Next', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-next'
				),
			),
			'pagination-numbers'  => array(
				$this->patternVariant(
					'default',
					__( 'Numbers', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-numbers'
				),
			),
			'post-featured-image' => $this->listingElementPool(
				__( 'Featured Image', 'blockera-one' ),
				'blockera-one/builder-archive-listing-featured-image'
			),
			'post-title'          => $this->listingElementPool(
				__( 'Title', 'blockera-one' ),
				'blockera-one/builder-archive-listing-title'
			),
			'post-excerpt'        => $this->listingElementPool(
				__( 'Excerpt', 'blockera-one' ),
				'blockera-one/builder-archive-listing-excerpt'
			),
			'post-content'        => $this->listingElementPool(
				__( 'Content', 'blockera-one' ),
				'blockera-one/builder-archive-listing-content'
			),
			'post-read-more'      => $this->listingElementPool(
				__( 'Read More', 'blockera-one' ),
				'blockera-one/builder-archive-listing-read-more'
			),
		);
	}

}
