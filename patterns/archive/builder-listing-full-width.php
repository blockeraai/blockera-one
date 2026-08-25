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
<!-- wp:query {"query":{"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true,"taxQuery":null,"parents":[],"excludeCurrent":null},"metadata":{"blockeraOne":{"stamp":"section/posts-listing:full-width"},"name":"Posts Query Loop"},"align":"full","layout":{"type":"default"}} -->
<div class="wp-block-query alignfull">
	<!-- wp:post-template {"align":"full","layout":{"type":"default"}} -->
		<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
		<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
			<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|50"}}}} -->
			<div class="wp-block-columns alignwide">
				<!-- wp:column {"width":"40%","metadata":{"name":"Media Column","blockeraOne":{"stamp":"container/media"}}} -->
				<div class="wp-block-column" style="flex-basis:40%">
					<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"4/3","metadata":{"blockeraOne":{"stamp":"section/post-featured-image:default"}}} /-->
				</div>
				<!-- /wp:column -->

				<!-- wp:column {"verticalAlignment":"center","width":"60%","metadata":{"name":"Content Column","blockeraOne":{"stamp":"container/body"}}} -->
				<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60%">
					<!-- wp:post-title {"isLink":true,"metadata":{"blockeraOne":{"stamp":"section/post-title:default"}},"fontSize":"x-large"} /-->

					<!-- wp:post-excerpt {"showMoreOnNewLine":false,"metadata":{"blockeraOne":{"stamp":"section/post-excerpt:default"}},"fontSize":"medium"} /-->

					<!-- wp:group {"metadata":{"name":"Post Meta","blockeraOne":{"stamp":"section/post-meta:default","metaSeparator":"none"}},"blockeraId":"srwknj","blockeraFlexChildSizing":{"value":"grow"},"blockeraDisplay":{"value":"flex"},"blockeraFlexWrap":{"value":{"val":"nowrap","reverse":false}},"blockeraWidth":{"value":"stretch"},"blockeraFontSize":{"value":{"settings":{"id":"medium","name":"Medium","type":"font-size","reference":{"type":"theme","theme":"Blockera One"},"value":"1rem","var":"--wp--preset--font-size--medium","fluid":{"max":"1.125rem","min":"1rem"}},"name":"Medium","isValueAddon":true,"valueType":"variable"}},"className":"blockera-block blockera-block-srwknj","style":{"typography":{}},"fontSize":"medium","layout":{"type":"flex","flexWrap":"nowrap"}} -->
					<div class="wp-block-group blockera-block blockera-block-srwknj has-medium-font-size">
						<!-- wp:group {"metadata":{"name":"Published Date Meta","blockeraOne":{"stamp":"section/post-meta-post-date:default"}},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
						<div class="wp-block-group">
							<!-- wp:icon {"icon":"core/calendar","metadata":{"name":"Meta Icon","blockeraOne":{"stamp":"container/meta-item-icon:default"}},"blockeraId":"uuwqi3","blockeraIcon":{"value":{"icon":"calendar","library":"wp","uploadSVG":"","svgString":"","renderedIcon":""}},"className":"wp-block-icon-blockera blockera-block blockera-block-uuwqi3","style":{"dimensions":{"width":"1em"}}} /-->

							<!-- wp:post-date {"isLink":true,"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"date"}}},"blockeraOne":{"stamp":"container/meta-item-block:default"}},"fontSize":"small"} /-->
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
		<p><?php esc_html_e( 'Sorry, but nothing was found. Please try a search with different keywords.', 'blockera-one' ); ?></p>
		<!-- /wp:paragraph -->
	<!-- /wp:query-no-results -->

	<!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
	<div class="wp-block-group alignwide">
		<!-- wp:query-pagination {"paginationArrow":"arrow","metadata":{"blockeraOne":{"stamp":"section/pagination:standard"}},"blockeraId":"0k0bz3","blockeraFlexLayout":{"value":{"direction":"row","alignItems":"","justifyContent":"space-between"}},"align":"wide","className":"is-style-default blockera-block blockera-block-0k0bz3","layout":{"type":"flex","justifyContent":"space-between","orientation":"horizontal"}} -->
			<!-- wp:query-pagination-previous {"label":"<?php esc_html_e( 'Previous Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/pagination-previous:default"}}} /-->

			<!-- wp:query-pagination-numbers {"metadata":{"blockeraOne":{"stamp":"section/pagination-numbers:default"}}} /-->

			<!-- wp:query-pagination-next {"label":"<?php esc_html_e( 'Next Page', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/pagination-next:default"}}} /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:query -->
