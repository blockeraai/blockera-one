/**
 * Post Meta item parts, separators, and Items Design. Tree ops — no React.
 */

export {
	EMPTY_ICON_VALUE,
	META_ITEM_DEFAULTS,
	META_ITEM_PART_IDS,
	META_ITEMS_PRESETS,
	META_SEPARATOR_ID,
	META_SEPARATOR_OPTIONS,
	type ListingMetaItemsDesign,
	type MetaItemDesignConfig,
	type MetaItemPart,
	type MetaItemPartConfig,
	type MetaItemsDesignPayload,
	type MetaItemsPreset,
	type MetaSeparatorOption,
} from './constants';
export {
	getMetaItemSuffix,
	getMetaRowIdForSection,
	isMetaRowId,
	isSpaceFillerId,
} from './ids';
export { getMetaItemsDesign, resolveMetaItemsForTree } from './payload';
export {
	ensureSpaceFiller,
	isEmptyIconValue,
	readMetaItemPart,
	setMetaItemPart,
} from './parts';
export { readMetaSeparatorOption, syncMetaSeparators } from './separators';
export {
	adoptMetaItemDesign,
	applyListingMetaItemsPreset,
	applyMetaItemsDesignToSection,
	deriveMetaItemsDesign,
	setMetaItemsDesign,
} from './design';
export { applyMetaToggleSideEffects } from './toggle-side-effects';
