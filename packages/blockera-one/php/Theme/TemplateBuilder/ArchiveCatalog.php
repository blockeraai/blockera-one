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
			'page-title'    => array(
				$this->patternVariant(
					'default',
					__( 'Simple', 'blockera-one' ),
					'blockera-one/builder-archive-page-title',
					array(
						'thumbnail' => $this->thumbnail( 'page-title-default' ),
						'placement' => array(
							'relativeTo' => 'content',
							'position'   => 'inside-start',
						),
					)
				),
				$this->patternVariant(
					'banner',
					__( 'Banner', 'blockera-one' ),
					'blockera-one/builder-archive-page-title-banner',
					array(
						'thumbnail' => $this->thumbnail( 'page-title-banner' ),
						'placement' => array(
							'relativeTo' => 'archive-body',
							'position'   => 'inside-start',
						),
					)
				),
			),
			'posts-listing' => array(
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
			'pagination'    => array(
				$this->patternVariant(
					'standard',
					__( 'Standard', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-standard'
				),
				$this->patternVariant(
					'next-prev',
					__( 'Next/Prev', 'blockera-one' ),
					'blockera-one/builder-archive-pagination-next-prev'
				),
			),
			// Order matters: no-sidebar first (toggle-off), then the nested
			// position picker (catalogExclude: no-sidebar) shows Right, Left.
			'layout'        => array(
				$this->patternVariant(
					'no-sidebar',
					__( 'No Sidebar', 'blockera-one' ),
					'blockera-one/builder-archive-layout-no-sidebar',
					array( 'areas' => array( 'content' ) )
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
				$this->patternVariant(
					'sidebar-left',
					__( 'Left Sidebar', 'blockera-one' ),
					'blockera-one/builder-archive-layout-sidebar-left',
					array(
						'areas'     => array( 'content', 'sidebar-area' ),
						'thumbnail' => $this->thumbnail( 'sidebar-left' ),
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
}
