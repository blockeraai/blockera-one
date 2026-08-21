<?php
/**
 * Title: Single comments
 * Description: Comments area with title, list, pagination, and form.
 * Slug: blockera-one/builder-single-comments
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
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
