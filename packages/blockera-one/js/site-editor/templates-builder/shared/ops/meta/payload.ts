/**
 * PHP/window payload for Items Design, merged with listing overlays.
 */

import { applyFilters } from '@wordpress/hooks';

import { JS_FILTER_META_ITEMS_DESIGN } from '../../contracts';
import { getStamp } from '../../metadata';
import { formatStamp } from '../../stamp';
import { FULL_WIDTH_LISTING_STAMP, STAMP_IDS } from '../../stamp-ids';
import { findStampById } from '../../stamp-lookup';
import type { BlockNode } from '../../types';
import {
	EMPTY_PARTS,
	META_ITEM_DEFAULTS,
	type MetaItemDesignConfig,
	type MetaItemPartConfig,
	type MetaItemsDesignPayload,
	type MetaItemsPreset,
} from './constants';

export function isMetaItemsDesignPayload(
	value: unknown
): value is MetaItemsDesignPayload {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function isMetaItemsDesignPreset(
	value: unknown
): value is MetaItemsPreset {
	return value === 'simple' || value === 'labels' || value === 'icons';
}

/** PHP payload, then JS filter, then the built-in fallback. */
export function getMetaItemsDesign(): MetaItemsDesignPayload {
	const fallback: MetaItemsDesignPayload = {
		default: { items: META_ITEM_DEFAULTS },
		listings: {
			[FULL_WIDTH_LISTING_STAMP]: { preset: 'icons' },
		},
	};
	const fromWindow =
		typeof window !== 'undefined'
			? window.blockeraOneTemplateBuilder?.metaItemsDesign
			: undefined;
	const raw = isMetaItemsDesignPayload(fromWindow) ? fromWindow : fallback;
	return applyFilters(
		JS_FILTER_META_ITEMS_DESIGN,
		raw
	) as MetaItemsDesignPayload;
}

export function mergeDesignParts(
	base: MetaItemPartConfig | undefined,
	overlay: MetaItemPartConfig | undefined
): MetaItemPartConfig {
	return {
		...EMPTY_PARTS,
		...(base || {}),
		...(overlay || {}),
	};
}

export function mergeItemConfigs(
	base: Record<string, MetaItemDesignConfig>,
	overlay?: Record<string, MetaItemDesignConfig>
): Record<string, MetaItemDesignConfig> {
	if (!overlay) {
		return base;
	}
	const next: Record<string, MetaItemDesignConfig> = { ...base };
	const suffixes = Object.keys(overlay);
	for (let i = 0; i < suffixes.length; i++) {
		const suffix = suffixes[i];
		const fromBase = base[suffix];
		const fromOverlay = overlay[suffix];
		next[suffix] = {
			simple: mergeDesignParts(fromBase?.simple, fromOverlay?.simple),
			labels: mergeDesignParts(fromBase?.labels, fromOverlay?.labels),
			icons: mergeDesignParts(fromBase?.icons, fromOverlay?.icons),
		};
	}
	return next;
}

export function listingStampFromTree(blocks: BlockNode[]): string | null {
	const match = findStampById(blocks, STAMP_IDS.postsListing);
	const stamp = getStamp(match?.block);
	if (!stamp) {
		return null;
	}
	return formatStamp(stamp.role, stamp.id, stamp.variant);
}

/** Merged item map and optional listing preset for this tree. */
export function resolveMetaItemsForTree(blocks: BlockNode[]): {
	items: Record<string, MetaItemDesignConfig>;
	preset?: MetaItemsPreset;
} {
	const payload = getMetaItemsDesign();
	const base = payload.default?.items || META_ITEM_DEFAULTS;
	const stamp = listingStampFromTree(blocks);
	const listing = stamp ? payload.listings?.[stamp] : undefined;
	return {
		items: mergeItemConfigs(base, listing?.items),
		preset: isMetaItemsDesignPreset(listing?.preset)
			? listing.preset
			: undefined,
	};
}
