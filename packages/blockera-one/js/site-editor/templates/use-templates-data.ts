/**
 * Templates + parts data for purpose nav counts, children, and list filtering.
 */

import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import {
	FILTER_IDS,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
	buildChildrenFilter,
	type FilterId,
} from './constants';
import {
	DEFAULT_TYPE_SLUGS,
	getActiveTemplateParts,
	getChildTemplatesForFilter,
	getTemplateTitle,
	isCustomTemplate,
	templateMatchesFilter,
	type TemplateLike,
} from './templates-matchers';
import {
	buildHomepageSectionItems,
	type SiteReadingSettings,
} from './templates-homepage-resolve';
import {
	TEMPLATES_NAV_SECTIONS,
	type NavIcon,
	type TemplatesNavItemConfig,
	type TemplatesNavSectionConfig,
} from './templates-nav-config';
import {
	findCanonicalPart,
	hasRegisteredSidebarPart,
} from './templates-hub-parts';
import {
	getWooCommerceNavMeta,
	isWooCommerceShopChildSlug,
	isWooCommerceTemplate,
	sortWooCommerceShopChildTemplates,
	sortWooCommerceTopLevelTemplates,
} from './templates-woocommerce';

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

function getAuthorNavIcon(source: string): NavIcon {
	if (source === 'custom') {
		return 'author';
	}
	if (source === 'plugin') {
		return 'plugins';
	}
	// This nav ships with Blockera One — theme authors always use the product mark.
	return 'blockera-one';
}

type PostTypeRecord = {
	slug: string;
	name?: string;
	viewable?: boolean;
	has_archive?: boolean | string;
	labels?: { singular_name?: string; name?: string };
};

export type TemplatesData = {
	templates: TemplateLike[];
	userTemplates: TemplateLike[];
	staticTemplates: TemplateLike[];
	parts: TemplateLike[];
	isLoading: boolean;
	activeIds: Set<string | number>;
	userIds: Set<string | number>;
	defaultTypeSlugs: Set<string>;
	sections: TemplatesNavSectionConfig[];
	counts: Record<string, number>;
	siteReading?: SiteReadingSettings;
	findBySlug: (slug: string) => TemplateLike | undefined;
	filterTemplates: (filter: FilterId) => TemplateLike[];
};

function asId(value: string | number | undefined): string {
	return String(value ?? '');
}

export default function useTemplatesData(): TemplatesData {
	const { records: userRecords, isResolving: loadingUser } = useEntityRecords(
		'postType',
		TEMPLATE_POST_TYPE,
		{ per_page: -1 }
	);

	const { records: staticRecords, isResolving: loadingStatic } =
		useEntityRecords('root', 'registeredTemplate', { per_page: -1 });

	const { records: parts, isResolving: loadingParts } = useEntityRecords(
		'postType',
		TEMPLATE_PART_POST_TYPE,
		{ per_page: -1 }
	);

	const {
		activeTemplatesOption,
		activeTheme,
		defaultTemplateTypes,
		postTypes,
		siteReading,
	} = useSelect((select) => {
		const {
			getEntityRecord,
			getEditedEntityRecord,
			getCurrentTheme,
			getPostTypes,
		} = select(coreStore) as {
			getEntityRecord: (
				kind: string,
				name: string
			) =>
				| { active_templates?: Record<string, string | number> }
				| undefined;
			getEditedEntityRecord: (
				kind: string,
				name: string
			) =>
				| {
						show_on_front?: string;
						page_on_front?: number;
						page_for_posts?: number;
						active_templates?: Record<string, string | number>;
				  }
				| undefined;
			getCurrentTheme: () => {
				stylesheet?: string;
				default_template_types?: Array<{ slug: string }>;
				default_template_part_areas?: Array<{ area: string }>;
			};
			getPostTypes: (query: { per_page: number }) => PostTypeRecord[];
		};

		const site = getEditedEntityRecord('root', 'site');

		return {
			activeTemplatesOption:
				site?.active_templates ||
				getEntityRecord('root', 'site')?.active_templates,
			activeTheme: getCurrentTheme(),
			defaultTemplateTypes: getCurrentTheme()?.default_template_types,
			postTypes: getPostTypes({ per_page: -1 }) || [],
			siteReading: site
				? {
						show_on_front: site.show_on_front,
						page_on_front: site.page_on_front,
						page_for_posts: site.page_for_posts,
					}
				: undefined,
		};
	}, []);

	const defaultTypeSlugs = useMemo(() => {
		const set = new Set(DEFAULT_TYPE_SLUGS);
		(defaultTemplateTypes || []).forEach((type) => {
			if (type?.slug) {
				set.add(type.slug);
			}
		});
		return set;
	}, [defaultTemplateTypes]);

	const userTemplates = (userRecords || []) as TemplateLike[];
	const staticTemplates = (staticRecords || []) as TemplateLike[];
	const partRecords = (parts || []) as TemplateLike[];

	const activeParts = useMemo(
		() => getActiveTemplateParts(partRecords, activeTheme?.stylesheet),
		[partRecords, activeTheme?.stylesheet]
	);

	const activeTemplates = useMemo(() => {
		const stylesheet = activeTheme?.stylesheet;

		if (staticTemplates.length > 0 || activeTemplatesOption) {
			const active = [...staticTemplates];

			if (activeTemplatesOption) {
				for (const activeSlug in activeTemplatesOption) {
					const activeId = activeTemplatesOption[activeSlug];
					const template = userTemplates.find(
						(userRecord) =>
							userRecord.id === activeId &&
							(!stylesheet || userRecord.theme === stylesheet)
					);
					if (!template) {
						continue;
					}
					const index = active.findIndex(
						(item) => item.slug === template.slug
					);
					if (index !== -1) {
						active[index] = template;
					} else {
						active.push(template);
					}
				}
			}

			return active;
		}

		// Legacy (no template-activation experiment): non-custom templates.
		return userTemplates.filter(
			(template) => !isCustomTemplate(template, defaultTypeSlugs)
		);
	}, [
		userTemplates,
		staticTemplates,
		activeTemplatesOption,
		activeTheme,
		defaultTypeSlugs,
	]);

	const activeIds = useMemo(() => {
		const set = new Set<string | number>();
		activeTemplates.forEach((template) => {
			if (template.id !== undefined) {
				set.add(template.id);
			}
		});
		return set;
	}, [activeTemplates]);

	const userIds = useMemo(() => {
		const set = new Set<string | number>();
		userTemplates.forEach((template) => {
			const source = template.original_source || template.source;
			if (template.id !== undefined && source === 'custom') {
				set.add(template.id);
			}
		});
		return set;
	}, [userTemplates]);

	const templates = useMemo(() => {
		const byKey = new Map<string, TemplateLike>();
		[...staticTemplates, ...userTemplates].forEach((template) => {
			const key = asId(template.id) || template.slug || '';
			if (key) {
				byKey.set(key, template);
			}
		});
		return Array.from(byKey.values());
	}, [staticTemplates, userTemplates]);

	const findBySlug = useMemo(() => {
		return (slug: string) =>
			templates.find((template) => template.slug === slug) ||
			activeTemplates.find((template) => template.slug === slug);
	}, [templates, activeTemplates]);

	const filterTemplates = useMemo(() => {
		return (filter: FilterId) => {
			const source =
				filter === FILTER_IDS.active ? activeTemplates : templates;

			return source.filter((template) =>
				templateMatchesFilter(template, filter, {
					defaultTypeSlugs,
					isActive:
						template.id !== undefined && activeIds.has(template.id),
					isUserRecord:
						template.id !== undefined && userIds.has(template.id),
				})
			);
		};
	}, [templates, activeTemplates, defaultTypeSlugs, activeIds, userIds]);

	const publicPostTypes = useMemo(() => {
		const excluded = new Set([
			'attachment',
			'wp_template',
			'wp_template_part',
		]);
		return postTypes
			.filter(
				(postType) =>
					postType.viewable &&
					!excluded.has(postType.slug) &&
					postType.slug !== 'post' &&
					postType.slug !== 'page'
			)
			.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
	}, [postTypes]);

	const sections = useMemo(() => {
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
					icon: 'post',
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

		const archivesSection = next.find(
			(section) => section.id === 'archives'
		);
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
						icon: 'archive',
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

			const toNavItem = (
				template: TemplateLike
			): TemplatesNavItemConfig => {
				const slug = template.slug || '';
				const meta = getWooCommerceNavMeta(slug);
				return {
					id: `child:${slug}`,
					label: meta?.label || getTemplateTitle(template),
					icon: (meta?.icon || 'plugins') as NavIcon,
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
					(template) =>
						!isWooCommerceShopChildSlug(template.slug || '')
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
	}, [publicPostTypes, templates, findBySlug, siteReading, activeParts]);

	const counts = useMemo(() => {
		const map: Record<string, number> = {};

		const bump = (id: string, count: number) => {
			map[id] = count;
		};

		bump(FILTER_IDS.all, templates.length);
		bump(
			FILTER_IDS.custom,
			templates.filter((template) =>
				isCustomTemplate(template, defaultTypeSlugs)
			).length
		);

		sections.forEach((section) => {
			section.items.forEach((item) => {
				if (item.partsArea) {
					bump(
						String(item.id),
						findCanonicalPart(item.partsArea, activeParts) ? 1 : 0
					);
					return;
				}
				bump(String(item.id), filterTemplates(item.filter).length);
			});
		});

		return map;
	}, [
		templates,
		userTemplates,
		activeParts,
		sections,
		filterTemplates,
		defaultTypeSlugs,
	]);

	return {
		templates,
		userTemplates,
		staticTemplates,
		parts: activeParts,
		isLoading: loadingUser || loadingStatic || loadingParts,
		activeIds,
		userIds,
		defaultTypeSlugs,
		sections,
		counts,
		siteReading,
		findBySlug,
		filterTemplates,
	};
}

/**
 * Single “Child templates” nav row when the parent has any children.
 * Click opens a filtered DataViews browse (not a long per-template list).
 */
export function buildChildNavItems(
	templates: TemplateLike[],
	parent: TemplatesNavItemConfig
): TemplatesNavItemConfig[] {
	if (!parent.showChildren) {
		return [];
	}

	const children = getChildTemplatesForFilter(templates, parent.filter);
	if (children.length === 0) {
		return [];
	}

	const childrenFilter = buildChildrenFilter(parent.filter);
	return [
		{
			id: childrenFilter,
			label: __('Child templates', 'blockera'),
			icon: 'list',
			filter: childrenFilter,
		},
	];
}
