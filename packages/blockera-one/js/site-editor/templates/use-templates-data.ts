/**
 * Templates + parts data for purpose nav counts, children, and list filtering.
 * Thin composition — records fetching lives in `use-template-records.ts`,
 * section building in `build-nav-sections.ts`, counts in `templates-counts.ts`.
 */

import { useMemo } from '@wordpress/element';

import { buildNavSections } from './build-nav-sections';
import type { FilterId } from './constants';
import { buildTemplatesCounts } from './templates-counts';
import type { TemplateLike } from './templates-matchers';
import type { SiteReadingSettings } from './templates-homepage-resolve';
import type { TemplatesNavSectionConfig } from './templates-nav-config';
import useTemplateRecords from './use-template-records';

export { buildChildNavItems } from './templates-counts';

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

export default function useTemplatesData(): TemplatesData {
	const records = useTemplateRecords();
	const {
		templates,
		publicPostTypes,
		activeParts,
		siteReading,
		findBySlug,
		filterTemplates,
		defaultTypeSlugs,
	} = records;

	const sections = useMemo(
		() =>
			buildNavSections({
				templates,
				publicPostTypes,
				activeParts,
				siteReading,
				findBySlug,
			}),
		[templates, publicPostTypes, activeParts, siteReading, findBySlug]
	);

	const counts = useMemo(
		() =>
			buildTemplatesCounts({
				templates,
				defaultTypeSlugs,
				sections,
				activeParts,
				filterTemplates,
			}),
		[templates, defaultTypeSlugs, sections, activeParts, filterTemplates]
	);

	return {
		templates,
		userTemplates: records.userTemplates,
		staticTemplates: records.staticTemplates,
		parts: activeParts,
		isLoading: records.isLoading,
		activeIds: records.activeIds,
		userIds: records.userIds,
		defaultTypeSlugs,
		sections,
		counts,
		siteReading,
		findBySlug,
		filterTemplates,
	};
}
