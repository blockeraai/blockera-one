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
		<!-- wp:post-content {"align":"full","layout":{"type":"constrained"},"metadata":{"blockeraOne":{"stamp":"section/post-content:default"}}} /-->

		<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":{"stamp":"section/post-meta:default","metaSeparator":"bullet"}},"blockeraPropsId":"820192000016","blockeraCompatId":"820192000016","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-820192000016","layout":{"type":"flex","flexWrap":"nowrap"}} -->
		<div class="wp-block-group blockera-block blockera-block-820192000016">
			<!-- wp:group {"metadata":{"name":"Modified Date Meta","blockeraOne":{"stamp":"section/post-meta-modified-date:default","metaParts":{"icon":{"icon":"update","library":"wp","uploadSVG":"","svgString":"","renderedIcon":""},"prefix":"Updated on"}}},"blockeraPropsId":"722165257768","blockeraCompatId":"722165257768","className":"blockera-block blockera-block-722165257768","style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
			<div class="wp-block-group blockera-block blockera-block-722165257768">
				<!-- wp:paragraph {"metadata":{"name":"Meta Prefix","blockeraOne":{"stamp":"container/meta-item-prefix:default"}},"blockeraPropsId":"72216530215","blockeraCompatId":"72216530215"} -->
				<p><?php esc_html_e( 'Updated on', 'blockera-one' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:post-date {"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"modified"}}},"blockeraOne":{"stamp":"container/meta-item-block:default"}},"blockeraPropsId":"722165257769","blockeraCompatId":"722165257769","className":"wp-block-post-date__modified-date blockera-block blockera-block-722165257769"} /-->
			</div>
			<!-- /wp:group -->

			<!-- wp:paragraph {"metadata":{"name":"Separator","blockeraOne":{"stamp":"container/meta-separator:default"}},"blockeraPropsId":"722165335936","blockeraCompatId":"722165335936"} -->
			<p>•</p>
			<!-- /wp:paragraph -->

			<!-- wp:group {"metadata":{"name":"Author Name Meta","blockeraOne":{"stamp":"section/post-meta-author-name:default","metaParts":{"icon":{"icon":"comment-author-avatar","library":"wp","uploadSVG":"","svgString":"","renderedIcon":""},"prefix":"By"}}},"blockeraPropsId":"722165250368","blockeraCompatId":"722165250369","className":"blockera-block blockera-block-722165250369","style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
			<div class="wp-block-group blockera-block blockera-block-722165250369">
				<!-- wp:paragraph {"metadata":{"name":"Meta Prefix","blockeraOne":{"stamp":"container/meta-item-prefix:default"}},"blockeraPropsId":"72216530216","blockeraCompatId":"72216530216"} -->
				<p><?php esc_html_e( 'By', 'blockera-one' ); ?></p>
				<!-- /wp:paragraph -->

				<!-- wp:post-author-name {"metadata":{"blockeraOne":{"stamp":"container/meta-item-block:default"}},"blockeraPropsId":"722165250370","blockeraCompatId":"722165250370","className":"blockera-block blockera-block-722165250370"} /-->
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
