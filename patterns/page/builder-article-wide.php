<?php
/**
 * Title: Page article — wide
 * Description: Full-width page content without a featured image.
 * Slug: blockera-one/builder-page-article-wide
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"tagName":"article","align":"wide","metadata":{"name":"Page","blockeraOne":"section/article:wide"},"layout":{"type":"constrained"}} -->
<article class="wp-block-group alignwide">
	<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":"container/body"},"layout":{"type":"default"}} -->
	<div class="wp-block-group">
		<!-- wp:post-content {"align":"full","layout":{"type":"default"},"metadata":{"blockeraOne":"section/post-content:default"}} /-->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"metadata":{"name":"Comments","blockeraOne":"container/comments"},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group"></div>
	<!-- /wp:group -->
</article>
<!-- /wp:group -->
