/**
 * Template / template-part record fetching + derived lookups (active set,
 * user-owned ids, slug lookup, filter matcher). No nav/section knowledge.
 */

import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

import {
	FILTER_IDS,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
	type FilterId,
} from './constants';
import {
	DEFAULT_TYPE_SLUGS,
	getActiveTemplateParts,
	isCustomTemplate,
	templateMatchesFilter,
	type TemplateLike,
} from './templates-matchers';
import type { SiteReadingSettings } from './templates-homepage-resolve';

export type PostTypeRecord = {
	slug: string;
	name?: string;
	viewable?: boolean;
	has_archive?: boolean | string;
	labels?: { singular_name?: string; name?: string };
};

export type TemplateRecordsData = {
	templates: TemplateLike[];
	userTemplates: TemplateLike[];
	staticTemplates: TemplateLike[];
	/** Active theme's template parts. */
	activeParts: TemplateLike[];
	isLoading: boolean;
	activeIds: Set<string | number>;
	userIds: Set<string | number>;
	defaultTypeSlugs: Set<string>;
	/** Viewable CPTs (excluding built-ins) for dynamic nav rows. */
	publicPostTypes: PostTypeRecord[];
	siteReading?: SiteReadingSettings;
	findBySlug: (slug: string) => TemplateLike | undefined;
	filterTemplates: (filter: FilterId) => TemplateLike[];
};

function asId(value: string | number | undefined): string {
	return String(value ?? '');
}

export default function useTemplateRecords(): TemplateRecordsData {
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
		} = select(coreStore) as unknown as {
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

	const userTemplates = useMemo(
		() => (userRecords || []) as TemplateLike[],
		[userRecords]
	);
	const staticTemplates = useMemo(
		() => (staticRecords || []) as TemplateLike[],
		[staticRecords]
	);
	const partRecords = useMemo(() => (parts || []) as TemplateLike[], [parts]);

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

	return {
		templates,
		userTemplates,
		staticTemplates,
		activeParts,
		isLoading: loadingUser || loadingStatic || loadingParts,
		activeIds,
		userIds,
		defaultTypeSlugs,
		publicPostTypes,
		siteReading,
		findBySlug,
		filterTemplates,
	};
}
