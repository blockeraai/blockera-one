<?php
/**
 * Site Editor performance features (emoji disable, future opts).
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Registers performance settings and applies related front/admin optimizations.
 */
class Performance {

	/**
	 * Option / REST setting key for disabling WP emoji scripts.
	 *
	 * Missing key => enabled (default). Explicit false => emojis may load.
	 */
	public const DISABLE_EMOJIS_OPTION = 'blockera_one_disable_emojis';

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'registerSettings' ) );
		add_action( 'init', array( $this, 'maybeApply' ), 20 );
	}

	/**
	 * Expose performance options on the Site Editor `root/site` entity.
	 *
	 * @return void
	 */
	public function registerSettings(): void {
		register_setting(
			'general',
			self::DISABLE_EMOJIS_OPTION,
			array(
				'type'              => 'boolean',
				'default'           => true,
				'show_in_rest'      => true,
				'sanitize_callback' => static function ( $value ): bool {
					return (bool) $value;
				},
			)
		);
	}

	/**
	 * Apply enabled performance tasks.
	 *
	 * @return void
	 */
	public function maybeApply(): void {
		if ( $this->isDisableEmojisEnabled() ) {
			$this->disableEmojis();
		}
	}

	/**
	 * Whether the disable-emojis feature is on.
	 *
	 * Missing / unset option defaults to enabled.
	 *
	 * @return bool
	 */
	public function isDisableEmojisEnabled(): bool {
		$raw = get_option( self::DISABLE_EMOJIS_OPTION, null );

		// Missing key => enabled (default).
		if ( null === $raw ) {
			return true;
		}

		// WP may persist boolean false as '' / '0' / 0 / false.
		if ( false === $raw || 0 === $raw || '0' === $raw || '' === $raw ) {
			return false;
		}

		return (bool) $raw;
	}

	/**
	 * Remove WordPress emoji detection scripts, styles, and related filters.
	 *
	 * @return void
	 */
	private function disableEmojis(): void {
		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
		remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
		remove_action( 'embed_head', 'print_emoji_detection_script' );

		remove_action( 'wp_print_styles', 'print_emoji_styles' );
		remove_action( 'admin_print_styles', 'print_emoji_styles' );
		remove_action( 'wp_enqueue_scripts', 'wp_enqueue_emoji_styles' );
		remove_action( 'admin_enqueue_scripts', 'wp_enqueue_emoji_styles' );
		remove_action( 'enqueue_embed_scripts', 'wp_enqueue_emoji_styles' );

		remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
		remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
		remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );

		add_filter( 'tiny_mce_plugins', array( $this, 'disableEmojisTinymce' ) );
		add_filter( 'wp_resource_hints', array( $this, 'disableEmojisDnsPrefetch' ), 10, 2 );
	}

	/**
	 * Drop the TinyMCE emoji plugin.
	 *
	 * @param array<int, string>|mixed $plugins TinyMCE plugins.
	 *
	 * @return array<int, string>|mixed
	 */
	public function disableEmojisTinymce( $plugins ) {
		if ( ! is_array( $plugins ) ) {
			return $plugins;
		}

		return array_values(
			array_diff( $plugins, array( 'wpemoji' ) )
		);
	}

	/**
	 * Remove s.w.org emoji CDN from DNS prefetch hints.
	 *
	 * @param array<int, string>|mixed $urls          URLs to print.
	 * @param string                   $relation_type Relation type.
	 *
	 * @return array<int, string>|mixed
	 */
	public function disableEmojisDnsPrefetch( $urls, string $relation_type ) {
		if ( 'dns-prefetch' !== $relation_type || ! is_array( $urls ) ) {
			return $urls;
		}

		return array_values(
			array_filter(
				$urls,
				static function ( $url ) {
					return is_string( $url ) && false === strpos( $url, 'https://s.w.org/images/core/emoji/' );
				}
			)
		);
	}
}
