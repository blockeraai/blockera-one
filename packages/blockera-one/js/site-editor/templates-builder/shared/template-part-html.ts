/**
 * Generate self-closing `wp:template-part` block comments for
 * templatePart-kind catalog variants (site header/footer chrome).
 * Type-agnostic — replaces the per-type hardcoded chrome markup.
 */

import { formatStamp } from './stamp';
import type { VariantDef } from './types';

/**
 * Build the stamped template-part comment for a variant.
 *
 * Attribute order (slug, area, tagName, metadata) matches the markup shipped
 * in theme templates so serialized output stays diff-stable.
 *
 * @param variant   templatePart-kind variant (needs `slug`).
 * @param sectionId Section stamp id (`header` / `footer`).
 */
export function buildTemplatePartHtml(
	variant: VariantDef,
	sectionId: string
): string | null {
	if (!variant.slug) {
		return null;
	}

	const attributes: Record<string, unknown> = { slug: variant.slug };
	if (variant.area) {
		attributes.area = variant.area;
	}
	if (variant.tagName) {
		attributes.tagName = variant.tagName;
	}
	attributes.metadata = {
		blockeraOne: formatStamp('section', sectionId, variant.id),
	};

	return `<!-- wp:template-part ${JSON.stringify(attributes)} /-->`;
}
