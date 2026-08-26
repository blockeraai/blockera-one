<?php
/**
 * Title: Archive posts listing — list
 * Slug: blockera-one/builder-archive-listing-list
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:query {"query":{"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true,"taxQuery":null,"parents":[],"excludeCurrent":null},"metadata":{"name":"Posts Query Loop","blockeraOne":{"stamp":"section/posts-listing:list"}},"align":"full","layout":{"type":"default"}} -->
<div class="wp-block-query alignfull">
	<!-- wp:post-template {"blockeraId":"thh2m2","blockeraGap":{"value":{"lock":true,"gap":{"settings":{"id":"40","name":"Small","type":"spacing","reference":{"type":"theme","theme":"Blockera One"},"value":"30px","var":"--wp--preset--spacing--40"},"name":"Small","isValueAddon":true,"valueType":"variable"},"columns":"","rows":""}},"align":"full","className":"blockera-block blockera-block-thh2m2","style":{"spacing":{"blockGap":"var:preset|spacing|40"}},"layout":{"type":"default"}} -->
		<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":{"stamp":"container/body"}},"blockeraId":"6er100","blockeraDisplay":{"value":"flex"},"blockeraFlexLayout":{"value":{"direction":"column","alignItems":"flex-start","justifyContent":"flex-start"}},"blockeraGap":{"value":{"lock":true,"gap":{"settings":{"id":"30","name":"X-Small","type":"spacing","reference":{"type":"theme","theme":"Blockera One"},"value":"20px","var":"--wp--preset--spacing--30"},"name":"X-Small","isValueAddon":true,"valueType":"variable"},"columns":"","rows":""}},"align":"full","className":"blockera-block blockera-block-6er100","style":{"spacing":{"blockGap":"var:preset|spacing|30"}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"top","justifyContent":"left"}} -->
		<div class="wp-block-group alignfull blockera-block blockera-block-6er100">
			<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"3/2","metadata":{"blockeraOne":{"stamp":"section/post-featured-image:default"}}} /-->

			<!-- wp:post-title {"isLink":true,"metadata":{"blockeraOne":{"stamp":"section/post-title:default"}},"fontSize":"x-large"} /-->

			<!-- wp:post-excerpt {"showMoreOnNewLine":false,"metadata":{"blockeraOne":{"stamp":"section/post-excerpt:default"}},"fontSize":"medium"} /-->

			<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":{"stamp":"section/post-meta:default","metaSeparator":"none"}},"blockeraId":"rnqive","blockeraFlexChildSizing":{"value":"grow"},"blockeraDisplay":{"value":"flex"},"blockeraFlexWrap":{"value":{"val":"nowrap","reverse":false}},"blockeraWidth":{"value":"stretch"},"blockeraFontSize":{"value":{"settings":{"id":"medium","name":"Medium","type":"font-size","reference":{"type":"theme","theme":"Blockera One"},"value":"1rem","var":"--wp--preset--font-size--medium","fluid":{"max":"1.125rem","min":"1rem"}},"name":"Medium","isValueAddon":true,"valueType":"variable"}},"className":"blockera-block blockera-block-rnqive","style":{"typography":{}},"fontSize":"medium","layout":{"type":"flex","flexWrap":"nowrap"}} -->
			<div class="wp-block-group blockera-block blockera-block-rnqive has-medium-font-size">
				<!-- wp:group {"metadata":{"name":"Published Date Meta","blockeraOne":{"stamp":"section/post-meta-post-date:default"}},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
				<div class="wp-block-group">
					<!-- wp:post-date {"isLink":true,"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"date"}}},"blockeraOne":{"stamp":"container/meta-item-block:default"}},"fontSize":"small"} /-->
				</div>
				<!-- /wp:group -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	<!-- /wp:post-template -->

	<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">
		<!-- wp:query-no-results -->
			<!-- wp:paragraph -->
			<p><?php esc_html_e( 'Sorry, but nothing was found. Please try a search with different keywords.', 'blockera-one' ); ?></p>
			<!-- /wp:paragraph -->
		<!-- /wp:query-no-results -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:query-pagination {"paginationArrow":"arrow","metadata":{"blockeraOne":{"stamp":"section/pagination:standard"}},"blockeraId":"2mkbbe","blockeraFlexLayout":{"value":{"direction":"row","alignItems":"","justifyContent":"space-between"}},"align":"wide","className":"is-style-default blockera-block blockera-block-2mkbbe","layout":{"type":"flex","justifyContent":"space-between","orientation":"horizontal"}} -->
			<!-- wp:query-pagination-previous {"label":"<?php esc_html_e( 'Previous Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/pagination-previous:default"}}} /-->

			<!-- wp:query-pagination-numbers {"metadata":{"blockeraOne":{"stamp":"section/pagination-numbers:default"}}} /-->

			<!-- wp:query-pagination-next {"label":"<?php esc_html_e( 'Next Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/pagination-next:default"}}} /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:query -->
