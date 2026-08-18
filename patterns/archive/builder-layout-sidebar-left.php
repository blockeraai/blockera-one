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
<!-- wp:group {"tagName":"main","metadata":{"blockeraOne":"layout/main:sidebar-left"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<main class="wp-block-group" style="margin-top:var(--wp--preset--spacing--60);margin-bottom:var(--wp--preset--spacing--60)">
	<!-- wp:columns {"metadata":{"blockeraOne":"container/layout-columns"},"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|50"}}}} -->
	<div class="wp-block-columns alignwide">
		<!-- wp:column {"width":"33.33%","metadata":{"blockeraOne":"container/sidebar-column"}} -->
		<div class="wp-block-column" style="flex-basis:33.33%">
			<!-- wp:group {"metadata":{"blockeraOne":"area/sidebar-area"},"layout":{"type":"default"}} -->
			<div class="wp-block-group">
				<!-- wp:template-part {"slug":"sidebar","theme":"blockera-one","metadata":{"blockeraOne":"section/sidebar"}} /-->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"width":"66.66%","metadata":{"blockeraOne":"container/content-column"}} -->
		<div class="wp-block-column" style="flex-basis:66.66%">
			<!-- wp:group {"metadata":{"blockeraOne":"area/content"},"blockeraPropsId":"715141033738","blockeraCompatId":"715141033738","blockeraGap":{"value":{"lock":true,"gap":"0px","columns":"","rows":""}},"className":"blockera-block blockera-block-fem0s2","style":{"spacing":{"blockGap":"0px"}},"layout":{"type":"constrained"}} -->
			<div class="wp-block-group blockera-block blockera-block-fem0s2"></div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</main>
<!-- /wp:group -->
