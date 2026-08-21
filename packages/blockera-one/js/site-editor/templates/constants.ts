/**
 * Templates purpose-nav query keys, filter ids, and URL helpers (barrel).
 */

export {
	FILTER_IDS,
	CHILDREN_FILTER_PREFIX,
	buildChildrenFilter,
	isChildrenFilter,
	getParentFilterFromChildrenFilter,
	type FilterId,
} from './filter-ids';
export {
	TEMPLATES_ACTIVE_VIEW_QUERY,
	TEMPLATES_FILTER_QUERY,
	TEMPLATES_PARTS_AREA_QUERY,
	TEMPLATES_OPTIONS_PANEL_QUERY,
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PART_AREA_IDS,
	getTemplatesUrlState,
	getCoreActiveViewForFilter,
	buildTemplateItemPath,
	buildTemplatePartItemPath,
	buildPatternsTemplatePartsPath,
	type PartAreaId,
	type TemplatesUrlState,
} from './templates-url';
export {
	navigateTemplates,
	navigateToPatternsTemplatePartArea,
} from './navigate-templates';
