<?php
/**
 * Title: Archive layout — left sidebar
 * Slug: blockera-one/builder-archive-layout-sidebar-left
 * Categories: blockera-one/template-builder
 * Inserter: no
 * Description: Archive body layout with left sidebar and content areas.
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"tagName":"main","metadata":{"blockeraOne":"layout/archive-body:sidebar-left"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<main class="wp-block-group" style="margin-top:var(--wp--preset--spacing--60)">
	<!-- wp:columns {"align":"wide","metadata":{"blockeraOne":"container/layout-columns"},"style":{"spacing":{"blockGap":{"left":"var:preset|spacing|50"}}}} -->
	<div class="wp-block-columns alignwide">
		<!-- wp:column {"width":"33.33%","metadata":{"blockeraOne":"container/sidebar-column"}} -->
		<div class="wp-block-column" style="flex-basis:33.33%">
			<!-- wp:group {"metadata":{"blockeraOne":"area/sidebar-area"},"layout":{"type":"default"}} -->
			<div class="wp-block-group">
				<!-- wp:template-part {"slug":"sidebar","metadata":{"blockeraOne":"section/sidebar"}} /-->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
		<!-- wp:column {"width":"66.66%","metadata":{"blockeraOne":"container/content-column"}} -->
		<div class="wp-block-column" style="flex-basis:66.66%">
			<!-- wp:group {"metadata":{"blockeraOne":"area/content"},"layout":{"type":"constrained"}} -->
			<div class="wp-block-group"></div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</main>
<!-- /wp:group -->
