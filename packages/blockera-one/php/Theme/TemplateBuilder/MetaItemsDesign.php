<?php
/**
 * Post Meta Items Design config for the Templates Builder.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme\TemplateBuilder;

/**
 * Shared item map plus optional per-listing preset/item overlays, keyed by
 * listing stamp (`section/posts-listing:full-width`). Child themes override
 * via {@see FILTER}.
 */
class MetaItemsDesign {

	/**
	 * Public filter over the Post Meta Items Design payload.
	 */
	public const FILTER = 'blockera-one/template-builder/meta-items-design';

	/**
	 * @return array{
	 *     default: array{items: array<string,array<string,array<string,mixed>>>},
	 *     listings: array<string,array<string,mixed>>
	 * }
	 */
	public function get(): array {
		$payload = array(
			'default'  => array(
				'items' => $this->defaultItems(),
			),
			'listings' => array(
				'section/posts-listing:full-width' => array(
					'preset' => 'icons',
				),
			),
		);

		/**
		 * Filters Post Meta Items Design (child-theme API).
		 *
		 * `default.items` is suffix → simple/labels/icons → { icon, prefix, suffix }.
		 * `listings` is listing stamp → { preset?, items? }.
		 *
		 * @param array $payload Items Design payload.
		 */
		$filtered = apply_filters( self::FILTER, $payload );

		return is_array( $filtered ) ? $filtered : $payload;
	}

	/**
	 * Shared item map (all listings inherit this unless they overlay `items`).
	 *
	 * @return array<string,array<string,array<string,mixed>>>
	 */
	private function defaultItems(): array {
		return array(
			'author-name'    => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'By', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'comment-author-avatar',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
			'date'           => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'On', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'calendar',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
			'post-date'      => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'Published:', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'calendar',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
			'modified-date'  => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'Updated on', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'update',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
			'categories'     => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'In', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'category',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
			'tags'           => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'Tagged', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'tag',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
			'comments-count' => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'Comments', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'admin-comments',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
			'comments-link'  => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'Comments', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'admin-comments',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
			'time-to-read'   => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'Read in', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'clock',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
			'word-count'     => array(
				'simple' => array(
					'icon'   => '',
					'prefix' => '',
					'suffix' => '',
				),
				'labels' => array(
					'icon'   => '',
					'prefix' => __( 'Words', 'blockera-one' ),
					'suffix' => '',
				),
				'icons'  => array(
					'icon'   => array(
						'icon'    => 'media-text',
						'library' => 'wp',
					),
					'prefix' => '',
					'suffix' => '',
				),
			),
		);
	}
}
