<?php
/**
 * Title: Single article — content
 * Description: Single post content without a featured image.
 * Slug: blockera-one/builder-single-article-content
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"tagName":"article","metadata":{"name":"Post","blockeraOne":{"stamp":"section/article:content"}},"layout":{"type":"constrained"}} -->
<article class="wp-block-group">
	<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":{"stamp":"container/body"}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:post-content {"metadata":{"blockeraOne":{"stamp":"section/post-content:default"}},"align":"full","layout":{"type":"default"}} /-->

		<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":{"stamp":"section/post-meta:default","metaSeparator":"bullet"}},"blockeraId":"mmcud0","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-mmcud0","layout":{"type":"flex","flexWrap":"nowrap"}} -->
		<div class="wp-block-group blockera-block blockera-block-mmcud0">
			<!-- wp:group {"metadata":{"name":"Modified Date Meta","blockeraOne":{"stamp":"section/post-meta-modified-date:default"}},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
			<div class="wp-block-group">
				<!-- wp:paragraph {"metadata":{"name":"Meta Prefix","blockeraOne":{"stamp":"container/meta-item-prefix:default"}}} -->
				<p><?php esc_html_e( 'Updated on', 'blockera-one' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:post-date {"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"modified"}}},"blockeraOne":{"stamp":"container/meta-item-block:default"}},"className":"wp-block-post-date__modified-date"} /-->
			</div>
			<!-- /wp:group -->

			<!-- wp:paragraph {"metadata":{"name":"Separator","blockeraOne":{"stamp":"container/meta-separator:default"}}} -->
			<p>•</p>
			<!-- /wp:paragraph -->

			<!-- wp:group {"metadata":{"name":"Author Name Meta","blockeraOne":{"stamp":"section/post-meta-author-name:default"}},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
			<div class="wp-block-group">
				<!-- wp:paragraph {"metadata":{"name":"Meta Prefix","blockeraOne":{"stamp":"container/meta-item-prefix:default"}}} -->
				<p><?php esc_html_e( 'By', 'blockera-one' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:post-author-name {"metadata":{"blockeraOne":{"stamp":"container/meta-item-block:default"}}} /-->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"metadata":{"name":"Comments","blockeraOne":{"stamp":"container/comments"}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group"></div>
	<!-- /wp:group -->
</article>
<!-- /wp:group -->
