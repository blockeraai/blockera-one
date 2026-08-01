<?php
/**
 * Custom block style registration.
 *
 * @package blockera-one
 */

namespace Blockera\One\Theme;

/**
 * Registers custom block styles for the theme.
 */
class BlockStyles {

	/**
	 * Attach WordPress hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'registerStyles' ) );
	}

	/**
	 * Registers custom block styles.
	 *
	 * @return void
	 */
	public function registerStyles(): void {
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
}
