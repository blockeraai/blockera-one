<?php
/**
 * Title: Written by
 * Slug: blockera-one/hidden-written-by
 * Inserter: no
 *
 * @package    WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"style":{"spacing":{"blockGap":"0.2em","margin":{"bottom":"var:preset|spacing|60"}}},"fontSize":"small","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-group has-small-font-size" style="margin-bottom:var(--wp--preset--spacing--60)">
	<!-- wp:paragraph -->
	<p><?php esc_html_e( 'Written by ', 'blockera-one' ); ?></p>
	<!-- /wp:paragraph -->
	<!-- wp:post-author-name {"isLink":true} /-->
	<!-- wp:paragraph -->
	<p><?php esc_html_e( 'in', 'blockera-one' ); ?></p>
	<!-- /wp:paragraph -->
	<!-- wp:post-terms {"term":"category","style":{"typography":{"fontWeight":"300"}}} /-->
</div>
<!-- /wp:group -->
