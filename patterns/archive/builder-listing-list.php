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
<!-- wp:query {"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true,"taxQuery":null,"parents":[]},"align":"full","metadata":{"blockeraOne":"section/posts-listing:list"},"layout":{"type":"default"}} -->
<div class="wp-block-query alignfull">
	<!-- wp:post-template {"align":"full","layout":{"type":"default"}} -->
		<!-- wp:group {"align":"full","metadata":{"name":"Content Blocks","blockeraOne":"container/loop-item-content"},"layout":{"type":"constrained"}} -->
		<div class="wp-block-group alignfull">
			<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"3/2","metadata":{"blockeraOne":"section/post-featured-image:default"}} /-->
			<!-- wp:post-title {"isLink":true,"fontSize":"x-large","metadata":{"blockeraOne":"section/post-title:default"}} /-->
			<!-- wp:post-excerpt {"fontSize":"medium","metadata":{"blockeraOne":"section/post-excerpt:default"}} /-->
			<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":"section/post-meta:default"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|40"}}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
			<div class="wp-block-group" style="margin-top:var(--wp--preset--spacing--40)">
				<!-- wp:post-date {"isLink":true,"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"date"}}},"blockeraOne":"section/post-meta-post-date:default"},"fontSize":"small"} /-->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	<!-- /wp:post-template -->
	<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">
		<!-- wp:query-no-results -->
		<!-- wp:paragraph -->
		<p><?php echo esc_html_x( 'Sorry, but nothing was found. Please try a search with different keywords.', 'Message explaining that there are no results returned from a search.', 'blockera-one' ); ?></p>
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
