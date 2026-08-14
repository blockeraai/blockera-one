/**
 * Resolve which wp_template entity the options panel should edit for a filter.
 * Child purposes without their own template fall back to archive.html.
 */

import {
	getBaseSlugForFilter,
	getTemplateHierarchySlugs,
	type TemplateLike,
} from '../../templates/templates-matchers';
import type { FilterId } from '../../templates/constants';

export function resolveTemplateIdForFilter(
	filter: FilterId,
	findBySlug: (slug: string) => TemplateLike | undefined
): { id: string | number | null; slug: string | null; isFallback: boolean } {
	const baseSlug = getBaseSlugForFilter(filter);
	if (!baseSlug) {
		return { id: null, slug: null, isFallback: false };
	}

	const direct = findBySlug(baseSlug);
	if (direct?.id !== undefined) {
		return {
			id: direct.id,
			slug: direct.slug || baseSlug,
			isFallback: false,
		};
	}

	const chain = getTemplateHierarchySlugs(baseSlug);
	for (const slug of chain) {
		if (slug === baseSlug) {
			continue;
		}
		const fallback = findBySlug(slug);
		if (fallback?.id !== undefined) {
			return {
				id: fallback.id,
				slug: fallback.slug || slug,
				isFallback: true,
			};
		}
	}

	return { id: null, slug: baseSlug, isFallback: false };
}
