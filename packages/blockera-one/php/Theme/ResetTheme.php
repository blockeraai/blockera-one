<?php
/**
 * Site Editor theme reset REST API (DB customizations only).
 *
 * Clears user global styles, custom wp_template / wp_template_part posts,
 * and/or homepage reading settings. Does not modify theme files.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Theme_JSON_Resolver;
use WP_REST_Global_Styles_Controller;

/**
 * Registers and handles PATCH /blockera-one/v1/reset-theme.
 */
class ResetTheme {

	/**
	 * REST namespace.
	 */
	public const REST_NAMESPACE = 'blockera-one/v1';

	/**
	 * REST route.
	 */
	public const REST_ROUTE = '/reset-theme';

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'registerRoutes' ) );
	}

	/**
	 * Register the reset-theme REST route.
	 *
	 * @return void
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'resetTheme' ),
				'permission_callback' => array( $this, 'canResetTheme' ),
				'args'                => array(
					'resetStyles'        => array(
						'type'              => 'boolean',
						'required'          => false,
						'default'           => false,
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
					'resetTemplates'     => array(
						'type'              => 'boolean',
						'required'          => false,
						'default'           => false,
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
					'resetTemplateParts'     => array(
						'type'              => 'boolean',
						'required'          => false,
						'default'           => false,
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
					'resetHomepageSettings'  => array(
						'type'              => 'boolean',
						'required'          => false,
						'default'           => false,
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
				),
			)
		);
	}

	/**
	 * Whether the current user may reset theme customizations.
	 *
	 * @return bool|WP_Error
	 */
	public function canResetTheme() {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to reset theme customizations.', 'blockera' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Reset selected user customizations and return a minimal success payload.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function resetTheme( WP_REST_Request $request ): WP_REST_Response {
		if ( true === $request->get_param( 'resetStyles' ) ) {
			$this->clearUserStylesCustomizations();
		}

		if ( true === $request->get_param( 'resetTemplates' ) ) {
			$this->clearUserTemplatesCustomizations();
		}

		if ( true === $request->get_param( 'resetTemplateParts' ) ) {
			$this->clearUserTemplatePartsCustomizations();
		}

		if ( true === $request->get_param( 'resetHomepageSettings' ) ) {
			$this->clearHomepageSettingsCustomizations();
		}

		return rest_ensure_response(
			array(
				'status' => 'SUCCESS',
			)
		);
	}

	/**
	 * Empty the user global styles CPT and related transients.
	 *
	 * @return void
	 */
	private function clearUserStylesCustomizations(): void {
		$user_custom_post_type_id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
		$global_styles_controller = new WP_REST_Global_Styles_Controller();
		$update_request           = new WP_REST_Request( 'PUT', '/wp/v2/global-styles/' );
		$update_request->set_param( 'id', $user_custom_post_type_id );
		$update_request->set_param( 'settings', array() );
		$update_request->set_param( 'styles', array() );
		$global_styles_controller->update_item( $update_request );

		delete_transient( 'global_styles' );
		delete_transient( 'global_styles_' . get_stylesheet() );
		delete_transient( 'gutenberg_global_styles' );
		delete_transient( 'gutenberg_global_styles_' . get_stylesheet() );
	}

	/**
	 * Force-delete custom (DB) wp_template posts.
	 *
	 * @return void
	 */
	private function clearUserTemplatesCustomizations(): void {
		$templates = get_block_templates();

		foreach ( $templates as $template ) {
			if ( 'custom' !== $template->source ) {
				continue;
			}

			wp_delete_post( $template->wp_id, true );
		}
	}

	/**
	 * Force-delete custom (DB) wp_template_part posts.
	 *
	 * @return void
	 */
	private function clearUserTemplatePartsCustomizations(): void {
		$template_parts = get_block_templates( array(), 'wp_template_part' );

		foreach ( $template_parts as $template ) {
			if ( 'custom' !== $template->source ) {
				continue;
			}

			wp_delete_post( $template->wp_id, true );
		}
	}

	/**
	 * Restore WordPress default homepage reading settings.
	 *
	 * @return void
	 */
	private function clearHomepageSettingsCustomizations(): void {
		update_option( 'show_on_front', 'posts' );
		update_option( 'page_on_front', 0 );
		update_option( 'page_for_posts', 0 );
	}
}
