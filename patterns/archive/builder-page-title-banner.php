<?php
/**
 * Title: Archive Page Title Banner
 * Description: Full-bleed contrast banner with centered archive title and term description.
 * Slug: blockera-one/builder-archive-page-title-banner
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"metadata":{"blockeraOne":"section/page-title:banner"},"blockeraPropsId":"71513334485","blockeraCompatId":"71513428806","blockeraDisplay":{"value":"flex"},"blockeraFlexLayout":{"value":{"direction":"column","alignItems":"flex-start","justifyContent":"center"}},"blockeraGap":{"value":{"lock":true,"gap":{"settings":{"name":"Tiny","id":"20","value":"10px","reference":{"type":"theme","theme":"Blockera One"},"type":"spacing","var":"--wp--preset--spacing--20"},"name":"Tiny","isValueAddon":true,"valueType":"variable"},"columns":"","rows":""}},"blockeraSpacing":{"value":{"padding":{"top":"","right":"","bottom":"","left":""},"margin":{"top":"","right":"","bottom":{"settings":{"name":"Regular","id":"50","value":"clamp(30px, 5vw, 50px)","reference":{"type":"theme","theme":"Blockera One"},"type":"spacing","var":"--wp--preset--spacing--50"},"name":"Regular","isValueAddon":true,"valueType":"variable"},"left":""}}},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|50","right":"var:preset|spacing|50"},"margin":{"bottom":"var:preset|spacing|50"},"blockGap":"var:preset|spacing|20"}},"backgroundColor":"contrast","textColor":"base","layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group alignfull has-base-color has-contrast-background-color has-text-color has-background" style="margin-bottom:var(--wp--preset--spacing--50);padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--50)">
	<!-- wp:query-title {"type":"archive","metadata":{"blockeraOne":"section/page-title-title:default"},"blockeraPropsId":"71514641563","blockeraCompatId":"71514641563","className":"blockera-block blockera-block-71514641563 is-style-default","style":{"color":{},"typography":{}}} /-->

	<!-- wp:term-description {"metadata":{"blockeraOne":"section/page-title-description:default"},"blockeraPropsId":"71514641565","blockeraCompatId":"71514641565","className":"blockera-block blockera-block-71514641565 is-style-default","style":{"color":{},"typography":{}}} /-->
</div>
<!-- /wp:group -->
