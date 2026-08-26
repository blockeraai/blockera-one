<?php
/**
 * Tests for BlockStyles.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Tests\TestCase;
use Blockera\One\Theme\BlockStyles;
use WP_Block_Styles_Registry;

/**
 * Covers Blockera\One\Theme\BlockStyles.
 */
class BlockStylesTest extends TestCase {

	/**
	 * @return void
	 */
	public function tear_down(): void {
		$registry = WP_Block_Styles_Registry::get_instance();
		if ( $registry->is_registered( 'core/list', 'checkmark-list' ) ) {
			$registry->unregister( 'core/list', 'checkmark-list' );
		}

		parent::tear_down();
	}

	/**
	 * @return void
	 */
	public function test_register_hooks_init(): void {
		$module = new BlockStyles();
		$module->register();

		$this->assertSame( 10, has_action( 'init', array( $module, 'registerStyles' ) ) );
	}

	/**
	 * @return void
	 */
	public function test_register_styles_adds_checkmark_list(): void {
		$module = new BlockStyles();
		$module->registerStyles();

		$registry = WP_Block_Styles_Registry::get_instance();
		$this->assertTrue( $registry->is_registered( 'core/list', 'checkmark-list' ) );

		$styles = $registry->get_registered( 'core/list', 'checkmark-list' );
		$this->assertSame( 'Checkmark', $styles['label'] );
		$this->assertStringContainsString( 'checkmark-list', $styles['inline_style'] );
	}
}
