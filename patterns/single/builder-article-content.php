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
<!-- wp:group {"tagName":"article","metadata":{"name":"Post","blockeraOne":"section/article:content"},"layout":{"type":"constrained"}} -->
<article class="wp-block-group">
	<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":"container/body","blockeraOneInnerOrder":["post-featured-image","post-title","post-excerpt","post-content","post-read-more","post-meta","post-meta-2"]},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:post-content {"align":"full","layout":{"type":"constrained"},"metadata":{"blockeraOne":"section/post-content:default"}} /-->

		<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":"section/post-meta:default"},"blockeraPropsId":"820192000017","blockeraCompatId":"820192000017","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-820192000017","layout":{"type":"flex","flexWrap":"nowrap"}} -->
		<div class="wp-block-group blockera-block blockera-block-820192000017">
			<!-- wp:group {"metadata":{"name":"Tags Meta","blockeraOne":"section/post-meta-tags:default"},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
			<div class="wp-block-group">
				<!-- wp:post-terms {"term":"post_tag","separator":"  ","className":"is-style-post-terms-1","metadata":{"blockeraOne":"container/meta-item-block:default"}} /-->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"metadata":{"name":"Comments","blockeraOne":"container/comments"},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group"></div>
	<!-- /wp:group -->
</article>
<!-- /wp:group -->
