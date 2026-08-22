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
<!-- wp:query {"query":{"perPage":9,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true,"taxQuery":null,"parents":[]},"align":"wide","metadata":{"blockeraOne":{"stamp":"section/posts-listing:grid-3"}},"layout":{"type":"default"}} -->
<div class="wp-block-query alignwide">
	<!-- wp:post-template {"style":{"spacing":{"blockGap":"var:preset|spacing|40"}},"layout":{"type":"grid","columnCount":3}} -->
		<!-- wp:group {"metadata":{"name":"Content Blocks","blockeraOne":{"stamp":"container/body"}},"style":{"spacing":{"blockGap":"var:preset|spacing|20"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"}} -->
		<div class="wp-block-group">
			<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"1","metadata":{"blockeraOne":{"stamp":"section/post-featured-image:default"}}} /-->
			<!-- wp:post-title {"isLink":true,"fontSize":"medium","metadata":{"blockeraOne":{"stamp":"section/post-title:default"}}} /-->
			<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":{"stamp":"section/post-meta:default","metaSeparator":"none"}},"blockeraPropsId":"820192000012","blockeraCompatId":"820192000012","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-820192000012","layout":{"type":"flex","flexWrap":"nowrap"}} -->
			<div class="wp-block-group blockera-block blockera-block-820192000012">
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
	<!-- wp:query-no-results -->
	<!-- wp:paragraph -->
	<p><?php echo esc_html_x( 'Sorry, but nothing was found. Please try a search with different keywords.', 'Message explaining that there are no results returned from a search.', 'blockera-one' ); ?></p>
	<!-- /wp:paragraph -->
	<!-- /wp:query-no-results -->
	<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40)">
		<!-- wp:query-pagination {"paginationArrow":"arrow","metadata":{"blockeraOne":{"stamp":"section/pagination:standard"}},"blockeraPropsId":"71601557969","blockeraCompatId":"71601557969","blockeraFlexLayout":{"value":{"direction":"row","alignItems":"","justifyContent":"space-between"}},"align":"wide","className":"blockera-block blockera-block-jl07a71","layout":{"type":"flex","justifyContent":"space-between","orientation":"horizontal"}} -->
			<!-- wp:query-pagination-previous {"label":"<?php esc_html_e( 'Previous Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/pagination-previous:default"}}} /-->
			<!-- wp:query-pagination-numbers {"metadata":{"blockeraOne":{"stamp":"section/pagination-numbers:default"}}} /-->
			<!-- wp:query-pagination-next {"label":"<?php esc_html_e( 'Next Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/pagination-next:default"}}} /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:query -->
