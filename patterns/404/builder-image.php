<?php
/**
 * Title: 404 — Image
 * Description: Restore pattern for the 404 image toggle.
 * Slug: blockera-one/builder-404-image
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:image {"scale":"cover","sizeSlug":"full","linkDestination":"none","metadata":{"blockeraOne":{"stamp":"section/not-found-image:default"}}} -->
<figure class="wp-block-image size-full"><img src="<?php echo esc_url( get_template_directory_uri() ); ?>/assets/images/404-image.webp" alt="<?php echo esc_attr_x( 'Small totara tree on ridge above Long Point', 'image description', 'blockera-one' ); ?>" style="object-fit:cover"/></figure>
<!-- /wp:image -->

