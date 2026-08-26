<?php
/**
 * Title: Single post navigation
 * Description: Next and previous post links.
 * Slug: blockera-one/builder-single-post-navigation
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"align":"wide","metadata":{"name":"Post Navigation","blockeraOne":{"stamp":"section/post-navigation:default"}},"style":{"spacing":{"margin":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignwide" style="margin-top:var(--wp--preset--spacing--60);margin-bottom:var(--wp--preset--spacing--60)">
	<!-- wp:group {"tagName":"nav","align":"wide","style":{"border":{"top":{"color":"var:preset|color|accent-6","width":"1px"}},"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
	<nav class="wp-block-group alignwide" style="border-top-color:var(--wp--preset--color--accent-6);border-top-width:1px;padding-top:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40)">
		<!-- wp:post-navigation-link {"type":"previous","showTitle":true,"arrow":"arrow","metadata":{"blockeraOne":{"stamp":"section/post-navigation-previous:default"}}} /-->
		<!-- wp:post-navigation-link {"showTitle":true,"arrow":"arrow","metadata":{"blockeraOne":{"stamp":"section/post-navigation-next:default"}}} /-->
	</nav>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
