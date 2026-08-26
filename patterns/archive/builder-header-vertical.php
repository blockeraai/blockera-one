<?php
/**
 * Title: Archive vertical header rail
 * Slug: blockera-one/builder-archive-header-vertical
 * Categories: blockera-one/template-builder
 * Inserter: no
 * Description: Vertical-rail chrome frame — narrow header column beside an empty body area the builder fills with the archive layout.
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:columns {"isStackedOnMobile":false,"metadata":{"blockeraOne":{"stamp":"container/chrome-rail:vertical-rail"}},"style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"},"blockGap":{"left":"0"}}}} -->
<div class="wp-block-columns is-not-stacked-on-mobile" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
	<!-- wp:column {"width":"8rem"} -->
	<div class="wp-block-column" style="flex-basis:8rem">
		<!-- wp:template-part {"slug":"vertical-header","area":"header","tagName":"header","metadata":{"blockeraOne":{"stamp":"section/header:vertical-header"}}} /-->
	</div>
	<!-- /wp:column -->

	<!-- wp:column {"width":"90%","metadata":{"blockeraOne":{"stamp":"area/rail-body-area"}},"style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}}},"layout":{"type":"default"}} -->
	<div class="wp-block-column" style="padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--50);flex-basis:90%"></div>
	<!-- /wp:column -->
</div>
<!-- /wp:columns -->
