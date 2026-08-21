/**
 * Items Design preset: apply / derive Labels, Icons, or Simple on a row.
 */

import { getStamp } from '../../metadata';
import { STAMP_IDS } from '../../stamp-ids';
import { findStampById, type StampLookupOptions } from '../../stamp-lookup';
import type { BlockNode } from '../../types';
import {
	EMPTY_ICON_VALUE,
	EMPTY_PARTS,
	META_ITEM_PART_IDS,
	META_ITEMS_PRESETS,
	META_SEPARATOR_ID,
	type MetaItemDesignConfig,
	type MetaItemPart,
	type MetaItemsPreset,
} from './constants';
import {
	getMetaItemSuffix,
	getMetaRowIdForSection,
	isMetaRowId,
	isSpaceFillerId,
} from './ids';
import { resolveMetaItemsForTree } from './payload';
import {
	getParked,
	isEmptyIconValue,
	paragraphContent,
	readIconValue,
	replaceWrapper,
	setPartOnWrapper,
} from './parts';
import { rowItemChildren } from './separators';

function itemHasPart(wrapper: BlockNode, part: MetaItemPart): boolean {
	const inner = wrapper.innerBlocks || [];
	const id = META_ITEM_PART_IDS[part];
	for (let i = 0; i < inner.length; i++) {
		if (getStamp(inner[i])?.id === id) {
			if (part === 'icon') {
				return !isEmptyIconValue(readIconValue(inner[i]));
			}
			return paragraphContent(inner[i]).trim() !== '';
		}
	}
	return false;
}

export function deriveMetaItemsDesign(
	blocks: BlockNode[],
	rowId: string,
	excludeSectionId?: string,
	items?: Record<string, MetaItemDesignConfig>,
	lookup?: StampLookupOptions
): MetaItemsPreset | null {
	const row = findStampById(blocks, rowId, lookup);
	if (!row) {
		return 'simple';
	}
	const rowItems = rowItemChildren(row.block).filter((item) => {
		const id = getStamp(item)?.id || '';
		if (isSpaceFillerId(id)) {
			return false;
		}
		if (excludeSectionId && id === excludeSectionId) {
			return false;
		}
		return true;
	});
	if (!rowItems.length) {
		return excludeSectionId ? null : 'simple';
	}
	const defaults = items || resolveMetaItemsForTree(blocks).items;
	for (let d = 0; d < META_ITEMS_PRESETS.length; d++) {
		const design = META_ITEMS_PRESETS[d];
		let allMatch = true;
		for (let i = 0; i < rowItems.length; i++) {
			if (!itemMatchesDesign(rowItems[i], design, defaults)) {
				allMatch = false;
				break;
			}
		}
		if (allMatch) {
			return design;
		}
	}
	return null;
}

function itemMatchesDesign(
	item: BlockNode,
	design: MetaItemsPreset,
	defaults: Record<string, MetaItemDesignConfig>
): boolean {
	const suffix = getMetaItemSuffix(getStamp(item)?.id || '');
	const config = defaults[suffix]?.[design] || EMPTY_PARTS;
	return (
		itemHasPart(item, 'icon') === !isEmptyIconConfig(config.icon) &&
		itemHasPart(item, 'prefix') === !!configText(config.prefix) &&
		itemHasPart(item, 'suffix') === !!configText(config.suffix)
	);
}

function configText(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function isEmptyIconConfig(value: unknown): boolean {
	return value === '' || isEmptyIconValue(value);
}

function normalizeIconConfig(value: unknown): Record<string, unknown> | null {
	if (isEmptyIconConfig(value)) {
		return null;
	}
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}
	return {
		...EMPTY_ICON_VALUE,
		...(value as Record<string, unknown>),
	};
}

function livePartBlock(
	wrapper: BlockNode,
	partId: string
): BlockNode | undefined {
	return (wrapper.innerBlocks || []).find(
		(child) => getStamp(child)?.id === partId
	);
}

function applyDesignToWrapper(
	wrapper: BlockNode,
	design: MetaItemsPreset,
	sectionId: string,
	items: Record<string, MetaItemDesignConfig>
): BlockNode {
	const suffix = getMetaItemSuffix(sectionId);
	const config = items[suffix]?.[design] || EMPTY_PARTS;
	const parked = getParked(wrapper);
	let next = wrapper;

	const liveIcon = readIconValue(
		livePartBlock(wrapper, META_ITEM_PART_IDS.icon)
	);
	const iconConfig = normalizeIconConfig(config.icon);
	if (!iconConfig) {
		next = setPartOnWrapper(next, 'icon', null);
	} else {
		const icon =
			(liveIcon && !isEmptyIconValue(liveIcon) ? liveIcon : null) ||
			(parked.icon && !isEmptyIconValue(parked.icon)
				? parked.icon
				: null) ||
			iconConfig;
		next = setPartOnWrapper(next, 'icon', icon);
	}

	const prefixConfig = configText(config.prefix);
	if (!prefixConfig) {
		next = setPartOnWrapper(next, 'prefix', '');
	} else {
		const livePrefix = paragraphContent(
			livePartBlock(wrapper, META_ITEM_PART_IDS.prefix)
		);
		next = setPartOnWrapper(
			next,
			'prefix',
			livePrefix ||
				(typeof parked.prefix === 'string' && parked.prefix) ||
				prefixConfig
		);
	}

	const suffixConfig = configText(config.suffix);
	if (!suffixConfig) {
		next = setPartOnWrapper(next, 'suffix', '');
	} else {
		const liveSuffix = paragraphContent(
			livePartBlock(wrapper, META_ITEM_PART_IDS.suffix)
		);
		next = setPartOnWrapper(
			next,
			'suffix',
			liveSuffix ||
				(typeof parked.suffix === 'string' && parked.suffix) ||
				suffixConfig
		);
	}

	return next;
}

export function applyMetaItemsDesignToSection(
	blocks: BlockNode[],
	sectionId: string,
	design: MetaItemsPreset,
	items?: Record<string, MetaItemDesignConfig>,
	lookup?: StampLookupOptions
): BlockNode[] {
	if (isSpaceFillerId(sectionId)) {
		return blocks;
	}
	const wrapper = findStampById(blocks, sectionId, lookup);
	if (!wrapper) {
		return blocks;
	}
	const itemsMap = items || resolveMetaItemsForTree(blocks).items;
	return replaceWrapper(
		blocks,
		wrapper,
		applyDesignToWrapper(wrapper.block, design, sectionId, itemsMap)
	);
}

export function setMetaItemsDesign(
	blocks: BlockNode[],
	rowId: string,
	design: MetaItemsPreset,
	items?: Record<string, MetaItemDesignConfig>,
	lookup?: StampLookupOptions
): BlockNode[] {
	const row = findStampById(blocks, rowId, lookup);
	if (!row) {
		return blocks;
	}
	const itemsMap = items || resolveMetaItemsForTree(blocks).items;
	const nextInner = (row.block.innerBlocks || []).map((child) => {
		const stamp = getStamp(child);
		if (
			!stamp ||
			stamp.id === META_SEPARATOR_ID ||
			stamp.role !== 'section' ||
			isSpaceFillerId(stamp.id)
		) {
			return child;
		}
		return applyDesignToWrapper(child, design, stamp.id, itemsMap);
	});
	return replaceWrapper(blocks, row, {
		...row.block,
		innerBlocks: nextInner,
	});
}

export function applyListingMetaItemsPreset(blocks: BlockNode[]): BlockNode[] {
	const resolved = resolveMetaItemsForTree(blocks);
	if (!resolved.preset) {
		return blocks;
	}
	const tree = setMetaItemsDesign(
		blocks,
		STAMP_IDS.postMeta,
		resolved.preset,
		resolved.items
	);
	return setMetaItemsDesign(
		tree,
		STAMP_IDS.postMeta2,
		resolved.preset,
		resolved.items
	);
}

export function adoptMetaItemDesign(
	blocks: BlockNode[],
	sectionId: string,
	lookup?: StampLookupOptions
): BlockNode[] {
	const rowId = getMetaRowIdForSection(sectionId);
	if (!rowId || isSpaceFillerId(sectionId) || isMetaRowId(sectionId)) {
		return blocks;
	}
	const itemsMap = resolveMetaItemsForTree(blocks).items;
	const design = deriveMetaItemsDesign(
		blocks,
		rowId,
		sectionId,
		itemsMap,
		lookup
	);
	if (!design) {
		return blocks;
	}
	return applyMetaItemsDesignToSection(
		blocks,
		sectionId,
		design,
		itemsMap,
		lookup
	);
}
