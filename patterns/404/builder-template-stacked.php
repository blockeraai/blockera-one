<?php
/**
 * Title: 404 Template — Stacked
 * Description: Title, description, and search form without the image.
 * Slug: blockera-one/builder-404-template-stacked
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"metadata":{"name":"Not Found","blockeraOne":{"stamp":"section/not-found:stacked"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
	<!-- wp:heading {"level":1,"metadata":{"blockeraOne":{"stamp":"section/not-found-title:default"}}} -->
	<h1 class="wp-block-heading"><?php echo esc_html_x( 'Page not found', '404 error message', 'blockera-one' ); ?></h1>
	<!-- /wp:heading -->
	<!-- wp:paragraph {"metadata":{"blockeraOne":{"stamp":"section/not-found-description:default"}}} -->
	<p><?php echo esc_html_x( 'The page you are looking for doesn\'t exist, or it has been moved. Please try searching using the form below.', '404 error message', 'blockera-one' ); ?></p>
	<!-- /wp:paragraph -->
	<!-- wp:search {"label":"<?php echo esc_html_x( 'Search', 'Search form label.', 'blockera-one' ); ?>","showLabel":false,"placeholder":"<?php echo esc_attr_x( 'Type here...', 'Search input field placeholder text.', 'blockera-one' ); ?>","buttonText":"<?php echo esc_attr_x( 'Search', 'Button text. Verb.', 'blockera-one' ); ?>","metadata":{"blockeraOne":{"stamp":"section/not-found-search:default"}}} /-->
</div>
<!-- /wp:group -->
