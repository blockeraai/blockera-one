<?php
/**
 * Title: Single article — default
 * Description: Single post content with featured image, full content, tags, navigation, and comments.
 * Slug: blockera-one/builder-single-article-default
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"tagName":"article","metadata":{"name":"Post","blockeraOne":"section/article:default"},"layout":{"type":"constrained"}} -->
<article class="wp-block-group">
	<!-- wp:group {"metadata":{"name":"Media Blocks","blockeraOne":"container/media"},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:post-featured-image {"aspectRatio":"3/2","metadata":{"blockeraOne":"section/post-featured-image:default"}} /-->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":"container/body"},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:post-content {"align":"full","layout":{"type":"constrained"},"metadata":{"blockeraOne":"section/post-content:default"}} /-->

		<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":"section/post-meta:default"},"blockeraPropsId":"820192000016","blockeraCompatId":"820192000016","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-820192000016","layout":{"type":"flex","flexWrap":"nowrap"}} -->
		<div class="wp-block-group blockera-block blockera-block-820192000016">
			<!-- wp:group {"metadata":{"name":"Tags Meta","blockeraOne":"section/post-meta-tags:default"},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
			<div class="wp-block-group">
				<!-- wp:post-terms {"term":"post_tag","separator":"  ","className":"is-style-post-terms-1","metadata":{"blockeraOne":"container/meta-item-block:default"}} /-->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->

		<!-- wp:group {"align":"wide","metadata":{"name":"Post Navigation","blockeraOne":"section/post-navigation:default"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"default"}} -->
		<div class="wp-block-group alignwide" style="margin-top:var(--wp--preset--spacing--60);margin-bottom:var(--wp--preset--spacing--60)">
			<!-- wp:group {"tagName":"nav","align":"wide","style":{"border":{"top":{"color":"var:preset|color|accent-6","width":"1px"}},"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
			<nav class="wp-block-group alignwide" style="border-top-color:var(--wp--preset--color--accent-6);border-top-width:1px;padding-top:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40)">
				<!-- wp:post-navigation-link {"type":"previous","showTitle":true,"arrow":"arrow","metadata":{"blockeraOne":"section/post-navigation-previous:default"}} /-->
				<!-- wp:post-navigation-link {"showTitle":true,"arrow":"arrow","metadata":{"blockeraOne":"section/post-navigation-next:default"}} /-->
			</nav>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"metadata":{"name":"Comments","blockeraOne":"container/comments"},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:comments {"className":"wp-block-comments-query-loop","metadata":{"blockeraOne":"section/post-comments:default"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}}} -->
		<div class="wp-block-comments wp-block-comments-query-loop" style="margin-top:var(--wp--preset--spacing--70);margin-bottom:var(--wp--preset--spacing--70)">
			<!-- wp:comments-title {"level":3,"fontSize":"large","metadata":{"blockeraOne":"section/comments-title:default"}} /-->
			<!-- wp:comment-template {"metadata":{"blockeraOne":"section/comment-template:default"}} -->
				<!-- wp:group {"style":{"spacing":{"margin":{"top":"0","bottom":"var:preset|spacing|50"}}}} -->
				<div class="wp-block-group" style="margin-top:0;margin-bottom:var(--wp--preset--spacing--50)">
					<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"top"}} -->
					<div class="wp-block-group">
						<!-- wp:avatar {"size":50} /-->
						<!-- wp:group -->
						<div class="wp-block-group">
							<!-- wp:comment-date /-->
							<!-- wp:comment-author-name /-->
							<!-- wp:comment-content /-->
							<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
							<div class="wp-block-group">
								<!-- wp:comment-edit-link /-->
								<!-- wp:comment-reply-link /-->
							</div>
							<!-- /wp:group -->
						</div>
						<!-- /wp:group -->
					</div>
					<!-- /wp:group -->
				</div>
				<!-- /wp:group -->
			<!-- /wp:comment-template -->
			<!-- wp:comments-pagination {"metadata":{"blockeraOne":"section/comments-pagination:default"},"layout":{"type":"flex","justifyContent":"space-between"}} -->
				<!-- wp:comments-pagination-previous /-->
				<!-- wp:comments-pagination-next /-->
			<!-- /wp:comments-pagination -->
			<!-- wp:post-comments-form {"metadata":{"blockeraOne":"section/comments-form:default"}} /-->
		</div>
		<!-- /wp:comments -->
	</div>
	<!-- /wp:group -->
</article>
<!-- /wp:group -->
