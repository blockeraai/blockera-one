<?php
/**
 * Base config API for Templates Builder type catalogs.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * Every template type (archive, single, home, …) ships one catalog class that
 * extends this base and returns its default variant pools. The variant builder
 * helpers only accept keys defined in
 * `packages/blockera-one/schemas/template-builder-catalog.schema.json`, so
 * hand-written pools stay schema-valid by construction.
 */
abstract class AbstractCatalog {

	/**
	 * Optional variant keys accepted by patternVariant().
	 */
	protected const PATTERN_ARGS = array( 'thumbnail', 'placement', 'areas', 'chromeLayout', 'disabled', 'badge' );

	/**
	 * Optional keys accepted by disabledVariant().
	 */
	protected const DISABLED_ARGS = array( 'thumbnail', 'badge' );

	/**
	 * Optional variant keys accepted by templatePartVariant().
	 */
	protected const TEMPLATE_PART_ARGS = array( 'area', 'tagName', 'thumbnail', 'placement', 'chromeLayout' );

	/**
	 * Template type id this catalog provides pools for (kebab-case).
	 *
	 * @return string
	 */
	abstract public function type(): string;

	/**
	 * Default pools: pool id → ordered Variant[] (first item is the
	 * toggle-on default).
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	abstract public function pools(): array;

	/**
	 * Build a pattern-kind variant (markup resolved from the core patterns
	 * store at runtime by patternSlug).
	 *
	 * @param string $id           Kebab-case variant id (stamp variant, e.g. section/{poolId}:{id}).
	 * @param string $label        Translated picker label.
	 * @param string $pattern_slug Registered pattern slug (namespace/name).
	 * @param array  $args         Optional keys: thumbnail, placement, areas, chromeLayout.
	 *
	 * @return array<string,mixed>
	 */
	protected function patternVariant( string $id, string $label, string $pattern_slug, array $args = array() ): array {
		$variant = array(
			'id'          => $id,
			'label'       => $label,
			'kind'        => 'pattern',
			'patternSlug' => $pattern_slug,
		);

		return $this->withArgs( $variant, $args, self::PATTERN_ARGS );
	}

	/**
	 * Build a templatePart-kind variant (JS renders a self-closing
	 * core/template-part comment from slug/area/tagName).
	 *
	 * @param string $id    Kebab-case variant id (stamp variant, e.g. section/{poolId}:{id}).
	 * @param string $label Translated picker label.
	 * @param string $slug  Theme template part slug (parts/<slug>.html).
	 * @param array  $args  Optional keys: area, tagName, thumbnail, placement, chromeLayout.
	 *
	 * @return array<string,mixed>
	 */
	protected function templatePartVariant( string $id, string $label, string $slug, array $args = array() ): array {
		$variant = array(
			'id'    => $id,
			'label' => $label,
			'kind'  => 'templatePart',
			'slug'  => $slug,
		);

		return $this->withArgs( $variant, $args, self::TEMPLATE_PART_ARGS );
	}

	/**
	 * Build a coming-soon tile with no markup (patternSlug omitted).
	 *
	 * @param string $id    Kebab-case variant id.
	 * @param string $label Translated picker label.
	 * @param array  $args  Optional keys: thumbnail, badge.
	 *
	 * @return array<string,mixed>
	 */
	protected function disabledVariant( string $id, string $label, array $args = array() ): array {
		$variant = array(
			'id'       => $id,
			'label'    => $label,
			'disabled' => true,
		);

		return $this->withArgs( $variant, $args, self::DISABLED_ARGS );
	}

	/**
	 * Thumbnail URL for a layout-picker tile. get_theme_file_uri() resolves
	 * the child theme file first, so children can restyle tiles by shipping
	 * the same asset path.
	 *
	 * @param string $dir  Folder under assets/templates-builder/.
	 * @param string $name SVG basename (no extension).
	 *
	 * @return string
	 */
	protected function thumbnail( string $dir, string $name ): string {
		return get_theme_file_uri( 'assets/templates-builder/' . $dir . '/' . $name . '.svg' );
	}

	/**
	 * Single-variant restore pool for a Posts Loop / Post Meta element.
	 *
	 * @param string $label        Translated picker label.
	 * @param string $pattern_slug Full `blockera-one/builder-…` slug.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	protected function listingElementPool( string $label, string $pattern_slug ): array {
		return array(
			$this->patternVariant(
				'default',
				$label,
				$pattern_slug
			),
		);
	}

	/**
	 * Site-header chrome pool (stacked parts + vertical-rail pattern).
	 *
	 * @param string $thumbnail_dir          Folder under assets/templates-builder/.
	 * @param string $vertical_pattern_slug  Vertical-rail pattern slug.
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	protected function chromeHeaderPool(
		string $thumbnail_dir,
		string $vertical_pattern_slug = 'blockera-one/builder-archive-header-vertical'
	): array {
		$before_body = array(
			'relativeTo' => 'main',
			'position'   => 'before',
		);

		return array(
			'header' => array(
				$this->templatePartVariant(
					'header',
					__( 'Default', 'blockera-one' ),
					'header',
					array(
						'area'         => 'header',
						'tagName'      => 'header',
						'thumbnail'    => $this->thumbnail( $thumbnail_dir, 'header-default' ),
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
						'thumbnail'    => $this->thumbnail( $thumbnail_dir, 'header-large-title' ),
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
					$vertical_pattern_slug,
					array(
						'thumbnail'    => $this->thumbnail( $thumbnail_dir, 'header-vertical' ),
						'chromeLayout' => 'vertical-rail',
					)
				),
			),
		);
	}

	/**
	 * Site-footer chrome pool (stacked parts).
	 *
	 * @param string $thumbnail_dir Folder under assets/templates-builder/.
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	protected function chromeFooterPool( string $thumbnail_dir ): array {
		$after_body = array(
			'relativeTo' => 'main',
			'position'   => 'after',
		);

		return array(
			'footer' => array(
				$this->templatePartVariant(
					'footer',
					__( 'Default', 'blockera-one' ),
					'footer',
					array(
						'area'         => 'footer',
						'tagName'      => 'footer',
						'thumbnail'    => $this->thumbnail( $thumbnail_dir, 'footer-default' ),
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
						'thumbnail'    => $this->thumbnail( $thumbnail_dir, 'footer-columns' ),
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
						'thumbnail'    => $this->thumbnail( $thumbnail_dir, 'footer-newsletter' ),
						'placement'    => $after_body,
						'chromeLayout' => 'stacked',
					)
				),
			),
		);
	}

	/**
	 * Post Meta row, item, and space-filler pools (shared across families).
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	protected function postMetaPools(): array {
		return array(
			'post-meta'                  => $this->listingElementPool(
				__( 'Post Meta', 'blockera-one' ),
				'blockera-one/builder-post-meta'
			),
			'post-meta-2'                => $this->listingElementPool(
				__( 'Post Meta', 'blockera-one' ),
				'blockera-one/builder-post-meta-2'
			),
			'post-meta-author-name'      => $this->listingElementPool(
				__( 'Author Name', 'blockera-one' ),
				'blockera-one/builder-post-meta-author-name'
			),
			'post-meta-comments-count'   => $this->listingElementPool(
				__( 'Comments Count', 'blockera-one' ),
				'blockera-one/builder-post-meta-comments-count'
			),
			'post-meta-comments-link'    => $this->listingElementPool(
				__( 'Comments Link', 'blockera-one' ),
				'blockera-one/builder-post-meta-comments-link'
			),
			'post-meta-date'             => $this->listingElementPool(
				__( 'Date', 'blockera-one' ),
				'blockera-one/builder-post-meta-date'
			),
			'post-meta-post-date'        => $this->listingElementPool(
				__( 'Post Date', 'blockera-one' ),
				'blockera-one/builder-post-meta-post-date'
			),
			'post-meta-modified-date'    => $this->listingElementPool(
				__( 'Modified Date', 'blockera-one' ),
				'blockera-one/builder-post-meta-modified-date'
			),
			'post-meta-categories'       => $this->listingElementPool(
				__( 'Categories', 'blockera-one' ),
				'blockera-one/builder-post-meta-categories'
			),
			'post-meta-tags'             => $this->listingElementPool(
				__( 'Tags', 'blockera-one' ),
				'blockera-one/builder-post-meta-tags'
			),
			'post-meta-time-to-read'     => $this->listingElementPool(
				__( 'Time to Read', 'blockera-one' ),
				'blockera-one/builder-post-meta-time-to-read'
			),
			'post-meta-word-count'       => $this->listingElementPool(
				__( 'Word Count', 'blockera-one' ),
				'blockera-one/builder-post-meta-word-count'
			),
			'post-meta-2-author-name'    => $this->listingElementPool(
				__( 'Author Name', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-author-name'
			),
			'post-meta-2-comments-count' => $this->listingElementPool(
				__( 'Comments Count', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-comments-count'
			),
			'post-meta-2-comments-link'  => $this->listingElementPool(
				__( 'Comments Link', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-comments-link'
			),
			'post-meta-2-date'           => $this->listingElementPool(
				__( 'Date', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-date'
			),
			'post-meta-2-post-date'      => $this->listingElementPool(
				__( 'Post Date', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-post-date'
			),
			'post-meta-2-modified-date'  => $this->listingElementPool(
				__( 'Modified Date', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-modified-date'
			),
			'post-meta-2-categories'     => $this->listingElementPool(
				__( 'Categories', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-categories'
			),
			'post-meta-2-tags'           => $this->listingElementPool(
				__( 'Tags', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-tags'
			),
			'post-meta-2-time-to-read'   => $this->listingElementPool(
				__( 'Time to Read', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-time-to-read'
			),
			'post-meta-2-word-count'     => $this->listingElementPool(
				__( 'Word Count', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-word-count'
			),
			'post-meta-space-filler'     => $this->listingElementPool(
				__( 'Space Filler', 'blockera-one' ),
				'blockera-one/builder-post-meta-space-filler'
			),
			'post-meta-space-filler-2'   => $this->listingElementPool(
				__( 'Space Filler', 'blockera-one' ),
				'blockera-one/builder-post-meta-space-filler-2'
			),
			'post-meta-2-space-filler'   => $this->listingElementPool(
				__( 'Space Filler', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-space-filler'
			),
			'post-meta-2-space-filler-2' => $this->listingElementPool(
				__( 'Space Filler', 'blockera-one' ),
				'blockera-one/builder-post-meta-2-space-filler-2'
			),
		);
	}

	/**
	 * Page layout variants. Order matters: no-sidebar first (toggle-off),
	 * then the nested position picker (catalogExclude: no-sidebar) shows
	 * Left, Right.
	 *
	 * @param string $thumbnail_dir Folder under assets/templates-builder/.
	 *
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	protected function layoutPool( string $thumbnail_dir = 'archive' ): array {
		return array(
			'layout' => array(
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
						'thumbnail' => $this->thumbnail( $thumbnail_dir, 'sidebar-left' ),
					)
				),
				$this->patternVariant(
					'sidebar-right',
					__( 'Right Sidebar', 'blockera-one' ),
					'blockera-one/builder-archive-layout-sidebar-right',
					array(
						'areas'     => array( 'content', 'sidebar-area' ),
						'thumbnail' => $this->thumbnail( $thumbnail_dir, 'sidebar-right' ),
					)
				),
			),
		);
	}

	/**
	 * Copy only allowed optional keys onto the variant (unknown keys are
	 * silently ignored so a typo cannot leak into the public payload).
	 *
	 * @param array $variant Base variant.
	 * @param array $args    Caller-provided optional keys.
	 * @param array $allowed Whitelisted key names.
	 *
	 * @return array<string,mixed>
	 */
	private function withArgs( array $variant, array $args, array $allowed ): array {
		foreach ( $allowed as $key ) {
			if ( array_key_exists( $key, $args ) ) {
				$variant[ $key ] = $args[ $key ];
			}
		}

		return $variant;
	}
}
