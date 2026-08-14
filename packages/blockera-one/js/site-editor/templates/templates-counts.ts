/**
 * Pure count helpers for the Templates purpose-nav: per-row browse counts and
 * the single "Specific templates" child row (with its count attached — one
 * source of truth for child counting).
 */

import { __ } from '@wordpress/i18n';

import { FILTER_IDS, buildChildrenFilter, type FilterId } from './constants';
import {
	getChildTemplatesForFilter,
	isCustomTemplate,
	type TemplateLike,
} from './templates-matchers';
import { findCanonicalPart } from './templates-hub-parts';
import type {
	TemplatesNavItemConfig,
	TemplatesNavSectionConfig,
} from './templates-nav-config';

export function buildTemplatesCounts(args: {
	templates: TemplateLike[];
	defaultTypeSlugs: Set<string>;
	sections: TemplatesNavSectionConfig[];
	activeParts: TemplateLike[];
	filterTemplates: (filter: FilterId) => TemplateLike[];
}): Record<string, number> {
	const { templates, defaultTypeSlugs, sections, activeParts } = args;
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
			bump(String(item.id), args.filterTemplates(item.filter).length);
		});
	});

	return map;
}

export type ChildNavItem = TemplatesNavItemConfig & {
	/** Number of specific child templates behind this row. */
	count: number;
};

/**
 * Single “Specific templates” nav row when the parent has any children.
 * Click opens a filtered DataViews browse (not a long per-template list).
 * The child count is attached so the nav does not recompute it.
 */
export function buildChildNavItems(
	templates: TemplateLike[],
	parent: TemplatesNavItemConfig
): ChildNavItem[] {
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
			label: __('Specific templates', 'blockera'),
			icon: { library: 'wp', icon: 'list-view', size: 20 },
			filter: childrenFilter,
			count: children.length,
		},
	];
}
