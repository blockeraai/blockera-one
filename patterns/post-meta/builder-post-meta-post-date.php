<?php
/**
 * Title: Post Meta — Published Date
 * Description: Restore pattern for the Post Meta Templates Builder toggle.
 * Slug: blockera-one/builder-post-meta-post-date
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 */

?>
<!-- wp:group {"metadata":{"name":"Published Date Meta","blockeraOne":"section/post-meta-post-date:default"},"style":{"spacing":{"blockGap":"0.35em"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group">
	<!-- wp:post-date {"isLink":true,"metadata":{"bindings":{"datetime":{"source":"core/post-data","args":{"field":"date"}}},"blockeraOne":"container/meta-item-block:default"}} /-->
</div>
<!-- /wp:group -->
