<?php
/**
 * Templates Builder pools for the Singular family (single post + page overlay).
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * Single / page variant pools. Markup lives in `patterns/single/builder-*.php`
 * and `patterns/page/builder-*.php`; chrome, layout, and post-meta reuse the
 * shared helpers (and archive listing restore patterns where stamps match).
 */
class SingleCatalog extends AbstractCatalog {

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
		return 'single';
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
			$this->pageOverlayPools(),
			$this->articlePools(),
			$this->commentsNavPools(),
			$this->postMetaPools(),
			$this->layoutPool( self::THUMBNAIL_DIR ),
			$this->chromeFooterPool( self::THUMBNAIL_DIR )
		);
	}

	/**
	 * Single page-header section and inner-element pools (post-title / excerpt).
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	private function pageHeaderPools(): array {
		return array(
			'page-header'             => array(
				$this->patternVariant(
					'simple',
					__( 'Simple', 'blockera-one' ),
					'blockera-one/builder-single-page-header-simple',
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
					'blockera-one/builder-single-page-header-banner',
					array(
						'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'page-header-banner' ),
						'placement' => array(
							'relativeTo' => 'main',
							'position'   => 'inside-start',
						),
					)
				),
			),
			'page-header-title'       => array(
				$this->patternVariant(
					'default',
					__( 'Title', 'blockera-one' ),
					'blockera-one/builder-single-page-header-title'
				),
			),
			'page-header-description' => array(
				$this->patternVariant(
					'default',
					__( 'Description', 'blockera-one' ),
					'blockera-one/builder-single-page-header-description'
				),
			),
			'page-header-breadcrumbs' => array(
				$this->patternVariant(
					'default',
					__( 'Breadcrumbs', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-breadcrumbs'
				),
			),
		);
	}

	/**
	 * Page overlay design pools (same groups, different pattern markup).
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	private function pageOverlayPools(): array {
		return array(
			'page-page-header' => array(
				$this->patternVariant(
					'simple',
					__( 'Simple', 'blockera-one' ),
					'blockera-one/builder-page-header-simple',
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
					'blockera-one/builder-page-header-banner',
					array(
						'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'page-header-banner' ),
						'placement' => array(
							'relativeTo' => 'main',
							'position'   => 'inside-start',
						),
					)
				),
				$this->patternVariant(
					'no-title',
					__( 'No Title', 'blockera-one' ),
					'blockera-one/builder-page-header-no-title',
					array(
						'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'page-header-default' ),
						'placement' => array(
							'relativeTo' => 'content',
							'position'   => 'inside-start',
						),
					)
				),
			),
			'page-article'     => array(
				$this->patternVariant(
					'default',
					__( 'Default', 'blockera-one' ),
					'blockera-one/builder-page-article-default',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'list' ) )
				),
				$this->patternVariant(
					'wide',
					__( 'Wide', 'blockera-one' ),
					'blockera-one/builder-page-article-wide',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'full-width' ) )
				),
			),
		);
	}

	/**
	 * Article (Content) section and shared post-* restore pools.
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	private function articlePools(): array {
		return array(
			'article'             => array(
				$this->patternVariant(
					'default',
					__( 'Default', 'blockera-one' ),
					'blockera-one/builder-single-article-default',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'list' ) )
				),
				$this->patternVariant(
					'content',
					__( 'Content', 'blockera-one' ),
					'blockera-one/builder-single-article-content',
					array( 'thumbnail' => $this->thumbnail( self::THUMBNAIL_DIR, 'full-width' ) )
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

	/**
	 * Comments and next/prev navigation pools.
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	private function commentsNavPools(): array {
		return array(
			'post-comments'            => array(
				$this->patternVariant(
					'default',
					__( 'Comments', 'blockera-one' ),
					'blockera-one/builder-single-comments'
				),
			),
			'comments-title'           => $this->listingElementPool(
				__( 'Title', 'blockera-one' ),
				'blockera-one/builder-single-comments-title'
			),
			'comment-template'         => $this->listingElementPool(
				__( 'Comment List', 'blockera-one' ),
				'blockera-one/builder-single-comment-template'
			),
			'comments-pagination'      => $this->listingElementPool(
				__( 'Pagination', 'blockera-one' ),
				'blockera-one/builder-single-comments-pagination'
			),
			'comments-form'            => $this->listingElementPool(
				__( 'Comment Form', 'blockera-one' ),
				'blockera-one/builder-single-comments-form'
			),
			'post-navigation'          => array(
				$this->patternVariant(
					'default',
					__( 'Next/Prev Post', 'blockera-one' ),
					'blockera-one/builder-single-post-navigation'
				),
			),
			'post-navigation-previous' => $this->listingElementPool(
				__( 'Previous Post', 'blockera-one' ),
				'blockera-one/builder-single-post-navigation-previous'
			),
			'post-navigation-next'     => $this->listingElementPool(
				__( 'Next Post', 'blockera-one' ),
				'blockera-one/builder-single-post-navigation-next'
			),
		);
	}
}
