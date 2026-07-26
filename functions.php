<?php
/**
 * Blockera One functions and definitions.
 *
 * @link https://github.com/blockeraai/blockera-one
 *
 * @package blockeraai
 * @subpackage blockera-one
 * @since Twenty Twenty-Five 1.0
 */

if ( ! function_exists( 'blockera_one_should_load_embedded_blockera' ) ) :
	/**
	 * Whether the theme should bootstrap embedded Blockera.
	 *
	 * @return bool
	 */
	function blockera_one_should_load_embedded_blockera(): bool {
		if ( defined( 'BLOCKERA_SB_FILE' ) ) {
			return false;
		}

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		return ! is_plugin_active( 'blockera/blockera.php' );
	}
endif;

// Load embedded Blockera only when the standalone plugin is not already active.
if ( blockera_one_should_load_embedded_blockera() ) :
	require_once get_template_directory() . '/blockera.php';
endif;

if ( ! function_exists( 'blockera_one_post_format_setup' ) ) :
	/**
	 * Adds theme support for post formats.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function blockera_one_post_format_setup() {
		add_theme_support( 'post-formats', array( 'aside', 'audio', 'chat', 'gallery', 'image', 'link', 'quote', 'status', 'video' ) );
	}
endif;
add_action( 'after_setup_theme', 'blockera_one_post_format_setup' );

if ( ! function_exists( 'blockera_one_editor_style' ) ) :
	/**
	 * Enqueues editor-style.css in the editors.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function blockera_one_editor_style() {
		add_editor_style( 'assets/css/editor-style.css' );
	}
endif;
add_action( 'after_setup_theme', 'blockera_one_editor_style' );

if ( ! function_exists( 'blockera_one_enqueue_styles' ) ) :
	/**
	 * Enqueues the theme stylesheet on the front.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function blockera_one_enqueue_styles() {
		$suffix = SCRIPT_DEBUG ? '' : '.min';
		$src    = 'style' . $suffix . '.css';

		wp_enqueue_style(
			'twentytwentyfive-style',
			get_parent_theme_file_uri( $src ),
			array(),
			wp_get_theme()->get( 'Version' )
		);
		wp_style_add_data(
			'twentytwentyfive-style',
			'path',
			get_parent_theme_file_path( $src )
		);
	}
endif;
add_action( 'wp_enqueue_scripts', 'blockera_one_enqueue_styles' );

if ( ! function_exists( 'blockera_one_block_styles' ) ) :
	/**
	 * Registers custom block styles.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function blockera_one_block_styles() {
		register_block_style(
			'core/list',
			array(
				'name'         => 'checkmark-list',
				'label'        => __( 'Checkmark', 'blockera-one' ),
				'inline_style' => '
				ul.is-style-checkmark-list {
					list-style-type: "\2713";
				}

				ul.is-style-checkmark-list li {
					padding-inline-start: 1ch;
				}',
			)
		);
	}
endif;
add_action( 'init', 'blockera_one_block_styles' );

if ( ! function_exists( 'blockera_one_pattern_categories' ) ) :
	/**
	 * Registers pattern categories.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function blockera_one_pattern_categories() {

		register_block_pattern_category(
			'blockera_one_page',
			array(
				'label'       => __( 'Pages', 'blockera-one' ),
				'description' => __( 'A collection of full page layouts.', 'blockera-one' ),
			)
		);

		register_block_pattern_category(
			'blockera_one_post-format',
			array(
				'label'       => __( 'Post formats', 'blockera-one' ),
				'description' => __( 'A collection of post format patterns.', 'blockera-one' ),
			)
		);
	}
endif;
add_action( 'init', 'blockera_one_pattern_categories' );

if ( ! function_exists( 'blockera_one_register_block_bindings' ) ) :
	/**
	 * Registers the post format block binding source.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function blockera_one_register_block_bindings() {
		register_block_bindings_source(
			'twentytwentyfive/format',
			array(
				'label'              => _x( 'Post format name', 'Label for the block binding placeholder in the editor', 'blockera-one' ),
				'get_value_callback' => 'blockera_one_format_binding',
			)
		);
	}
endif;
add_action( 'init', 'blockera_one_register_block_bindings' );

if ( ! function_exists( 'blockera_one_format_binding' ) ) :
	/**
	 * Callback function for the post format name block binding source.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return string|void Post format name, or nothing if the format is 'standard'.
	 */
	function blockera_one_format_binding() {
		$post_format_slug = get_post_format();

		if ( $post_format_slug && 'standard' !== $post_format_slug ) {
			return get_post_format_string( $post_format_slug );
		}
	}
endif;
