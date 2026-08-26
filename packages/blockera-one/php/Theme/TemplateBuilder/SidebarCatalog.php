<?php
/**
 * Templates Builder pools for the global sidebar template part.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * Sidebar widget-element restore pools. Markup lives in
 * `patterns/sidebar/builder-*.php`. Hydrate key matches the JS type
 * (`global-sidebar`).
 */
class SidebarCatalog extends AbstractCatalog {

	/**
	 * {@inheritDoc}
	 *
	 * @return string
	 */
	public function type(): string {
		return 'global-sidebar';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	public function pools(): array {
		return array(
			'sidebar-search'       => $this->listingElementPool(
				__( 'Search', 'blockera-one' ),
				'blockera-one/builder-sidebar-search'
			),
			'sidebar-categories'   => $this->listingElementPool(
				__( 'Categories', 'blockera-one' ),
				'blockera-one/builder-sidebar-categories'
			),
			'sidebar-latest-posts' => $this->listingElementPool(
				__( 'Latest Posts', 'blockera-one' ),
				'blockera-one/builder-sidebar-latest-posts'
			),
			'sidebar-archives'     => $this->listingElementPool(
				__( 'Archives', 'blockera-one' ),
				'blockera-one/builder-sidebar-archives'
			),
			'sidebar-tag-cloud'    => $this->listingElementPool(
				__( 'Tag Cloud', 'blockera-one' ),
				'blockera-one/builder-sidebar-tag-cloud'
			),
		);
	}
}
