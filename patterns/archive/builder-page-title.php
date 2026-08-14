<?php
/**
 * Title: Archive Page Title
 * Description: Simple archive page header with title and term description.
 * Slug: blockera-one/builder-archive-page-title
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"metadata":{"blockeraOne":"section/page-title:default"},"align":"wide","style":{"spacing":{"blockGap":"var:preset|spacing|20","margin":{"bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide" style="margin-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:query-title {"type":"archive","metadata":{"blockeraOne":"section/page-title-title:default"}} /-->
	<!-- wp:term-description {"metadata":{"blockeraOne":"section/page-title-description:default"}} /-->
</div>
<!-- /wp:group -->
