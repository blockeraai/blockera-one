<?php
/**
 * E2E mu-plugin: hide the `home` block template from the Site Editor.
 *
 * Prefer `setThemeTemplateHidden('home', true)` (rename to `-home.html`) when
 * the theme is bind-mounted — that matches Blockera One’s `-front-page.html`
 * convention. This filter remains as a fallback for environments where rename
 * is unavailable.
 */

add_filter(
	'get_block_templates',
	static function ( $query_result, $query, $template_type ) {
		if ( 'wp_template' !== $template_type || ! is_array( $query_result ) ) {
			return $query_result;
		}

		$filtered = array();
		foreach ( $query_result as $template ) {
			$slug = is_object( $template ) ? ( $template->slug ?? '' ) : '';
			if ( 'home' === $slug ) {
				continue;
			}
			$filtered[] = $template;
		}

		return $filtered;
	},
	PHP_INT_MAX,
	3
);

add_filter(
	'get_block_file_template',
	static function ( $block_template, $id, $template_type ) {
		if ( 'wp_template' !== $template_type ) {
			return $block_template;
		}

		$id_slug = is_string( $id ) && str_contains( $id, '//' )
			? substr( $id, strrpos( $id, '//' ) + 2 )
			: '';

		if ( 'home' === $id_slug ) {
			return null;
		}

		if ( is_object( $block_template ) && isset( $block_template->slug ) && 'home' === $block_template->slug ) {
			return null;
		}

		return $block_template;
	},
	PHP_INT_MAX,
	3
);
