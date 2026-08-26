/**
 * Click / navigate actions for Templates purpose-nav rows.
 */

import { useCallback } from '@wordpress/element';

import { ROUTES } from '../constants';
import {
	FILTER_IDS,
	buildTemplateItemPath,
	getCoreActiveViewForFilter,
	isChildrenFilter,
	navigateTemplates,
	type PartAreaId,
} from './constants';
import { getBaseSlugForFilter, type TemplateLike } from './templates-matchers';
import { BLOG_POSTS_FILTER } from './templates-homepage-resolve';
import type { TemplatesNavItemConfig } from './templates-nav-config';

/**
 * True when clicking the row navigates to a single-template live canvas preview.
 * Browse / DataViews destinations return false (those keep a count).
 */
export function opensLivePreview(
	item: TemplatesNavItemConfig,
	findBySlug: (slug: string) => TemplateLike | undefined
): boolean {
	if (item.partsArea) {
		return true;
	}

	if (item.entityPath) {
		return true;
	}

	if (item.filter === FILTER_IDS.all || isChildrenFilter(item.filter)) {
		return false;
	}

	const baseSlug =
		item.baseSlug || getBaseSlugForFilter(item.filter) || undefined;

	// No base slug → Other tabs (Custom / author buckets) → DataViews.
	if (!baseSlug) {
		return false;
	}

	return !!findBySlug(baseSlug);
}

export function selectFilter(
	item: TemplatesNavItemConfig,
	findBySlug: (slug: string) => TemplateLike | undefined
): void {
	const filter = item.filter;

	// Homepage / Blog·Posts → selected page entity (not home.html).
	if (item.entityPath) {
		navigateTemplates(item.entityPath, {
			filter,
			partsArea: null,
			activeView: null,
			direction: 'forward',
		});
		return;
	}

	const baseSlug = item.baseSlug || getBaseSlugForFilter(filter) || undefined;
	const base = baseSlug ? findBySlug(baseSlug) : undefined;

	if (base?.id !== undefined) {
		navigateTemplates(buildTemplateItemPath(base.id), {
			filter,
			partsArea: null,
			activeView: null,
			direction: 'forward',
		});
		return;
	}

	const mappedActiveView = getCoreActiveViewForFilter(filter);

	// Browse: core PageTemplates, or Blockera filtered DataViews (Custom / children).
	navigateTemplates(ROUTES.templates, {
		filter,
		partsArea: null,
		activeView:
			filter === FILTER_IDS.custom ||
			isChildrenFilter(filter) ||
			filter === BLOG_POSTS_FILTER
				? null
				: (mappedActiveView ?? null),
		direction: 'forward',
	});
}

export function useTemplatesNavActions({
	onOpenPartsArea,
	findBySlug,
}: {
	onOpenPartsArea: (area: PartAreaId) => void;
	findBySlug: (slug: string) => TemplateLike | undefined;
}) {
	const onNavItemClick = useCallback(
		(item: TemplatesNavItemConfig) => {
			if (item.partsArea) {
				onOpenPartsArea(item.partsArea);
				return;
			}
			if (item.filter === FILTER_IDS.all) {
				navigateTemplates(ROUTES.templates, {
					clearFilter: true,
					partsArea: null,
					activeView: 'active',
				});
				return;
			}
			selectFilter(item, findBySlug);
		},
		[findBySlug, onOpenPartsArea]
	);

	return { onNavItemClick, opensLivePreview, selectFilter };
}
