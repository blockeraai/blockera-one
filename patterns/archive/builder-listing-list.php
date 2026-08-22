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
<!-- wp:query {"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true,"taxQuery":null,"parents":[],"excludeCurrent":null},"metadata":{"blockeraOne":"section/posts-listing:list"},"align":"full","layout":{"type":"default"}} -->
<div class="wp-block-query alignfull">
	<!-- wp:post-template {"align":"full","layout":{"type":"default"}} -->
		<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":"container/body"},"blockeraPropsId":"719122726872","blockeraCompatId":"719122726872","blockeraDisplay":{"value":"flex"},"blockeraFlexLayout":{"value":{"direction":"column","alignItems":"flex-start","justifyContent":"flex-start"}},"align":"full","className":"blockera-block blockera-block-72fdvc35","layout":{"type":"flex","orientation":"vertical","verticalAlignment":"top","justifyContent":"left"}} -->
	<div class="wp-block-group alignfull blockera-block blockera-block-72fdvc35">
			<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"3/2","metadata":{"blockeraOne":"section/post-featured-image:default"}} /-->

			<!-- wp:post-title {"isLink":true,"metadata":{"blockeraOne":"section/post-title:default"},"fontSize":"x-large"} /-->

			<!-- wp:post-excerpt {"showMoreOnNewLine":false,"metadata":{"blockeraOne":"section/post-excerpt:default"},"fontSize":"medium"} /-->

			<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":"section/post-meta:default"},"blockeraPropsId":"820192000013","blockeraCompatId":"820192000013","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-820192000013","layout":{"type":"flex","flexWrap":"nowrap"}} -->
		<div class="wp-block-group blockera-block blockera-block-820192000013">
				<!-- wp:group {"metadata":{"name":"Published Date Meta","blockeraOne":"section/post-meta-post-date:default"},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
			<div class="wp-block-group">
					<!-- wp:post-date {"isLink":true,"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"date"}}},"blockeraOne":"container/meta-item-block:default"},"fontSize":"small"} /-->
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
		<p><?php esc_html_e( 'Sorry, but nothing was found. Please try a search with different
			keywords.', 'blockera-one' ); ?></p>
			<!-- /wp:paragraph -->
		<!-- /wp:query-no-results -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:query-pagination {"paginationArrow":"arrow","metadata":{"blockeraOne":"section/pagination:standard"},"blockeraPropsId":"71601557969","blockeraCompatId":"71601557969","blockeraFlexLayout":{"value":{"direction":"row","alignItems":"","justifyContent":"space-between"}},"align":"wide","className":"blockera-block blockera-block-jl07a71","layout":{"type":"flex","justifyContent":"space-between","orientation":"horizontal"}} -->
			<!-- wp:query-pagination-previous {"label":"<?php esc_html_e( 'Previous Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":"section/pagination-previous:default"}} /-->

			<!-- wp:query-pagination-numbers {"metadata":{"blockeraOne":"section/pagination-numbers:default"}} /-->

			<!-- wp:query-pagination-next {"label":"<?php esc_html_e( 'Next Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":"section/pagination-next:default"}} /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:query -->
