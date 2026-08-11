<?php
/**
 * Front-end theme stylesheet enqueue.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Enqueues the theme stylesheet on the front.
 */
class FrontStyles {

	/**
	 * Style handle for the theme main stylesheet.
	 *
	 * @var string
	 */
	private const HANDLE = 'blockera-one-style';

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ) );
	}

	/**
	 * Enqueues the theme stylesheet and exposes its filesystem path for inlining.
	 *
	 * @return void
	 */
	public function enqueue(): void {
		$script_debug = (bool) apply_filters(
			'blockera_one_front_styles_script_debug',
			defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG
		);
		$suffix       = $script_debug ? '' : '.min';
		$src          = 'style' . $suffix . '.css';

		wp_enqueue_style(
			self::HANDLE,
			get_parent_theme_file_uri( $src ),
			array(),
			wp_get_theme()->get( 'Version' )
		);

		wp_style_add_data(
			self::HANDLE,
			'path',
			get_parent_theme_file_path( $src )
		);
	}
}
