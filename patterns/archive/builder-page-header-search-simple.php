<?php
/**
 * Title: Search Page Header
 * Description: Simple search page header with search title and search form.
 * Slug: blockera-one/builder-archive-page-header-search-simple
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"metadata":{"name":"Page Header","blockeraOne":{"stamp":"section/page-header:simple"}},"blockeraId":"gedb94","blockeraDisplay":{"value":"flex"},"blockeraFlexLayout":{"value":{"direction":"column","alignItems":"flex-start","justifyContent":"center"}},"blockeraGap":{"value":{"lock":true,"gap":{"settings":{"name":"Tiny","id":"20","value":"10px","reference":{"type":"theme","theme":"Blockera One"},"type":"spacing","var":"--wp--preset--spacing--20"},"name":"Tiny","isValueAddon":true,"valueType":"variable"},"columns":"","rows":""}},"blockeraSpacing":{"value":{"padding":{"top":"","right":"","bottom":"","left":""},"margin":{"top":"","right":"","bottom":{"settings":{"name":"Regular","id":"50","value":"clamp(30px, 5vw, 50px)","reference":{"type":"theme","theme":"Blockera One"},"type":"spacing","var":"--wp--preset--spacing--50"},"name":"Regular","isValueAddon":true,"valueType":"variable"},"left":""}}},"align":"wide","className":"blockera-block blockera-block-gedb94","style":{"spacing":{"blockGap":"var:preset|spacing|20","margin":{"bottom":"var:preset|spacing|50"}}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"center","justifyContent":"left"}} -->
<div class="wp-block-group alignwide blockera-block blockera-block-gedb94" style="margin-bottom:var(--wp--preset--spacing--50)">
	<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":{"stamp":"container/body"}},"blockeraId":"y767nz","blockeraDisplay":{"value":"flex"},"blockeraFlexLayout":{"value":{"direction":"column","alignItems":"","justifyContent":""}},"blockeraGap":{"value":{"lock":true,"gap":{"settings":{"id":"20","name":"Tiny","type":"spacing","reference":{"type":"theme","theme":"Blockera One"},"value":"10px","var":"--wp--preset--spacing--20"},"name":"Tiny","isValueAddon":true,"valueType":"variable"},"columns":"","rows":""}},"className":"blockera-block blockera-block-y767nz","style":{"spacing":{"blockGap":"var:preset|spacing|20"}},"layout":{"type":"flex","orientation":"vertical"}} -->
	<div class="wp-block-group blockera-block blockera-block-y767nz">
		<!-- wp:query-title {"type":"search","metadata":{"blockeraOne":{"stamp":"section/page-header-title:default"}},"className":"is-style-default","style":{"color":[],"typography":[]}} /-->

		<!-- wp:search {"label":"<?php esc_html_e( 'Search', 'blockera-one' ); ?>","showLabel":false,"buttonText":"<?php esc_html_e( 'Search', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/page-header-search-form:default"}}} /-->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
