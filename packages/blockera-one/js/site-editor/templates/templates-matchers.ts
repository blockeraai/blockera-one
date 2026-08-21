/**
 * Purpose-based Templates matchers (barrel).
 * Aligned with WP `get_default_block_template_types` / `get_template_hierarchy`
 * and Gutenberg add-new-template slug prefixes.
 */

export type { TemplateLike } from './template-display';
export {
	getActiveTemplateParts,
	getTemplateTitle,
	getTemplateDescription,
} from './template-display';
export {
	DEFAULT_TYPE_SLUGS,
	isCustomTemplate,
	getTemplateHierarchySlugs,
	findExistingFallbackSlug,
} from './hierarchy';
export {
	getBaseSlugForFilter,
	getFilterIdForSlug,
	isPurposeBaseFilter,
	templateMatchesFilter,
	getChildTemplatesForFilter,
} from './filter-match';
