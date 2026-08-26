/**
 * 404 Templates Builder type options config.
 *
 * Markup never lives here: controls reference PHP catalog pools.
 */

import { FILTER_IDS } from '../../templates/filter-ids';
import {
	notFoundGroup,
	sidebarGroup,
	siteFooterGroup,
	siteHeaderGroup,
} from '../shared/sections';
import type { TemplateOptionsConfig } from '../shared/types';

export const NOT_FOUND_OPTIONS_CONFIG: TemplateOptionsConfig = {
	type: '404',
	filters: [FILTER_IDS.notFound],
	fallbackFilter: FILTER_IDS.notFound,
	layoutId: 'main',
	sectionHeuristics: {
		header: {
			kind: 'templatePart',
			area: 'header',
			slugIncludes: 'header',
		},
		footer: {
			kind: 'templatePart',
			area: 'footer',
			slugIncludes: 'footer',
		},
		sidebar: { kind: 'templatePart', slugPrefix: 'sidebar' },
		'not-found': { kind: 'groupWrapping', childName: 'core/heading' },
		'not-found-image': {
			kind: 'descendantBlock',
			parentId: 'not-found',
			name: 'core/image',
		},
		'not-found-title': {
			kind: 'descendantBlock',
			parentId: 'not-found',
			name: 'core/heading',
		},
		'not-found-description': {
			kind: 'descendantBlock',
			parentId: 'not-found',
			name: 'core/paragraph',
		},
		'not-found-search': {
			kind: 'descendantBlock',
			parentId: 'not-found',
			name: 'core/search',
		},
	},
	groups: [
		siteHeaderGroup(),
		notFoundGroup(),
		sidebarGroup(),
		siteFooterGroup(),
	],
};
