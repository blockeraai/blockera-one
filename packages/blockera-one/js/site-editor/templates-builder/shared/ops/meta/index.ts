/**
 * Post Meta item parts, separators, and Items Design. Tree ops — no React.
 */

export {
	EMPTY_ICON_VALUE,
	isMetaSeparatorOption,
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
	isPostMetaItemId,
	isSpaceFillerId,
} from './ids';
export {
	getMetaItemListName,
	META_ITEM_LABELS,
	META_PART_LIST_NAMES,
	META_ROW_LIST_NAME,
	META_SEPARATOR_LIST_NAME,
	SPACE_FILLER_LIST_NAME,
} from './names';
export { getMetaItemsDesign, resolveMetaItemsForTree } from './payload';
export {
	ensureSpaceFiller,
	isEmptyIconValue,
	parkLiveItem,
	readMetaItemPart,
	setMetaItemPart,
	type MetaParkOverlay,
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
