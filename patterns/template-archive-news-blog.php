<?php
/**
 * Title: News blog archive
 * Slug: blockera-one/template-archive-news-blog
 * Template Types: archive
 * Viewport width: 1400
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:template-part {"slug":"header-large-title"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
	<!-- wp:group {"align":"wide","layout":{"type":"default"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:spacer {"height":"var:preset|spacing|80"} -->
		<div style="height:var(--wp--preset--spacing--80)" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->
		<!-- wp:group {"metadata":{"blockeraOne":{"stamp":"section/page-header:default"}},"style":{"spacing":{"blockGap":"var:preset|spacing|20"}},"layout":{"type":"constrained"}} -->
		<div class="wp-block-group">
			<!-- wp:query-title {"type":"archive","metadata":{"blockeraOne":{"stamp":"section/page-header-title:default"}}} /-->
			<!-- wp:term-description {"metadata":{"blockeraOne":{"stamp":"section/page-header-description:default"}}} /-->
		</div>
		<!-- /wp:group -->
		<!-- wp:spacer {"height":"var:preset|spacing|40"} -->
		<div style="height:var(--wp--preset--spacing--40)" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->
	</div>
	<!-- /wp:group -->
	<!-- wp:group {"align":"wide","layout":{"type":"default"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:pattern {"slug":"blockera-one/template-query-loop-news-blog"} /-->
	</div>
	<!-- /wp:group -->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer-newsletter"} /-->
