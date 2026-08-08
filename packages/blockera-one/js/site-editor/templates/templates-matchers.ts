/**
 * Pure matchers for purpose-based Templates filters.
 * Aligned with WP `get_default_block_template_types` / `get_template_hierarchy`
 * and Gutenberg add-new-template slug prefixes.
 */

import {
	FILTER_IDS,
	getParentFilterFromChildrenFilter,
	isChildrenFilter,
	type FilterId,
} from './constants';

export type TemplateLike = {
	id?: string | number;
	slug?: string;
	is_custom?: boolean;
	meta?: { is_wp_suggestion?: boolean };
	author_text?: string;
	original_source?: string;
	source?: string;
	plugin?: string;
	theme?: string;
	area?: string;
	title?: string | { rendered?: string; raw?: string };
	description?: string | { raw?: string; rendered?: string };
	content?: { raw?: string; rendered?: string; block_version?: number };
};

/**
 * Active template parts for the current theme: one per slug, custom overrides theme.
 */
export function getActiveTemplateParts(
	parts: TemplateLike[],
	stylesheet?: string
): TemplateLike[] {
	const bySlug = new Map<string, TemplateLike>();

	for (const part of parts) {
		const slug = part.slug || '';
		if (!slug) {
			continue;
		}

		// Skip parts owned by another theme when stylesheet is known.
		if (stylesheet && part.theme && part.theme !== stylesheet) {
			continue;
		}

		const existing = bySlug.get(slug);
		if (!existing) {
			bySlug.set(slug, part);
			continue;
		}

		const existingSource = existing.original_source || existing.source;
		const nextSource = part.original_source || part.source;
		if (nextSource === 'custom' && existingSource !== 'custom') {
			bySlug.set(slug, part);
		}
	}

	return Array.from(bySlug.values());
}

const DEFAULT_TYPE_SLUGS = new Set([
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

/**
 * Whether a template is a user "custom" layout (page template), not a hierarchy suggestion.
 */
export function isCustomTemplate(
	template: TemplateLike,
	defaultTypeSlugs: Set<string> = DEFAULT_TYPE_SLUGS
): boolean {
	if (typeof template.is_custom === 'boolean') {
		return template.is_custom;
	}

	if (template.meta?.is_wp_suggestion) {
		return false;
	}

	const slug = template.slug || '';
	return !defaultTypeSlugs.has(slug) && !isHierarchySpecificSlug(slug);
}

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
 * Base slug for a purpose filter (used for canvas auto-preview).
 */
export function getBaseSlugForFilter(filter: FilterId): string | null {
	if (
		filter === FILTER_IDS.all ||
		filter === FILTER_IDS.active ||
		filter === FILTER_IDS.user ||
		filter === FILTER_IDS.custom ||
		filter === FILTER_IDS.parts ||
		isChildrenFilter(filter) ||
		filter.startsWith('author:') ||
		filter.startsWith('cpt-single:') ||
		filter.startsWith('cpt-archive:') ||
		filter.startsWith('child:')
	) {
		if (filter.startsWith('cpt-single:')) {
			const cpt = filter.slice('cpt-single:'.length);
			return cpt === 'page' ? 'page' : `single-${cpt}`;
		}
		if (filter.startsWith('cpt-archive:')) {
			return `archive-${filter.slice('cpt-archive:'.length)}`;
		}
		if (filter.startsWith('child:')) {
			return filter.slice('child:'.length);
		}
		return null;
	}

	return String(filter);
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

/**
 * Map a template slug back to a purpose-nav filter id.
 */
export function getFilterIdForSlug(slug: string): FilterId {
	switch (slug) {
		case 'front-page':
			return FILTER_IDS.frontPage;
		case 'home':
			return FILTER_IDS.home;
		case 'index':
			return FILTER_IDS.index;
		case 'single':
			return FILTER_IDS.single;
		case 'page':
			return FILTER_IDS.page;
		case 'singular':
			return FILTER_IDS.singular;
		case 'attachment':
			return FILTER_IDS.attachment;
		case 'archive':
			return FILTER_IDS.archive;
		case 'category':
			return FILTER_IDS.category;
		case 'tag':
			return FILTER_IDS.tag;
		case 'author':
			return FILTER_IDS.author;
		case 'date':
			return FILTER_IDS.date;
		case 'taxonomy':
			return FILTER_IDS.taxonomy;
		case 'search':
			return FILTER_IDS.search;
		case '404':
			return FILTER_IDS.notFound;
		// WP privacy-policy is a special page template — group under Pages.
		case 'privacy-policy':
			return FILTER_IDS.page;
		default:
			break;
	}

	if (slug.startsWith('archive-')) {
		return `cpt-archive:${slug.slice('archive-'.length)}`;
	}
	if (slug.startsWith('single-post')) {
		return FILTER_IDS.single;
	}
	if (slug.startsWith('single-')) {
		return `cpt-single:${slug.slice('single-'.length)}`;
	}
	if (slug.startsWith('page-')) {
		return FILTER_IDS.page;
	}

	return slug;
}

/**
 * Whether this filter represents a purpose base that can be “missing”.
 */
export function isPurposeBaseFilter(filter: FilterId): boolean {
	return (
		getBaseSlugForFilter(filter) !== null && !filter.startsWith('child:')
	);
}

/**
 * True when `slug` belongs under the given purpose filter (including children).
 */
export function templateMatchesFilter(
	template: TemplateLike,
	filter: FilterId,
	options?: {
		defaultTypeSlugs?: Set<string>;
		isActive?: boolean;
		isUserRecord?: boolean;
	}
): boolean {
	const slug = template.slug || '';
	const defaultTypeSlugs = options?.defaultTypeSlugs ?? DEFAULT_TYPE_SLUGS;

	if (filter === FILTER_IDS.all) {
		return true;
	}

	if (filter === FILTER_IDS.active) {
		return (
			options?.isActive === true &&
			!isCustomTemplate(template, defaultTypeSlugs)
		);
	}

	if (filter === FILTER_IDS.user) {
		return (
			options?.isUserRecord === true ||
			template.original_source === 'custom' ||
			template.source === 'custom'
		);
	}

	if (filter === FILTER_IDS.custom) {
		return isCustomTemplate(template, defaultTypeSlugs);
	}

	// Aggregated child-templates browse for a purpose parent.
	if (isChildrenFilter(filter)) {
		const parentFilter = getParentFilterFromChildrenFilter(filter);
		if (!parentFilter) {
			return false;
		}
		const base = getBaseSlugForFilter(parentFilter);
		if (!base || slug === base) {
			return false;
		}
		return templateMatchesFilter(template, parentFilter, options);
	}

	if (filter.startsWith('author:')) {
		const author = filter.slice('author:'.length);
		return (template.author_text || '') === author;
	}

	if (filter.startsWith('child:')) {
		return slug === filter.slice('child:'.length);
	}

	if (filter.startsWith('cpt-single:')) {
		const cpt = filter.slice('cpt-single:'.length);
		if (cpt === 'page') {
			return (
				slug === 'page' ||
				slug.startsWith('page-') ||
				slug === 'privacy-policy'
			);
		}
		const prefix = `single-${cpt}`;
		return slug === prefix || slug.startsWith(`${prefix}-`);
	}

	if (filter.startsWith('cpt-archive:')) {
		const cpt = filter.slice('cpt-archive:'.length);
		return slug === `archive-${cpt}`;
	}

	switch (filter) {
		case FILTER_IDS.frontPage:
			return slug === 'front-page' || slug.startsWith('front-page-');
		case FILTER_IDS.home:
			return slug === 'home';
		case FILTER_IDS.index:
			return slug === 'index';
		case FILTER_IDS.singular:
			return slug === 'singular';
		case FILTER_IDS.single:
			return (
				slug === 'single' ||
				slug.startsWith('single-post-') ||
				slug === 'single-post'
			);
		case FILTER_IDS.page:
			return (
				slug === 'page' ||
				slug.startsWith('page-') ||
				slug === 'privacy-policy'
			);
		case FILTER_IDS.attachment:
			return slug === 'attachment' || slug.startsWith('attachment-');
		case FILTER_IDS.archive:
			return slug === 'archive';
		case FILTER_IDS.category:
			return slug === 'category' || slug.startsWith('category-');
		case FILTER_IDS.tag:
			return slug === 'tag' || slug.startsWith('tag-');
		case FILTER_IDS.author:
			return slug === 'author' || slug.startsWith('author-');
		case FILTER_IDS.date:
			return slug === 'date';
		case FILTER_IDS.taxonomy:
			return slug === 'taxonomy' || slug.startsWith('taxonomy-');
		case FILTER_IDS.search:
			return slug === 'search';
		case FILTER_IDS.notFound:
			return slug === '404';
		default:
			return slug === filter || slug.startsWith(`${filter}-`);
	}
}

/**
 * Child templates under a parent filter (exclude the base slug itself).
 */
export function getChildTemplatesForFilter(
	templates: TemplateLike[],
	filter: FilterId
): TemplateLike[] {
	const base = getBaseSlugForFilter(filter);
	if (!base) {
		return [];
	}

	return templates.filter((template) => {
		const slug = template.slug || '';
		if (slug === base) {
			return false;
		}
		return templateMatchesFilter(template, filter);
	});
}

export function getTemplateTitle(template: TemplateLike): string {
	const { title, slug } = template;
	if (typeof title === 'string' && title && title !== slug) {
		return title;
	}
	if (title && typeof title === 'object' && title.rendered) {
		return title.rendered;
	}
	return slug || String(template.id ?? '');
}

export function getTemplateDescription(template: TemplateLike): string {
	const { description } = template;
	if (typeof description === 'string') {
		return description;
	}
	if (description && typeof description === 'object') {
		return description.raw || description.rendered || '';
	}
	return '';
}

export { DEFAULT_TYPE_SLUGS };
