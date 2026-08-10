<?php
/**
 * Temporary mu-plugin: register a viewable Book CPT for Single Templates e2e.
 */

add_action(
	'init',
	static function () {
		register_post_type(
			'bo_book',
			array(
				'labels'       => array(
					'name'          => 'Books',
					'singular_name' => 'Book',
				),
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
				'has_archive'  => false,
				'supports'     => array( 'title', 'editor' ),
			)
		);
	}
);
