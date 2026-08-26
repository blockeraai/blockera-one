/**
 * Pure builder for the runtime Templates purpose-nav sections: static config
 * seeded with homepage rows, dynamic CPT rows, the WooCommerce journey and
 * "Other" author buckets.
 */

import { __, sprintf } from '@wordpress/i18n';

import type { NavItemIcon } from '../components/nav-item';
import { getTemplateTitle, type TemplateLike } from './templates-matchers';
import {
	buildHomepageSectionItems,
	type SiteReadingSettings,
} from './templates-homepage-resolve';
import {
	TEMPLATES_NAV_SECTIONS,
	type TemplatesNavItemConfig,
	type TemplatesNavSectionConfig,
} from './templates-nav-config';
import { hasRegisteredSidebarPart } from './templates-hub-parts';
import {
	getWooCommerceNavMeta,
	isWooCommerceShopChildSlug,
	isWooCommerceTemplate,
	sortWooCommerceShopChildTemplates,
	sortWooCommerceTopLevelTemplates,
} from './templates-woocommerce';
import type { PostTypeRecord } from './use-template-records';

/** Higher wins when one author bucket mixes sources. */
const AUTHOR_SOURCE_PRIORITY: Record<string, number> = {
	custom: 3,
	plugin: 2,
	theme: 1,
};

/**
 * Resolve author-bucket source for icons.
 * Prefer `source === 'custom'` (user-owned in DB) even when `original_source`
 * is still theme/plugin after customizing a shipped template.
 */
function getAuthorSource(template: TemplateLike): string {
	if (template.source === 'custom' || template.original_source === 'custom') {
		return 'custom';
	}
	return template.original_source || template.source || 'theme';
}

function getAuthorNavIcon(source: string): NavItemIcon {
	if (source === 'custom') {
		return { library: 'wp', icon: 'comment-author-avatar' };
	}
	if (source === 'plugin') {
		return { library: 'wp', icon: 'plugins' };
	}
	// This nav ships with Blockera One — theme authors always use the product mark.
	return { library: 'blockera', icon: 'blockera-one' };
}

export type BuildNavSectionsArgs = {
	templates: TemplateLike[];
	publicPostTypes: PostTypeRecord[];
	activeParts: TemplateLike[];
	siteReading?: SiteReadingSettings;
	findBySlug: (slug: string) => TemplateLike | undefined;
};

export function buildNavSections({
	templates,
	publicPostTypes,
	activeParts,
	siteReading,
	findBySlug,
}: BuildNavSectionsArgs): TemplatesNavSectionConfig[] {
	const next = TEMPLATES_NAV_SECTIONS.map((section) => ({
		...section,
		items: [...section.items],
	}));

	const generalSection = next.find((section) => section.id === 'general');
	if (generalSection) {
		const homepageItems = buildHomepageSectionItems(
			findBySlug,
			siteReading
		);
		const showSidebar = hasRegisteredSidebarPart(activeParts);
		const partItems = generalSection.items.filter((item) => {
			if (item.partsArea === 'sidebar') {
				return showSidebar;
			}
			return true;
		});
		generalSection.items = [...homepageItems, ...partItems];
	}

	const singleSection = next.find((section) => section.id === 'single');
	if (singleSection) {
		publicPostTypes.forEach((postType) => {
			singleSection.items.push({
				id: `cpt-single:${postType.slug}`,
				label: sprintf(
					/* translators: %s: post type singular name */
					__('Single: %s', 'blockera'),
					postType.labels?.singular_name ||
						postType.name ||
						postType.slug
				),
				// CPT singles use ui/post-new; core Single Post keeps ui/post.
				icon: { library: 'ui', icon: 'post-new' },
				filter: `cpt-single:${postType.slug}`,
				baseSlug:
					postType.slug === 'page'
						? 'page'
						: `single-${postType.slug}`,
				showChildren: true,
				// Only show when a base or child single-{cpt} template exists.
				hideWhenEmpty: true,
			});
		});
	}

	const archivesSection = next.find((section) => section.id === 'archives');
	if (archivesSection) {
		publicPostTypes
			.filter((postType) => !!postType.has_archive)
			.forEach((postType) => {
				archivesSection.items.push({
					id: `cpt-archive:${postType.slug}`,
					label: sprintf(
						/* translators: %s: post type singular name */
						__('Archive: %s', 'blockera'),
						postType.labels?.singular_name ||
							postType.name ||
							postType.slug
					),
					// CPT archives use ui/archive-new; core All Archives keeps wp/archive.
					icon: { library: 'ui', icon: 'archive-new' },
					filter: `cpt-archive:${postType.slug}`,
					baseSlug: `archive-${postType.slug}`,
					// Only show when a base or child archive-{cpt} template exists.
					hideWhenEmpty: true,
				});
			});
	}

	const wooSection = next.find((section) => section.id === 'woocommerce');
	if (wooSection) {
		const bySlug = new Map<string, TemplateLike>();
		templates.forEach((template) => {
			const slug = template.slug || '';
			if (!slug || !isWooCommerceTemplate(template)) {
				return;
			}
			if (!bySlug.has(slug)) {
				bySlug.set(slug, template);
			}
		});

		const toNavItem = (template: TemplateLike): TemplatesNavItemConfig => {
			const slug = template.slug || '';
			const meta = getWooCommerceNavMeta(slug);
			return {
				id: `child:${slug}`,
				label: meta?.label || getTemplateTitle(template),
				icon: meta?.icon || { library: 'wp', icon: 'plugins' },
				filter: `child:${slug}`,
				baseSlug: slug,
			};
		};

		const allWoo = Array.from(bySlug.values());
		const shopChildren = sortWooCommerceShopChildTemplates(
			allWoo.filter((template) =>
				isWooCommerceShopChildSlug(template.slug || '')
			)
		);
		const topLevel = sortWooCommerceTopLevelTemplates(
			allWoo.filter(
				(template) => !isWooCommerceShopChildSlug(template.slug || '')
			)
		);

		/*
		 * Shop journey (#1): Shop Page nests browse/discovery templates;
		 * then Single Product → Cart → Checkout → Order → Coming Soon.
		 */
		wooSection.items = topLevel.map((template) => {
			const item = toNavItem(template);
			if (template.slug === 'archive-product') {
				item.navChildren = shopChildren.map(toNavItem);
			}
			return item;
		});

		// If Shop Page is missing, keep browse templates as top-level rows.
		if (!bySlug.has('archive-product') && shopChildren.length > 0) {
			wooSection.items = [
				...shopChildren.map(toNavItem),
				...wooSection.items,
			];
		}

		// Hide the whole section when WooCommerce templates are absent.
		if (wooSection.items.length === 0) {
			const index = next.findIndex(
				(section) => section.id === 'woocommerce'
			);
			if (index !== -1) {
				next.splice(index, 1);
			}
		}
	}

	const otherSection = next.find((section) => section.id === 'other');
	if (otherSection) {
		const authors = new Map<
			string,
			{ item: TemplatesNavItemConfig; sourcePriority: number }
		>();

		templates.forEach((template) => {
			const author = template.author_text;
			if (!author) {
				return;
			}

			// WooCommerce has its own section — skip seeding Other author rows.
			if (isWooCommerceTemplate(template)) {
				return;
			}

			const source = getAuthorSource(template);
			const sourcePriority = AUTHOR_SOURCE_PRIORITY[source] ?? 0;
			const existing = authors.get(author);

			// Prefer user/custom over plugin over theme for mixed buckets.
			if (existing && existing.sourcePriority >= sourcePriority) {
				return;
			}

			authors.set(author, {
				sourcePriority,
				item: {
					id: `author:${author}`,
					label: author,
					icon: getAuthorNavIcon(source),
					filter: `author:${author}`,
				},
			});
		});
		authors.forEach(({ item }) => otherSection.items.push(item));
	}

	return next;
}
