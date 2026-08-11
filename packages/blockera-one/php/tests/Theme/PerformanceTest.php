<?php
/**
 * Tests for Performance.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Tests\TestCase;
use Blockera\One\Theme\Performance;

/**
 * Covers Blockera\One\Theme\Performance.
 */
class PerformanceTest extends TestCase {

	/**
	 * @var Performance
	 */
	private Performance $module;

	/**
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();

		$this->module = new Performance();
		delete_option( Performance::DISABLE_EMOJIS_OPTION );
	}

	/**
	 * @return void
	 */
	public function tear_down(): void {
		delete_option( Performance::DISABLE_EMOJIS_OPTION );

		// Restore emoji callbacks that disableEmojis() may have removed.
		add_action( 'wp_head', 'print_emoji_detection_script', 7 );
		add_action( 'admin_print_scripts', 'print_emoji_detection_script' );
		add_action( 'embed_head', 'print_emoji_detection_script' );
		add_action( 'wp_print_styles', 'print_emoji_styles' );
		add_action( 'admin_print_styles', 'print_emoji_styles' );
		add_action( 'wp_enqueue_scripts', 'wp_enqueue_emoji_styles' );
		add_action( 'admin_enqueue_scripts', 'wp_enqueue_emoji_styles' );
		add_action( 'enqueue_embed_scripts', 'wp_enqueue_emoji_styles' );
		add_filter( 'the_content_feed', 'wp_staticize_emoji' );
		add_filter( 'comment_text_rss', 'wp_staticize_emoji' );
		add_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );

		remove_filter( 'tiny_mce_plugins', array( $this->module, 'disableEmojisTinymce' ) );
		remove_filter( 'wp_resource_hints', array( $this->module, 'disableEmojisDnsPrefetch' ), 10 );

		parent::tear_down();
	}

	/**
	 * @return void
	 */
	public function test_register_hooks(): void {
		$this->module->register();

		$this->assertSame( 10, has_action( 'init', array( $this->module, 'registerSettings' ) ) );
		$this->assertSame( 20, has_action( 'init', array( $this->module, 'maybeApply' ) ) );
	}

	/**
	 * @return void
	 */
	public function test_register_settings_exposes_rest_boolean(): void {
		$this->module->registerSettings();

		$settings = get_registered_settings();
		$this->assertArrayHasKey( Performance::DISABLE_EMOJIS_OPTION, $settings );
		$this->assertSame( 'boolean', $settings[ Performance::DISABLE_EMOJIS_OPTION ]['type'] );
		$this->assertTrue( $settings[ Performance::DISABLE_EMOJIS_OPTION ]['show_in_rest'] );

		$sanitize = $settings[ Performance::DISABLE_EMOJIS_OPTION ]['sanitize_callback'];
		$this->assertTrue( $sanitize( 1 ) );
		$this->assertFalse( $sanitize( 0 ) );
	}

	/**
	 * @dataProvider disableEmojisEnabledProvider
	 *
	 * @param mixed $raw      Option value to store (null => delete option).
	 * @param bool  $expected Expected enabled state.
	 *
	 * @return void
	 */
	public function test_is_disable_emojis_enabled( $raw, bool $expected ): void {
		if ( null === $raw ) {
			delete_option( Performance::DISABLE_EMOJIS_OPTION );
		} else {
			update_option( Performance::DISABLE_EMOJIS_OPTION, $raw );
		}

		$this->assertSame( $expected, $this->module->isDisableEmojisEnabled() );
	}

	/**
	 * @return array<string, array{0:mixed,1:bool}>
	 */
	public function disableEmojisEnabledProvider(): array {
		return array(
			'missing'       => array( null, true ),
			'bool true'     => array( true, true ),
			'int 1'         => array( 1, true ),
			'string 1'      => array( '1', true ),
			'bool false'    => array( false, false ),
			'int 0'         => array( 0, false ),
			'string 0'      => array( '0', false ),
			'empty string'  => array( '', false ),
		);
	}

	/**
	 * @return void
	 */
	public function test_maybe_apply_skips_when_disabled(): void {
		update_option( Performance::DISABLE_EMOJIS_OPTION, false );

		// Ensure a known emoji action exists before maybeApply.
		add_action( 'wp_head', 'print_emoji_detection_script', 7 );

		$this->module->maybeApply();

		$this->assertNotFalse( has_action( 'wp_head', 'print_emoji_detection_script' ) );
		$this->assertFalse( has_filter( 'tiny_mce_plugins', array( $this->module, 'disableEmojisTinymce' ) ) );
	}

	/**
	 * @return void
	 */
	public function test_maybe_apply_disables_emojis_when_enabled(): void {
		delete_option( Performance::DISABLE_EMOJIS_OPTION );
		add_action( 'wp_head', 'print_emoji_detection_script', 7 );
		add_action( 'admin_print_scripts', 'print_emoji_detection_script' );
		add_action( 'wp_print_styles', 'print_emoji_styles' );

		$this->module->maybeApply();

		$this->assertFalse( has_action( 'wp_head', 'print_emoji_detection_script' ) );
		$this->assertFalse( has_action( 'admin_print_scripts', 'print_emoji_detection_script' ) );
		$this->assertFalse( has_action( 'wp_print_styles', 'print_emoji_styles' ) );
		$this->assertNotFalse( has_filter( 'tiny_mce_plugins', array( $this->module, 'disableEmojisTinymce' ) ) );
		$this->assertNotFalse( has_filter( 'wp_resource_hints', array( $this->module, 'disableEmojisDnsPrefetch' ) ) );
	}

	/**
	 * @return void
	 */
	public function test_disable_emojis_tinymce_filters_array(): void {
		$result = $this->module->disableEmojisTinymce( array( 'wordpress', 'wpemoji', 'link' ) );
		$this->assertSame( array( 'wordpress', 'link' ), $result );
	}

	/**
	 * @return void
	 */
	public function test_disable_emojis_tinymce_passthrough_non_array(): void {
		$this->assertSame( 'nope', $this->module->disableEmojisTinymce( 'nope' ) );
		$this->assertNull( $this->module->disableEmojisTinymce( null ) );
	}

	/**
	 * @return void
	 */
	public function test_disable_emojis_dns_prefetch_filters_emoji_cdn(): void {
		$urls = array(
			'https://s.w.org/images/core/emoji/14.0.0/svg/',
			'https://example.com/prefetch',
			123,
		);

		$result = $this->module->disableEmojisDnsPrefetch( $urls, 'dns-prefetch' );

		$this->assertSame( array( 'https://example.com/prefetch' ), $result );
	}

	/**
	 * @return void
	 */
	public function test_disable_emojis_dns_prefetch_passthrough(): void {
		$urls = array( 'https://s.w.org/images/core/emoji/14.0.0/svg/' );

		$this->assertSame( $urls, $this->module->disableEmojisDnsPrefetch( $urls, 'preconnect' ) );
		$this->assertSame( 'x', $this->module->disableEmojisDnsPrefetch( 'x', 'dns-prefetch' ) );
	}
}
