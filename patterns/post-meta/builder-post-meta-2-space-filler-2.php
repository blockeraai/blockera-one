<?php
/**
 * Title: Post Meta 2 — Space Filler
 * Description: Restore pattern for the Post Meta Templates Builder toggle.
 * Slug: blockera-one/builder-post-meta-2-space-filler-2
 * Categories: blockera-one/template-builder
 * Inserter: no
 *
 * @package WordPress
 * @subpackage Blockera_One
 * @since Blockera One 0.1.0
 *
 * Gutenberg serialize/parse drops ASCII-only paragraph content; NBSP survives.
 */

?>
<!-- wp:paragraph {"metadata":{"name":"Space Filler","blockeraOne":{"stamp":"section/post-meta-2-space-filler-2:default"}},"blockeraPropsId":"820191000004","blockeraCompatId":"820191000004","blockeraFlexChildSizing":{"value":"grow"},"blockeraWidth":{"value":"stretch"},"className":"blockera-block blockera-block-820191000004"} -->
<p><?php echo "\u{00A0}"; ?></p>
<!-- /wp:paragraph -->
