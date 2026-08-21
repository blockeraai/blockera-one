<?php
/**
 * Title: Archive posts listing — full width cards
 * Slug: blockera-one/builder-archive-listing-full-width
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:query {"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true,"taxQuery":null,"parents":[]},"align":"full","metadata":{"blockeraOne":"section/posts-listing:full-width"},"layout":{"type":"default"}} -->
<div class="wp-block-query alignfull">
	<!-- wp:post-template {"align":"full","layout":{"type":"default"}} -->
		<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
		<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
			<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|50"}}}} -->
			<div class="wp-block-columns alignwide">
				<!-- wp:column {"width":"40%","metadata":{"name":"Media Column","blockeraOne":"container/media"}} -->
				<div class="wp-block-column" style="flex-basis:40%">
					<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"4/3","metadata":{"blockeraOne":"section/post-featured-image:default"}} /-->
				</div>
				<!-- /wp:column -->
				<!-- wp:column {"verticalAlignment":"center","width":"60%","metadata":{"name":"Content Column","blockeraOne":"container/body"}} -->
				<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60%">
					<!-- wp:post-title {"isLink":true,"fontSize":"x-large","metadata":{"blockeraOne":"section/post-title:default"}} /-->
					<!-- wp:post-excerpt {"fontSize":"medium","metadata":{"blockeraOne":"section/post-excerpt:default"}} /-->
					<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":"section/post-meta:default"},"blockeraPropsId":"820192000014","blockeraCompatId":"820192000014","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-820192000014","layout":{"type":"flex","flexWrap":"nowrap"}} -->
					<div class="wp-block-group blockera-block blockera-block-820192000014">
						<!-- wp:group {"metadata":{"name":"Published Date","blockeraOne":"section/post-meta-post-date:default"},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
						<div class="wp-block-group">
							<!-- wp:icon {"icon":"core/calendar","metadata":{"blockeraOne":"container/meta-item-icon:default"},"blockeraIcon":{"value":{"icon":"calendar","library":"wp","uploadSVG":"","svgString":"","renderedIcon":""}},"blockeraPropsId":"820192000015","blockeraCompatId":"820192000015","className":"wp-block-icon-blockera blockera-block blockera-block-820192000015","style":{"dimensions":{"width":"1em"}}} /-->
							<!-- wp:post-date {"isLink":true,"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"date"}}},"blockeraOne":"container/meta-item-block:default"},"fontSize":"small"} /-->
						</div>
						<!-- /wp:group -->
					</div>
					<!-- /wp:group -->
				</div>
				<!-- /wp:column -->
			</div>
			<!-- /wp:columns -->
		</div>
		<!-- /wp:group -->
	<!-- /wp:post-template -->
	<!-- wp:query-no-results -->
	<!-- wp:paragraph -->
	<p><?php echo esc_html_x( 'Sorry, but nothing was found. Please try a search with different keywords.', 'Message explaining that there are no results returned from a search.', 'blockera-one' ); ?></p>
	<!-- /wp:paragraph -->
	<!-- /wp:query-no-results -->
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
