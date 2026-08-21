<?php
/**
 * Title: Post Meta
 * Description: Restore pattern for the Post Meta Templates Builder toggle.
 * Slug: blockera-one/builder-post-meta
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":"section/post-meta:default"},"blockeraPropsId":"820192000001","blockeraCompatId":"820192000001","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-820192000001","style":{"spacing":{"blockGap":"0.5em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group blockera-block blockera-block-820192000001">
	<!-- wp:group {"metadata":{"name":"Author Name","blockeraOne":"section/post-meta-author-name:default"},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"metadata":{"blockeraOne":"container/meta-item-prefix:default"}} -->
		<p><?php esc_html_e( 'By', 'blockera-one' ); ?></p>
		<!-- /wp:paragraph -->
		<!-- wp:post-author-name {"metadata":{"blockeraOne":"container/meta-item-block:default"}} /-->
	</div>
	<!-- /wp:group -->
	<!-- wp:paragraph {"metadata":{"blockeraOne":"container/meta-separator:default"}} -->
	<p><?php esc_html_e( '•', 'blockera-one' ); ?></p>
	<!-- /wp:paragraph -->
	<!-- wp:group {"metadata":{"name":"Published Date","blockeraOne":"section/post-meta-post-date:default"},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"metadata":{"blockeraOne":"container/meta-item-prefix:default"}} -->
		<p><?php esc_html_e( 'Published:', 'blockera-one' ); ?></p>
		<!-- /wp:paragraph -->
		<!-- wp:post-date {"isLink":true,"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"date"}}},"blockeraOne":"container/meta-item-block:default"}} /-->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
