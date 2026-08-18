<?php
/**
 * Default Templates Builder pools for the Archive template type.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * Archive variant pools (moved out of hardcoded JS). Markup lives in
 * `patterns/archive/builder-*.php` (pattern kinds) and
 * `parts/*.html` (templatePart kinds); this class only lists the tiles.
 */
class ArchiveCatalog extends AbstractCatalog {

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
		// Chrome placement: stacked parts frame the layout root.
		$before_body = array(
			'relativeTo' => 'archive-body',
			'position'   => 'before',
		);
		$after_body  = array(
			'relativeTo' => 'archive-body',
			'position'   => 'after',
		);

		return array(
			'header'        => array(
				$this->templatePartVariant(
					'header',
					__( 'Default', 'blockera-one' ),
					'header',
					array(
						'area'         => 'header',
						'tagName'      => 'header',
						'thumbnail'    => $this->thumbnail( 'header-default' ),
						'placement'    => $before_body,
						'chromeLayout' => 'stacked',
					)
				),
				$this->templatePartVariant(
					'header-large-title',
					__( 'Large Title', 'blockera-one' ),
					'header-large-title',
					array(
						'area'         => 'header',
						'tagName'      => 'header',
						'thumbnail'    => $this->thumbnail( 'header-large-title' ),
						'placement'    => $before_body,
						'chromeLayout' => 'stacked',
					)
				),
				// Vertical rail has no placement: the pattern ships the whole
				// chrome frame (columns + header part + empty rail-body-area)
				// and the chrome-rail op re-frames the page around it.
				$this->patternVariant(
					'vertical-header',
					__( 'Vertical', 'blockera-one' ),
					'blockera-one/builder-archive-header-vertical',
					array(
						'thumbnail'    => $this->thumbnail( 'header-vertical' ),
						'chromeLayout' => 'vertical-rail',
					)
				),
			),
			'page-header'             => array(
				$this->patternVariant(
					'simple',
					__( 'Simple', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-simple',
					array(
						'thumbnail' => $this->thumbnail( 'page-header-default' ),
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
						'thumbnail' => $this->thumbnail( 'page-header-banner' ),
						'placement' => array(
							'relativeTo' => 'archive-body',
							'position'   => 'inside-start',
						),
					)
				),
			),
			'page-header-title'       => array(
				$this->patternVariant(
					'default',
					__( 'Title', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-title'
				),
			),
			'page-header-description' => array(
				$this->patternVariant(
					'default',
					__( 'Description', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-description'
				),
			),
			'page-header-breadcrumbs' => array(
				$this->patternVariant(
					'default',
					__( 'Breadcrumbs', 'blockera-one' ),
					'blockera-one/builder-archive-page-header-breadcrumbs'
				),
			),
			'posts-listing'          => array(
				$this->patternVariant(
					'list',
					__( 'List', 'blockera-one' ),
					'blockera-one/builder-archive-listing-list',
					array( 'thumbnail' => $this->thumbnail( 'list' ) )
				),
				$this->patternVariant(
					'grid-2',
					__( '2 Columns', 'blockera-one' ),
					'blockera-one/builder-archive-listing-grid-2',
					array( 'thumbnail' => $this->thumbnail( 'grid-2' ) )
				),
				$this->patternVariant(
					'grid-3',
					__( '3 Columns', 'blockera-one' ),
					'blockera-one/builder-archive-listing-grid-3',
					array( 'thumbnail' => $this->thumbnail( 'grid-3' ) )
				),
				$this->patternVariant(
					'full-width',
					__( 'Full Width', 'blockera-one' ),
					'blockera-one/builder-archive-listing-full-width',
					array( 'thumbnail' => $this->thumbnail( 'full-width' ) )
				),
			),
			'pagination'             => array(
				$this->patternVariant(
					'standard',
					__( 'Standard Buttons', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-standard',
					array( 'thumbnail' => $this->thumbnail( 'pagination-standard' ) )
				),
				$this->disabledVariant(
					'load-more',
					__( 'Load More Ajax Button', 'blockera-one' ),
					array(
						'thumbnail' => $this->thumbnail( 'pagination-load-more' ),
						'badge'     => __( 'Coming soon', 'blockera-one' ),
					)
				),
			),
			'pagination-previous'    => array(
				$this->patternVariant(
					'default',
					__( 'Previous', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-previous'
				),
			),
			'pagination-next'        => array(
				$this->patternVariant(
					'default',
					__( 'Next', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-next'
				),
			),
			'pagination-numbers'     => array(
				$this->patternVariant(
					'default',
					__( 'Numbers', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-numbers'
				),
			),
			'post-featured-image'    => $this->listingElementPool(
				__( 'Featured Image', 'blockera-one' ),
				'blockera-one/builder-archive-listing-featured-image'
			),
			'post-title'             => $this->listingElementPool(
				__( 'Title', 'blockera-one' ),
				'blockera-one/builder-archive-listing-title'
			),
			'post-excerpt'           => $this->listingElementPool(
				__( 'Excerpt', 'blockera-one' ),
				'blockera-one/builder-archive-listing-excerpt'
			),
			'post-content'           => $this->listingElementPool(
				__( 'Content', 'blockera-one' ),
				'blockera-one/builder-archive-listing-content'
			),
			'post-read-more'         => $this->listingElementPool(
				__( 'Read More', 'blockera-one' ),
				'blockera-one/builder-archive-listing-read-more'
			),
			'post-meta'              => $this->listingElementPool(
				__( 'Post Meta', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta'
			),
			'post-meta-2'            => $this->listingElementPool(
				__( 'Post Meta', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2'
			),
			'post-meta-author-name'      => $this->listingElementPool(
				__( 'Author Name', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-author-name'
			),
			'post-meta-comments-count'   => $this->listingElementPool(
				__( 'Comments Count', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-comments-count'
			),
			'post-meta-comments-link'    => $this->listingElementPool(
				__( 'Comments Link', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-comments-link'
			),
			'post-meta-date'             => $this->listingElementPool(
				__( 'Date', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-date'
			),
			'post-meta-post-date'        => $this->listingElementPool(
				__( 'Post Date', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-post-date'
			),
			'post-meta-modified-date'    => $this->listingElementPool(
				__( 'Modified Date', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-modified-date'
			),
			'post-meta-categories'       => $this->listingElementPool(
				__( 'Categories', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-categories'
			),
			'post-meta-tags'             => $this->listingElementPool(
				__( 'Tags', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-tags'
			),
			'post-meta-time-to-read'     => $this->listingElementPool(
				__( 'Time to Read', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-time-to-read'
			),
			'post-meta-word-count'       => $this->listingElementPool(
				__( 'Word Count', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-word-count'
			),
			'post-meta-2-author-name'    => $this->listingElementPool(
				__( 'Author Name', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-author-name'
			),
			'post-meta-2-comments-count' => $this->listingElementPool(
				__( 'Comments Count', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-comments-count'
			),
			'post-meta-2-comments-link'  => $this->listingElementPool(
				__( 'Comments Link', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-comments-link'
			),
			'post-meta-2-date'           => $this->listingElementPool(
				__( 'Date', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-date'
			),
			'post-meta-2-post-date'      => $this->listingElementPool(
				__( 'Post Date', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-post-date'
			),
			'post-meta-2-modified-date'  => $this->listingElementPool(
				__( 'Modified Date', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-modified-date'
			),
			'post-meta-2-categories'     => $this->listingElementPool(
				__( 'Categories', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-categories'
			),
			'post-meta-2-tags'           => $this->listingElementPool(
				__( 'Tags', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-tags'
			),
			'post-meta-2-time-to-read'   => $this->listingElementPool(
				__( 'Time to Read', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-time-to-read'
			),
			'post-meta-2-word-count'     => $this->listingElementPool(
				__( 'Word Count', 'blockera-one' ),
				'blockera-one/builder-archive-listing-post-meta-2-word-count'
			),
			// Order matters: no-sidebar first (toggle-off), then the nested
			// position picker (catalogExclude: no-sidebar) shows Left, Right.
			'layout'        => array(
				$this->patternVariant(
					'no-sidebar',
					__( 'No Sidebar', 'blockera-one' ),
					'blockera-one/builder-archive-layout-no-sidebar',
					array( 'areas' => array( 'content' ) )
				),
				$this->patternVariant(
					'sidebar-left',
					__( 'Left Sidebar', 'blockera-one' ),
					'blockera-one/builder-archive-layout-sidebar-left',
					array(
						'areas'     => array( 'content', 'sidebar-area' ),
						'thumbnail' => $this->thumbnail( 'sidebar-left' ),
					)
				),
				$this->patternVariant(
					'sidebar-right',
					__( 'Right Sidebar', 'blockera-one' ),
					'blockera-one/builder-archive-layout-sidebar-right',
					array(
						'areas'     => array( 'content', 'sidebar-area' ),
						'thumbnail' => $this->thumbnail( 'sidebar-right' ),
					)
				),
			),
			'footer'        => array(
				$this->templatePartVariant(
					'footer',
					__( 'Default', 'blockera-one' ),
					'footer',
					array(
						'area'         => 'footer',
						'tagName'      => 'footer',
						'thumbnail'    => $this->thumbnail( 'footer-default' ),
						'placement'    => $after_body,
						'chromeLayout' => 'stacked',
					)
				),
				$this->templatePartVariant(
					'footer-columns',
					__( 'Columns', 'blockera-one' ),
					'footer-columns',
					array(
						'area'         => 'footer',
						'tagName'      => 'footer',
						'thumbnail'    => $this->thumbnail( 'footer-columns' ),
						'placement'    => $after_body,
						'chromeLayout' => 'stacked',
					)
				),
				$this->templatePartVariant(
					'footer-newsletter',
					__( 'Newsletter', 'blockera-one' ),
					'footer-newsletter',
					array(
						'area'         => 'footer',
						'tagName'      => 'footer',
						'thumbnail'    => $this->thumbnail( 'footer-newsletter' ),
						'placement'    => $after_body,
						'chromeLayout' => 'stacked',
					)
				),
			),
		);
	}

	/**
	 * Thumbnail URL for an archive layout-picker tile. get_theme_file_uri()
	 * resolves the child theme file first, so children can restyle tiles by
	 * shipping the same asset path.
	 *
	 * @param string $name SVG basename under assets/templates-builder/archive/.
	 *
	 * @return string
	 */
	private function thumbnail( string $name ): string {
		return get_theme_file_uri( 'assets/templates-builder/archive/' . $name . '.svg' );
	}

	/**
	 * Single-variant restore pool for a Posts Loop / Post Meta element.
	 *
	 * @param string $label         Translated picker label.
	 * @param string $pattern_slug  Full `blockera-one/builder-archive-listing-…` slug.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function listingElementPool( string $label, string $pattern_slug ): array {
		return array(
			$this->patternVariant(
				'default',
				$label,
				$pattern_slug
			),
		);
	}
}
