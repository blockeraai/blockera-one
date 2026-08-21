<?php
/**
 * Title: Sidebar
 * Slug: blockera-one/hidden-sidebar
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"metadata":{"blockeraOne":"layout/site-sidebar:default","blockeraOneInnerOrder":["sidebar-search","sidebar-categories","sidebar-latest-posts","sidebar-archives","sidebar-tag-cloud"]},"layout":{"type":"default"}} -->
<div class="wp-block-group">
	<!-- wp:search {"label":"<?php echo esc_html_x( 'Search', 'Search form label.', 'blockera-one' ); ?>","showLabel":false,"buttonText":"<?php echo esc_attr_x( 'Search', 'Button text. Verb.', 'blockera-one' ); ?>","metadata":{"blockeraOne":"section/sidebar-search:default"}} /-->

	<!-- wp:heading {"style":{"typography":{"fontStyle":"normal","fontWeight":"600","textTransform":"uppercase","letterSpacing":"1.6px"}},"fontSize":"small"} -->
	<h2 class="wp-block-heading has-small-font-size" style="font-style:normal;font-weight:600;letter-spacing:1.6px;text-transform:uppercase"><?php esc_html_e( 'Categories', 'blockera-one' ); ?></h2>
	<!-- /wp:heading -->
	<!-- wp:categories {"showPostCounts":true,"metadata":{"blockeraOne":"section/sidebar-categories:default"}} /-->

	<!-- wp:spacer {"height":"var:preset|spacing|40"} -->
	<div style="height:var(--wp--preset--spacing--40)" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer -->

	<!-- wp:heading {"style":{"typography":{"fontStyle":"normal","fontWeight":"600","textTransform":"uppercase","letterSpacing":"1.6px"}},"fontSize":"small"} -->
	<h2 class="wp-block-heading has-small-font-size" style="font-style:normal;font-weight:600;letter-spacing:1.6px;text-transform:uppercase"><?php esc_html_e( 'Latest Posts', 'blockera-one' ); ?></h2>
	<!-- /wp:heading -->
	<!-- wp:latest-posts {"postsToShow":5,"displayPostDate":true,"metadata":{"blockeraOne":"section/sidebar-latest-posts:default"}} /-->
</div>
<!-- /wp:group -->
