/**
 * WP template hierarchy helpers (slug chains, custom vs default types).
 */

import { isWooCommerceTemplate } from './templates-woocommerce';
import type { TemplateLike } from './template-display';

export const DEFAULT_TYPE_SLUGS = new Set([
	'index',
	'home',
	'front-page',
	'singular',
	'single',
	'page',
	'archive',
	'author',
	'category',
	'taxonomy',
	'date',
	'tag',
	'attachment',
	'search',
	'privacy-policy',
	'404',
]);

function isHierarchySpecificSlug(slug: string): boolean {
	return (
		slug.startsWith('single-') ||
		slug.startsWith('page-') ||
		slug.startsWith('archive-') ||
		slug.startsWith('category-') ||
		slug.startsWith('tag-') ||
		slug.startsWith('author-') ||
		slug.startsWith('taxonomy-') ||
		slug.startsWith('taxonomy-post_format-')
	);
}

/**
 * Whether a template is a user "custom" layout (page template), not a hierarchy suggestion.
 */
export function isCustomTemplate(
	template: TemplateLike,
	defaultTypeSlugs: Set<string> = DEFAULT_TYPE_SLUGS
): boolean {
	// WooCommerce registered templates are never "Custom templates".
	if (isWooCommerceTemplate(template)) {
		return false;
	}

	if (typeof template.is_custom === 'boolean') {
		return template.is_custom;
	}

	if (template.meta?.is_wp_suggestion) {
		return false;
	}

	const slug = template.slug || '';
	return !defaultTypeSlugs.has(slug) && !isHierarchySpecificSlug(slug);
}

/**
 * WP-style template hierarchy for a slug (mirrors `get_template_hierarchy`).
 * First entry is the slug itself; later entries are parents / fallbacks.
 */
export function getTemplateHierarchySlugs(slug: string): string[] {
	if (slug === 'index') {
		return ['index'];
	}
	if (slug === 'front-page') {
		return ['front-page', 'home', 'index'];
	}

	const hierarchy: string[] = [slug];

	const prefixed = slug.match(/^(author|category|archive|tag|page)-.+$/);
	if (prefixed) {
		hierarchy.push(prefixed[1]);
	}

	const taxOrSingle = slug.match(/^(taxonomy|single)-(.+)$/);
	if (taxOrSingle) {
		const type = taxOrSingle[1];
		const remaining = taxOrSingle[2];
		/*
		 * Without a live post-type/taxonomy registry here, treat the full
		 * remainder as the type slug when it has no further segment, otherwise
		 * keep `type-remainder` then `type` (good enough for CPT bases).
		 */
		if (remaining.includes('-')) {
			const maybeType = remaining.split('-')[0];
			hierarchy.push(`${type}-${maybeType}`);
		}
		hierarchy.push(type);
	}

	if (
		slug.startsWith('author') ||
		slug.startsWith('taxonomy') ||
		slug.startsWith('category') ||
		slug.startsWith('tag') ||
		slug === 'date'
	) {
		hierarchy.push('archive');
	}

	if (slug === 'attachment') {
		hierarchy.push('single');
	}

	if (
		slug.startsWith('single') ||
		slug.startsWith('page') ||
		slug === 'attachment'
	) {
		hierarchy.push('singular');
	}

	hierarchy.push('index');

	const unique: string[] = [];
	hierarchy.forEach((item) => {
		if (!unique.includes(item)) {
			unique.push(item);
		}
	});
	return unique;
}

/**
 * First existing parent/fallback slug after the base (WP hierarchy order).
 */
export function findExistingFallbackSlug(
	baseSlug: string,
	findBySlug: (slug: string) => TemplateLike | undefined
): string | null {
	const chain = getTemplateHierarchySlugs(baseSlug);
	for (const slug of chain) {
		if (slug === baseSlug) {
			continue;
		}
		if (findBySlug(slug)) {
			return slug;
		}
	}
	return null;
}
