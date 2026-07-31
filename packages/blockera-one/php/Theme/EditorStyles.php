<?php
/**
 * Editor stylesheet registration.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Registers editor-style.css for the block editor.
 */
class EditorStyles {

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'after_setup_theme', array( $this, 'addEditorStyle' ) );
	}

	/**
	 * Enqueues editor-style.css in the editors.
	 *
	 * @return void
	 */
	public function addEditorStyle(): void {
		add_editor_style( 'assets/css/editor-style.css' );
	}
}
