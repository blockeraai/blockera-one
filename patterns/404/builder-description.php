<?php
/**
 * Title: 404 — Description
 * Description: Restore pattern for the 404 description toggle.
 * Slug: blockera-one/builder-404-description
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:paragraph {"metadata":{"blockeraOne":"section/not-found-description:default"}} -->
<p><?php echo esc_html_x( 'The page you are looking for doesn\'t exist, or it has been moved. Please try searching using the form below.', '404 error message', 'blockera-one' ); ?></p>
<!-- /wp:paragraph -->

