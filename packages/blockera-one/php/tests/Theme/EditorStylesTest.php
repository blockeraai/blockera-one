<?php
/**
 * Tests for EditorStyles.
 *
 * @package blockera-one
 */

namespace Blockera\One\Tests\Theme;

use Blockera\One\Tests\TestCase;
use Blockera\One\Theme\EditorStyles;

/**
 * Covers Blockera\One\Theme\EditorStyles.
 */
class EditorStylesTest extends TestCase {

	/**
	 * @return void
	 */
	public function test_register_hooks_after_setup_theme(): void {
		$module = new EditorStyles();
		$module->register();

		$this->assertSame( 10, has_action( 'after_setup_theme', array( $module, 'addEditorStyle' ) ) );
	}

	/**
	 * @return void
	 */
	public function test_add_editor_style_registers_stylesheet(): void {
		$module = new EditorStyles();
		$module->addEditorStyle();

		global $editor_styles;

		$this->assertIsArray( $editor_styles );
		$this->assertContains( 'assets/css/editor-style.css', $editor_styles );
	}
}
