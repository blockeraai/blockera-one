<?php
/**
 * Title: Page article — default
 * Description: Page content without a featured image.
 * Slug: blockera-one/builder-page-article-default
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"tagName":"article","metadata":{"name":"Page","blockeraOne":"section/article:default"},"layout":{"type":"constrained"}} -->
<article class="wp-block-group">
	<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":"container/body"},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:post-content {"align":"full","layout":{"type":"constrained"},"metadata":{"blockeraOne":"section/post-content:default"}} /-->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"metadata":{"name":"Comments","blockeraOne":"container/comments"},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group"></div>
	<!-- /wp:group -->
</article>
<!-- /wp:group -->
