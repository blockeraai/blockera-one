<?php
/**
 * Integration tests for ResetTheme REST API.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Tests\TestCase;
use Blockera\One\Theme\ResetTheme;
use WP_Error;
use WP_REST_Request;
use WP_Theme_JSON_Resolver;

/**
 * Covers Blockera\One\Theme\ResetTheme.
 */
class ResetThemeTest extends TestCase {

	/**
	 * @var ResetTheme
	 */
	private ResetTheme $module;

	/**
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();

		$this->module = new ResetTheme();
		$this->module->register();
		do_action( 'rest_api_init' );
	}

	/**
	 * @return void
	 */
	public function tear_down(): void {
		update_option( 'show_on_front', 'posts' );
		update_option( 'page_on_front', 0 );
		update_option( 'page_for_posts', 0 );

		parent::tear_down();
	}

	/**
	 * @return void
	 */
	public function test_register_hooks_rest_api_init(): void {
		$module = new ResetTheme();
		$module->register();

		$this->assertSame( 10, has_action( 'rest_api_init', array( $module, 'registerRoutes' ) ) );
	}

	/**
	 * @return void
	 */
	public function test_route_is_registered(): void {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/' . ResetTheme::REST_NAMESPACE . ResetTheme::REST_ROUTE, $routes );
	}

	/**
	 * @return void
	 */
	public function test_can_reset_theme_forbidden_for_subscriber(): void {
		$this->actingAsSubscriber();

		$result = $this->module->canResetTheme();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_forbidden', $result->get_error_code() );
	}

	/**
	 * @return void
	 */
	public function test_can_reset_theme_allows_administrator(): void {
		$this->actingAsAdministrator();

		$this->assertTrue( $this->module->canResetTheme() );
	}

	/**
	 * @return void
	 */
	public function test_reset_theme_noop_returns_success(): void {
		$this->actingAsAdministrator();

		$request  = new WP_REST_Request( 'POST', '/' . ResetTheme::REST_NAMESPACE . ResetTheme::REST_ROUTE );
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'status' => 'SUCCESS' ), $response->get_data() );
	}

	/**
	 * @return void
	 */
	public function test_reset_homepage_settings(): void {
		$this->actingAsAdministrator();

		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Home',
			)
		);

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );
		update_option( 'page_for_posts', $page_id );

		$request = new WP_REST_Request( 'POST', '/' . ResetTheme::REST_NAMESPACE . ResetTheme::REST_ROUTE );
		$request->set_param( 'resetHomepageSettings', true );

		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'posts', get_option( 'show_on_front' ) );
		$this->assertSame( 0, (int) get_option( 'page_on_front' ) );
		$this->assertSame( 0, (int) get_option( 'page_for_posts' ) );
	}

	/**
	 * @return void
	 */
	public function test_reset_styles_clears_user_global_styles(): void {
		$this->actingAsAdministrator();

		$user_styles_id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
		$this->assertIsInt( $user_styles_id );
		$this->assertGreaterThan( 0, $user_styles_id );

		wp_update_post(
			array(
				'ID'           => $user_styles_id,
				'post_content' => wp_json_encode(
					array(
						'version'  => 2,
						'settings' => array(
							'color' => array(
								'palette' => array(
									'theme' => array(
										array(
											'slug'  => 'custom-red',
											'color' => '#ff0000',
											'name'  => 'Custom Red',
										),
									),
								),
							),
						),
						'styles'   => array(
							'color' => array(
								'background' => 'var(--wp--preset--color--custom-red)',
							),
						),
					)
				),
			)
		);

		set_transient( 'global_styles', '1', HOUR_IN_SECONDS );
		set_transient( 'global_styles_' . get_stylesheet(), '1', HOUR_IN_SECONDS );
		set_transient( 'gutenberg_global_styles', '1', HOUR_IN_SECONDS );
		set_transient( 'gutenberg_global_styles_' . get_stylesheet(), '1', HOUR_IN_SECONDS );

		$request = new WP_REST_Request( 'POST', '/' . ResetTheme::REST_NAMESPACE . ResetTheme::REST_ROUTE );
		$request->set_param( 'resetStyles', true );

		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$post    = get_post( $user_styles_id );
		$content = json_decode( (string) $post->post_content, true );
		$this->assertIsArray( $content );
		$this->assertTrue(
			empty( $content['settings'] ) || array() === $content['settings'],
			'User global styles settings should be cleared.'
		);

		$this->assertFalse( get_transient( 'global_styles' ) );
		$this->assertFalse( get_transient( 'global_styles_' . get_stylesheet() ) );
		$this->assertFalse( get_transient( 'gutenberg_global_styles' ) );
		$this->assertFalse( get_transient( 'gutenberg_global_styles_' . get_stylesheet() ) );
	}

	/**
	 * @return void
	 */
	public function test_reset_templates_deletes_custom_templates_only(): void {
		$this->actingAsAdministrator();

		$custom_id = $this->createCustomBlockTemplate( 'wp_template', 'bo-reset-template' );
		$theme_templates_before = get_block_templates();

		$has_custom = false;
		foreach ( $theme_templates_before as $template ) {
			if ( 'custom' === $template->source && (int) $template->wp_id === $custom_id ) {
				$has_custom = true;
				break;
			}
		}
		$this->assertTrue( $has_custom, 'Custom wp_template fixture should be visible to get_block_templates().' );

		$request = new WP_REST_Request( 'POST', '/' . ResetTheme::REST_NAMESPACE . ResetTheme::REST_ROUTE );
		$request->set_param( 'resetTemplates', true );
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( get_post( $custom_id ) );
	}

	/**
	 * @return void
	 */
	public function test_reset_template_parts_deletes_custom_parts_only(): void {
		$this->actingAsAdministrator();

		$custom_id = $this->createCustomBlockTemplate( 'wp_template_part', 'bo-reset-part' );

		$request = new WP_REST_Request( 'POST', '/' . ResetTheme::REST_NAMESPACE . ResetTheme::REST_ROUTE );
		$request->set_param( 'resetTemplateParts', true );
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( get_post( $custom_id ) );
	}

	/**
	 * @return void
	 */
	public function test_rest_forbidden_via_http(): void {
		$this->actingAsSubscriber();

		$request  = new WP_REST_Request( 'POST', '/' . ResetTheme::REST_NAMESPACE . ResetTheme::REST_ROUTE );
		$response = rest_do_request( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Create a custom (DB) block template / template part for the active theme.
	 *
	 * @param string $post_type wp_template or wp_template_part.
	 * @param string $slug      Post slug.
	 *
	 * @return int Post ID.
	 */
	private function createCustomBlockTemplate( string $post_type, string $slug ): int {
		$post_id = self::factory()->post->create(
			array(
				'post_type'    => $post_type,
				'post_status'  => 'publish',
				'post_name'    => $slug,
				'post_title'   => $slug,
				'post_content' => '<!-- wp:paragraph --><p>Custom</p><!-- /wp:paragraph -->',
			)
		);

		wp_set_object_terms( $post_id, get_stylesheet(), 'wp_theme' );

		if ( 'wp_template_part' === $post_type ) {
			wp_set_object_terms( $post_id, 'uncategorized', 'wp_template_part_area', false );
		}

		return $post_id;
	}
}
