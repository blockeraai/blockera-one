/**
 * Purpose-nav filter ↔ slug matching.
 */

import {
	FILTER_IDS,
	getParentFilterFromChildrenFilter,
	isChildrenFilter,
	type FilterId,
} from './filter-ids';
import { DEFAULT_TYPE_SLUGS, isCustomTemplate } from './hierarchy';
import type { TemplateLike } from './template-display';
import { isWooCommerceTemplate } from './templates-woocommerce';

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

	/*
	 * WooCommerce templates live in their own nav section. Keep them out of
	 * purpose / CPT / default slug filters (All / Active / User / child: already
	 * handled above; Custom via isCustomTemplate).
	 */
	if (isWooCommerceTemplate(template)) {
		return false;
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
