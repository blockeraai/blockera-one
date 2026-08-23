<?php
/**
 * Title: Archive posts listing — 3 column grid
 * Slug: blockera-one/builder-archive-listing-grid-3
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:query {"query":{"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true,"taxQuery":null,"parents":[],"excludeCurrent":null},"metadata":{"blockeraOne":{"stamp":"section/posts-listing:grid-3"},"name":"Posts Query Loop"},"align":"wide","className":"blockera-block blockera-block-d0a989ac-b6bf-4653-8142-4b0023b5baa1","layout":{"type":"default"}} -->
<div class="wp-block-query alignwide blockera-block blockera-block-d0a989ac-b6bf-4653-8142-4b0023b5baa1">
	<!-- wp:post-template {"blockeraPropsId":"fc5ccec6-68f4-4d63-ab6e-513a5a5b4021","blockeraCompatId":"fc5ccec6-68f4-4d63-ab6e-513a5a5b4021","blockeraGap":{"value":{"lock":true,"gap":{"settings":{"id":"40","name":"Small","type":"spacing","reference":{"type":"theme","theme":"Blockera One"},"value":"30px","var":"--wp--preset--spacing--40"},"name":"Small","isValueAddon":true,"valueType":"variable"},"columns":"","rows":""}},"blockeraGridColumnCount":{"value":3},"className":"blockera-block blockera-block-jwp54r","style":{"spacing":{"blockGap":"var:preset|spacing|40"}},"layout":{"type":"grid","columnCount":3}} -->
		<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":{"stamp":"container/body"}},"blockeraPropsId":"b9cf94aa-8c0e-467a-8e41-17fe497b7b81","blockeraCompatId":"b9cf94aa-8c0e-467a-8e41-17fe497b7b81","style":{"spacing":{"blockGap":"var:preset|spacing|20"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"}} -->
		<div class="wp-block-group">
			<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"1","metadata":{"blockeraOne":{"stamp":"section/post-featured-image:default"}},"blockeraPropsId":"d9c85f74-4b2f-4330-bafa-a6bde8e6f5fa","blockeraCompatId":"d9c85f74-4b2f-4330-bafa-a6bde8e6f5fa"} /-->

			<!-- wp:post-title {"isLink":true,"metadata":{"blockeraOne":{"stamp":"section/post-title:default"}},"blockeraPropsId":"db0f85b5-e270-4691-bd34-00e43db9545e","blockeraCompatId":"db0f85b5-e270-4691-bd34-00e43db9545e","fontSize":"medium"} /-->

			<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":{"stamp":"section/post-meta:default","metaSeparator":"none"}},"blockeraPropsId":"61e0c2af-4c61-4c61-a17b-c19fa5d39992","blockeraCompatId":"61e0c2af-4c61-4c61-a17b-c19fa5d39992","blockeraFlexChildSizing":{"value":"grow"},"blockeraDisplay":{"value":"flex"},"blockeraFlexWrap":{"value":{"val":"nowrap","reverse":false}},"blockeraWidth":{"value":"stretch"},"blockeraFontSize":{"value":{"settings":{"id":"medium","name":"Medium","type":"font-size","reference":{"type":"theme","theme":"Blockera One"},"value":"1rem","var":"--wp--preset--font-size--medium","fluid":{"max":"1.125rem","min":"1rem"}},"name":"Medium","isValueAddon":true,"valueType":"variable"}},"className":"blockera-block blockera-block-61e0c2af-4c61-4c61-a17b-c19fa5d39992","style":{"typography":[]},"fontSize":"medium","layout":{"type":"flex","flexWrap":"nowrap"}} -->
			<div class="wp-block-group blockera-block blockera-block-61e0c2af-4c61-4c61-a17b-c19fa5d39992 has-medium-font-size">
				<!-- wp:group {"metadata":{"name":"Published Date Meta","blockeraOne":{"stamp":"section/post-meta-post-date:default"}},"blockeraPropsId":"93234b5a-2cb3-4293-9649-26c694fb1b8f","blockeraCompatId":"93234b5a-2cb3-4293-9649-26c694fb1b8f","style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
				<div class="wp-block-group">
					<!-- wp:post-date {"isLink":true,"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"date"}}},"blockeraOne":{"stamp":"container/meta-item-block:default"}},"blockeraPropsId":"2726fc08-b907-4846-82a3-88938af1ff2d","blockeraCompatId":"2726fc08-b907-4846-82a3-88938af1ff2d","fontSize":"small"} /-->
				</div>
				<!-- /wp:group -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	<!-- /wp:post-template -->

	<!-- wp:query-no-results {"blockeraPropsId":"ad4ea222-afae-4453-9734-eb50b70b3cc6","blockeraCompatId":"ad4ea222-afae-4453-9734-eb50b70b3cc6"} -->
		<!-- wp:paragraph {"blockeraPropsId":"f8ca4acb-21b6-4766-ab80-b4f148cb64a5","blockeraCompatId":"f8ca4acb-21b6-4766-ab80-b4f148cb64a5"} -->
		<p><?php esc_html_e( 'Sorry, but nothing was found. Please try a search with different keywords.', 'blockera-one' ); ?></p>
		<!-- /wp:paragraph -->
	<!-- /wp:query-no-results -->

	<!-- wp:group {"blockeraPropsId":"dde3eb3c-746b-4892-a1ef-e22c609fc712","blockeraCompatId":"dde3eb3c-746b-4892-a1ef-e22c609fc712","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40)">
		<!-- wp:query-pagination {"paginationArrow":"arrow","metadata":{"blockeraOne":{"stamp":"section/pagination:standard"}},"blockeraPropsId":"00779686-1594-4911-a3e5-b22f66bcf137","blockeraCompatId":"00779686-1594-4911-a3e5-b22f66bcf137","blockeraFlexLayout":{"value":{"direction":"row","alignItems":"","justifyContent":"space-between"}},"align":"wide","className":"blockera-block blockera-block-00779686-1594-4911-a3e5-b22f66bcf137 is-style-default","layout":{"type":"flex","justifyContent":"space-between","orientation":"horizontal"}} -->
			<!-- wp:query-pagination-previous {"label":"<?php esc_html_e( 'Previous Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/pagination-previous:default"}},"blockeraPropsId":"f4436edd-d0f9-4f57-94ee-ca2eb2331082","blockeraCompatId":"f4436edd-d0f9-4f57-94ee-ca2eb2331082"} /-->

			<!-- wp:query-pagination-numbers {"metadata":{"blockeraOne":{"stamp":"section/pagination-numbers:default"}},"blockeraPropsId":"e32e029d-103d-41c8-932a-48cc6f9aea5d","blockeraCompatId":"e32e029d-103d-41c8-932a-48cc6f9aea5d"} /-->

			<!-- wp:query-pagination-next {"label":"<?php esc_html_e( 'Next Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/pagination-next:default"}},"blockeraPropsId":"fedac5bc-bd9d-429d-9f78-a2b5232d32b4","blockeraCompatId":"fedac5bc-bd9d-429d-9f78-a2b5232d32b4"} /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:query -->
