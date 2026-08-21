<?php
/**
 * Title: 404 Template — Default
 * Description: Image, title, description, and search form.
 * Slug: blockera-one/builder-404-template-default
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"metadata":{"name":"Not Found","blockeraOne":"section/not-found:default"},"style":{"spacing":{"padding":{"right":"0","left":"0"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-right:0;padding-left:0">
	<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|50","left":"var:preset|spacing|50"}}}} -->
	<div class="wp-block-columns alignwide">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:image {"scale":"cover","sizeSlug":"full","linkDestination":"none","metadata":{"blockeraOne":"section/not-found-image:default"}} -->
			<figure class="wp-block-image size-full">
				<img src="<?php echo esc_url( get_template_directory_uri() ); ?>/assets/images/404-image.webp" alt="<?php echo esc_attr_x( 'Small totara tree on ridge above Long Point', 'image description', 'blockera-one' ); ?>" style="object-fit:cover"/>
			</figure>
			<!-- /wp:image -->
		</div>
		<!-- /wp:column -->
		<!-- wp:column {"verticalAlignment":"bottom"} -->
		<div class="wp-block-column is-vertically-aligned-bottom">
			<!-- wp:heading {"level":1,"metadata":{"blockeraOne":"section/not-found-title:default"}} -->
			<h1 class="wp-block-heading"><?php echo esc_html_x( 'Page not found', '404 error message', 'blockera-one' ); ?></h1>
			<!-- /wp:heading -->
			<!-- wp:paragraph {"metadata":{"blockeraOne":"section/not-found-description:default"}} -->
			<p><?php echo esc_html_x( 'The page you are looking for doesn\'t exist, or it has been moved. Please try searching using the form below.', '404 error message', 'blockera-one' ); ?></p>
			<!-- /wp:paragraph -->
			<!-- wp:search {"label":"<?php echo esc_html_x( 'Search', 'Search form label.', 'blockera-one' ); ?>","showLabel":false,"placeholder":"<?php echo esc_attr_x( 'Type here...', 'Search input field placeholder text.', 'blockera-one' ); ?>","buttonText":"<?php echo esc_attr_x( 'Search', 'Button text. Verb.', 'blockera-one' ); ?>","metadata":{"blockeraOne":"section/not-found-search:default"}} /-->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
