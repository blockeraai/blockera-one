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
	type PartAreaId,
} from './constants';
import {
	DEFAULT_TYPE_SLUGS,
	getActiveTemplateParts,
	getChildTemplatesForFilter,
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
	getPartsForArea: (area: PartAreaId) => TemplateLike[];
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

		const homepageSection = next.find(
			(section) => section.id === 'homepage'
		);
		if (homepageSection) {
			homepageSection.items = buildHomepageSectionItems(
				findBySlug,
				siteReading
			);
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
					});
				});
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
	}, [publicPostTypes, templates, findBySlug, siteReading]);

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
					const count = activeParts.filter((part) => {
						const area = part.area || 'uncategorized';
						return area === item.partsArea;
					}).length;
					bump(String(item.id), count);
					return;
				}
				bump(String(item.id), filterTemplates(item.filter).length);
			});
		});

		PART_AREA_COUNT_KEYS.forEach((area) => {
			bump(
				`parts:${area}`,
				activeParts.filter(
					(part) => (part.area || 'uncategorized') === area
				).length
			);
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

	const getPartsForArea = useMemo(() => {
		return (area: PartAreaId) =>
			activeParts.filter(
				(part) => (part.area || 'uncategorized') === area
			);
	}, [activeParts]);

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
		getPartsForArea,
		findBySlug,
		filterTemplates,
	};
}

const PART_AREA_COUNT_KEYS: PartAreaId[] = [
	'header',
	'footer',
	'sidebar',
	'uncategorized',
	'navigation-overlay',
];

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
