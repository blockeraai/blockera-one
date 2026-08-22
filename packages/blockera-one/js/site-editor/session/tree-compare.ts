/**
 * Structural equality vs catalog HTML. Volatile editor ids do not count.
 */

import { getStamp } from '../templates-builder/shared/metadata';
import type { BlockNode } from '../templates-builder/shared/types';

const IGNORE_KEYS: Record<string, boolean> = {
	blockeraPropsId: true,
	blockeraCompatId: true,
	// Pattern / list-view bookkeeping — not a user design edit.
	patternName: true,
	categories: true,
	description: true,
	name: true,
	// Query loop envelope (perPage, inherit, queryId) is a shared listing
	// setting, preserved across design swaps — not a parked variant edit.
	query: true,
	queryId: true,
};

function isEmptyCollection(value: unknown): boolean {
	if (Array.isArray(value)) {
		return value.length === 0;
	}
	if (value && typeof value === 'object') {
		return Object.keys(value as object).length === 0;
	}
	return false;
}

function normalizeClassName(value: unknown): unknown {
	if (typeof value !== 'string') {
		return value;
	}
	return value
		.split(/\s+/)
		.filter(
			(token) =>
				token &&
				token !== 'blockera-block' &&
				!/^blockera-block-[\w-]+$/i.test(token)
		)
		.join(' ');
}

function normalizeValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(normalizeValue);
	}
	if (!value || typeof value !== 'object') {
		return value;
	}
	const rec = value as Record<string, unknown>;
	const out: Record<string, unknown> = {};
	const keys = Object.keys(rec).sort();
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (IGNORE_KEYS[key]) {
			continue;
		}
		if (key === 'className') {
			const className = normalizeClassName(rec[key]);
			if (className) {
				out[key] = className;
			}
			continue;
		}
		const nested = normalizeValue(rec[key]);
		if (isEmptyCollection(nested)) {
			continue;
		}
		out[key] = nested;
	}
	return out;
}

function normalizeNode(block: BlockNode): unknown {
	return {
		name: block.name,
		attributes: normalizeValue(block.attributes || {}),
		innerBlocks: (block.innerBlocks || []).map(normalizeNode),
	};
}

function stripIgnoredStamps(
	blocks: BlockNode[],
	ignoreStampIds: Set<string>
): BlockNode[] {
	const next: BlockNode[] = [];
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		const stamp = getStamp(block);
		if (stamp && ignoreStampIds.has(stamp.id)) {
			continue;
		}
		const inner = stripIgnoredStamps(
			block.innerBlocks || [],
			ignoreStampIds
		);
		if (
			!stamp &&
			inner.length === 0 &&
			(block.innerBlocks || []).length > 0
		) {
			continue;
		}
		next.push({ ...block, innerBlocks: inner });
	}
	return next;
}

export type TreeMatchOptions = {
	/** Stamp ids reapplied after swap (e.g. pagination) are not a parked edit. */
	ignoreStampIds?: string[];
};

function prepareTrees(
	live: BlockNode[],
	catalog: BlockNode[],
	options?: TreeMatchOptions
): { live: BlockNode[]; catalog: BlockNode[] } {
	const ignore = new Set((options?.ignoreStampIds || []).filter(Boolean));
	if (!ignore.size) {
		return { live, catalog };
	}
	return {
		live: stripIgnoredStamps(live, ignore),
		catalog: stripIgnoredStamps(catalog, ignore),
	};
}

export function treesMatchIgnoringVolatileIds(
	live: BlockNode[],
	catalog: BlockNode[],
	options?: TreeMatchOptions
): boolean {
	const prepared = prepareTrees(live, catalog, options);
	return (
		JSON.stringify(prepared.live.map(normalizeNode)) ===
		JSON.stringify(prepared.catalog.map(normalizeNode))
	);
}
