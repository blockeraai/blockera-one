<?php
/**
 * Per-template-type settings for Templates Builder (posts_per_page, …).
 *
 * Block templates keep `inherit: true` on Query blocks; this module maps
 * purpose keys to main-query args via `pre_get_posts` (Blocksy-style).
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Registers REST-exposed site settings and applies them on the main query.
 */
class TemplateSettings {

	/**
	 * Option / REST setting key.
	 */
	public const OPTION = 'blockera_one_template_settings';

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'registerSettings' ) );
		add_action( 'pre_get_posts', array( $this, 'applyPostsPerPage' ), 20 );
	}

	/**
	 * Expose settings on the Site Editor `root/site` entity.
	 *
	 * @return void
	 */
	public function registerSettings(): void {
		register_setting(
			'general',
			self::OPTION,
			array(
				'type'              => 'object',
				'default'           => array(
					'posts_per_page' => array(),
				),
				'show_in_rest'      => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'posts_per_page' => array(
								'type'                 => 'object',
								'additionalProperties' => array(
									'type' => 'integer',
								),
							),
							'sidebar_width'  => array(
								'type' => 'string',
							),
							'header_sticky'  => array(
								'type' => 'string',
							),
						),
					),
				),
				'sanitize_callback' => array( $this, 'sanitizeSettings' ),
			)
		);
	}

	/**
	 * Sanitize the settings object.
	 *
	 * @param mixed $value Raw option value.
	 *
	 * @return array{posts_per_page: array<string, int>, sidebar_width?: string, header_sticky?: string}
	 */
	public function sanitizeSettings( $value ): array {
		$out = array(
			'posts_per_page' => array(),
		);

		if ( ! is_array( $value ) ) {
			return $out;
		}

		$ppp = $value['posts_per_page'] ?? null;
		if ( is_array( $ppp ) ) {
			foreach ( $ppp as $key => $count ) {
				if ( ! is_string( $key ) || '' === $key ) {
					continue;
				}
				$n = absint( $count );
				if ( $n < 1 ) {
					continue;
				}
				if ( $n > 100 ) {
					$n = 100;
				}
				$out['posts_per_page'][ sanitize_key( $key ) ] = $n;
			}
		}

		$width = $this->sanitizeSidebarWidth( $value['sidebar_width'] ?? null );
		if ( null !== $width ) {
			$out['sidebar_width'] = $width;
		}

		$sticky = $this->sanitizeHeaderSticky( $value['header_sticky'] ?? null );
		if ( null !== $sticky ) {
			$out['header_sticky'] = $sticky;
		}

		return $out;
	}

	/**
	 * Clamp a percent width to 10–60 and store it unitless (e.g. "33.33").
	 *
	 * @param mixed $value Raw sidebar_width.
	 *
	 * @return string|null
	 */
	private function sanitizeSidebarWidth( $value ): ?string {
		if ( is_int( $value ) || is_float( $value ) ) {
			$n = (float) $value;
		} elseif ( is_string( $value ) && '' !== $value ) {
			$n = floatval( str_replace( '%', '', $value ) );
		} else {
			return null;
		}

		if ( $n < 10 ) {
			$n = 10;
		} elseif ( $n > 60 ) {
			$n = 60;
		}

		$formatted = rtrim( rtrim( number_format( $n, 2, '.', '' ), '0' ), '.' );
		return '' === $formatted ? null : $formatted;
	}

	/**
	 * Store sticky as "1" / "0".
	 *
	 * @param mixed $value Raw header_sticky.
	 *
	 * @return string|null
	 */
	private function sanitizeHeaderSticky( $value ): ?string {
		if ( true === $value || 1 === $value || '1' === $value || 'true' === $value ) {
			return '1';
		}
		if ( false === $value || 0 === $value || '0' === $value || 'false' === $value ) {
			return '0';
		}
		return null;
	}

	/**
	 * Map the current main query to a Templates Builder purpose key.
	 *
	 * @param \WP_Query $query Query instance.
	 *
	 * @return string|null
	 */
	public function resolvePurposeKey( \WP_Query $query ): ?string {
		if ( ! $query->is_main_query() ) {
			return null;
		}

		if ( $query->is_search() ) {
			return 'search';
		}
		if ( $query->is_category() ) {
			return 'category';
		}
		if ( $query->is_tag() ) {
			return 'tag';
		}
		if ( $query->is_author() ) {
			return 'author';
		}
		if ( $query->is_date() ) {
			return 'date';
		}
		if ( $query->is_tax() ) {
			return 'taxonomy';
		}
		if ( $query->is_post_type_archive() ) {
			return 'archive';
		}
		if ( $query->is_home() && ! $query->is_front_page() ) {
			return 'home';
		}
		if ( $query->is_archive() ) {
			return 'archive';
		}

		return null;
	}

	/**
	 * Apply per-purpose posts_per_page on the main query.
	 *
	 * @param \WP_Query $query Query instance.
	 *
	 * @return void
	 */
	public function applyPostsPerPage( \WP_Query $query ): void {
		// Only the main query; purpose resolution is a no-op for admin list tables.
		if ( ! $query->is_main_query() ) {
			return;
		}

		$purpose = $this->resolvePurposeKey( $query );
		if ( null === $purpose ) {
			return;
		}

		$settings = get_option( self::OPTION, array() );
		if ( ! is_array( $settings ) ) {
			return;
		}

		$ppp = $settings['posts_per_page'] ?? null;
		if ( ! is_array( $ppp ) ) {
			return;
		}

		$count = null;
		if ( isset( $ppp[ $purpose ] ) ) {
			$count = absint( $ppp[ $purpose ] );
		} elseif ( 'home' === $purpose && isset( $ppp['index'] ) ) {
			// Blog index template bucket when Home is unset.
			$count = absint( $ppp['index'] );
		} elseif ( 'archive' !== $purpose && isset( $ppp['archive'] ) ) {
			// Child archive purposes inherit the All Archives setting.
			$count = absint( $ppp['archive'] );
		}

		if ( null === $count || $count < 1 ) {
			return;
		}

		$query->set( 'posts_per_page', $count );
	}
}
