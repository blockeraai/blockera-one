<?php
/**
 * Title: Post Meta 2
 * Description: Restore pattern for the Post Meta Templates Builder toggle.
 * Slug: blockera-one/builder-post-meta-2
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":{"stamp":"section/post-meta-2:default"}},"blockeraPropsId":"820192000002","blockeraCompatId":"820192000002","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-820192000002","style":{"spacing":{"blockGap":"0.5em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group blockera-block blockera-block-820192000002">
	<!-- wp:group {"metadata":{"name":"Author Name Meta","blockeraOne":{"stamp":"section/post-meta-2-author-name:default"}},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"metadata":{"name":"Meta Prefix","blockeraOne":{"stamp":"container/meta-item-prefix:default"}}} -->
		<p><?php esc_html_e( 'By', 'blockera-one' ); ?></p>
		<!-- /wp:paragraph -->
		<!-- wp:post-author-name {"metadata":{"blockeraOne":{"stamp":"container/meta-item-block:default"}}} /-->
	</div>
	<!-- /wp:group -->
	<!-- wp:paragraph {"metadata":{"name":"Separator","blockeraOne":{"stamp":"container/meta-separator:default"}}} -->
	<p>•</p>
	<!-- /wp:paragraph -->
	<!-- wp:group {"metadata":{"name":"Published Date Meta","blockeraOne":{"stamp":"section/post-meta-2-post-date:default"}},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"metadata":{"name":"Meta Prefix","blockeraOne":{"stamp":"container/meta-item-prefix:default"}}} -->
		<p><?php esc_html_e( 'Published:', 'blockera-one' ); ?></p>
		<!-- /wp:paragraph -->
		<!-- wp:post-date {"isLink":true,"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"date"}}},"blockeraOne":{"stamp":"container/meta-item-block:default"}}} /-->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
