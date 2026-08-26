<?php
/**
 * Tests for TemplateSettings.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Theme\TemplateSettings;
use Blockera\One\Tests\TestCase;

/**
 * @covers \Blockera\One\Theme\TemplateSettings
 */
class TemplateSettingsTest extends TestCase {

	/**
	 * @var TemplateSettings
	 */
	private TemplateSettings $settings;

	public function set_up(): void {
		parent::set_up();
		$this->settings = new TemplateSettings();
		delete_option( TemplateSettings::OPTION );
	}

	public function tear_down(): void {
		unregister_setting( 'general', TemplateSettings::OPTION );
		delete_option( TemplateSettings::OPTION );
		parent::tear_down();
	}

	public function test_sanitize_settings_keeps_valid_posts_per_page(): void {
		$result = $this->settings->sanitizeSettings(
			array(
				'posts_per_page' => array(
					'archive'  => 9,
					'category' => 12,
					'bad'      => 0,
					'huge'     => 999,
				),
			)
		);

		$this->assertSame( 9, $result['posts_per_page']['archive'] );
		$this->assertSame( 12, $result['posts_per_page']['category'] );
		$this->assertArrayNotHasKey( 'bad', $result['posts_per_page'] );
		$this->assertSame( 100, $result['posts_per_page']['huge'] );
	}

	public function test_sanitize_settings_clamps_sidebar_width(): void {
		$result = $this->settings->sanitizeSettings(
			array(
				'posts_per_page' => array(
					'archive' => 9,
				),
				'sidebar_width'  => '5%',
			)
		);
		$this->assertSame( '10', $result['sidebar_width'] );
		$this->assertSame( 9, $result['posts_per_page']['archive'] );

		$high = $this->settings->sanitizeSettings(
			array(
				'posts_per_page' => array(),
				'sidebar_width'  => 99,
			)
		);
		$this->assertSame( '60', $high['sidebar_width'] );

		$mid = $this->settings->sanitizeSettings(
			array(
				'sidebar_width' => '33.336',
			)
		);
		$this->assertSame( '33.34', $mid['sidebar_width'] );
		$this->assertSame( array(), $mid['posts_per_page'] );

		$sticky = $this->settings->sanitizeSettings(
			array(
				'header_sticky' => true,
			)
		);
		$this->assertSame( '1', $sticky['header_sticky'] );
	}

	public function test_sanitize_settings_handles_invalid_input(): void {
		$result = $this->settings->sanitizeSettings( 'nope' );
		$this->assertSame( array( 'posts_per_page' => array() ), $result );
	}

	public function test_register_exposes_setting_in_rest(): void {
		// Firing do_action('init') would re-run every init hook (core block
		// re-registration notices), so assert the hooks and call the
		// registration callback directly.
		$this->settings->register();
		$this->assertNotFalse(
			has_action( 'init', array( $this->settings, 'registerSettings' ) )
		);
		$this->assertNotFalse(
			has_action( 'pre_get_posts', array( $this->settings, 'applyPostsPerPage' ) )
		);

		$this->settings->registerSettings();

		$registered = get_registered_settings();
		$this->assertArrayHasKey( TemplateSettings::OPTION, $registered );
		$this->assertTrue( ! empty( $registered[ TemplateSettings::OPTION ]['show_in_rest'] ) );
	}

	public function test_resolve_purpose_key_for_category(): void {
		$query               = new \WP_Query();
		$query->is_category  = true;
		$GLOBALS['wp_the_query'] = $query;

		$this->assertSame( 'category', $this->settings->resolvePurposeKey( $query ) );
	}

	public function test_apply_posts_per_page_on_archive_main_query(): void {
		update_option(
			TemplateSettings::OPTION,
			array(
				'posts_per_page' => array(
					'archive' => 7,
				),
			)
		);

		$query                   = new \WP_Query();
		$query->is_archive       = true;
		$GLOBALS['wp_the_query'] = $query;
		$GLOBALS['wp_query']     = $query;

		$this->settings->applyPostsPerPage( $query );

		$this->assertSame( 7, (int) $query->get( 'posts_per_page' ) );
	}
}
