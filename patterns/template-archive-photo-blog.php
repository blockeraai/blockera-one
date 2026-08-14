<?php
/**
 * Title: Photo blog archive
 * Slug: blockera-one/template-archive-photo-blog
 * Template Types: archive
 * Viewport width: 1400
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>

<!-- wp:template-part {"slug":"header"} /-->

<!-- wp:group {"tagName":"main","style":{"spacing":{"margin":{"top":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<main class="wp-block-group" style="margin-top:var(--wp--preset--spacing--60)">
	<!-- wp:group {"metadata":{"blockeraOne":"section/page-title:default"},"style":{"spacing":{"blockGap":"var:preset|spacing|20","margin":{"bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group" style="margin-bottom:var(--wp--preset--spacing--50)">
		<!-- wp:query-title {"type":"archive","textAlign":"center","metadata":{"blockeraOne":"section/page-title-title:default"}} /-->
		<!-- wp:term-description {"textAlign":"center","metadata":{"blockeraOne":"section/page-title-description:default"}} /-->
	</div>
	<!-- /wp:group -->
	<!-- wp:pattern {"slug":"blockera-one/template-query-loop-photo-blog"} /-->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer"} /-->
