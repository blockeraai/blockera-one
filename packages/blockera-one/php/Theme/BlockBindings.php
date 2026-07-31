<?php
/**
 * Block bindings sources for the theme.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Registers theme block binding sources.
 */
class BlockBindings {

	/**
	 * Binding source name for the post format label.
	 *
	 * @var string
	 */
	private const FORMAT_SOURCE = 'blockera-one/format';

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'registerSources' ) );
	}

	/**
	 * Registers the post format block binding source.
	 *
	 * @return void
	 */
	public function registerSources(): void {
		register_block_bindings_source(
			self::FORMAT_SOURCE,
			array(
				'label'              => _x( 'Post format name', 'Label for the block binding placeholder in the editor', 'blockera-one' ),
				'get_value_callback' => array( $this, 'getFormatValue' ),
			)
		);
	}

	/**
	 * Callback for the post format name block binding source.
	 *
	 * @return string|null Post format name, or null if the format is 'standard'/empty.
	 */
	public function getFormatValue(): ?string {
		$post_format_slug = get_post_format();

		if ( $post_format_slug && 'standard' !== $post_format_slug ) {
			return get_post_format_string( $post_format_slug );
		}

		return null;
	}
}
