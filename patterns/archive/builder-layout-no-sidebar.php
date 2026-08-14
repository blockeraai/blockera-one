<?php
/**
 * Title: Archive layout — no sidebar
 * Slug: blockera-one/builder-archive-layout-no-sidebar
 * Categories: blockera-one/template-builder
 * Inserter: no
 * Description: Archive body layout without sidebar (content area only).
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"tagName":"main","metadata":{"blockeraOne":"layout/archive-body:no-sidebar"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<main class="wp-block-group" style="margin-top:var(--wp--preset--spacing--60)">
	<!-- wp:group {"metadata":{"blockeraOne":"area/content"},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group"></div>
	<!-- /wp:group -->
</main>
<!-- /wp:group -->
