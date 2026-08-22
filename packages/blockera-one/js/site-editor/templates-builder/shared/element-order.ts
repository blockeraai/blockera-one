/**
 * Resolve inner-element order for a stamped parent.
 *
 * Present children live in the block tree. Off items are removed from
 * the tree and listed after live stamps (config `rule.ids` order).
 * Session freeze keeps mixed on/off order while the panel is open.
 */

import { getMetaName, getStamp } from './metadata';
import { resolveSectionState } from './resolve/resolve-state';
import { lookupFromInnerOrder, type StampLookupOptions } from './stamp-lookup';
import { getAtPath } from './tree';
import type {
	BlockNode,
	ControlDef,
	InnerOrderRule,
	PanelGroupDef,
} from './types';

function getParentNode(
	blocks: BlockNode[],
	parentId: string,
	lookup?: StampLookupOptions
): { path: number[]; node: BlockNode } | null {
	const parent = resolveSectionState(blocks, parentId, [], lookup);
	if (!parent.path) {
		return null;
	}
	const node = getAtPath(blocks, parent.path);
	if (!node) {
		return null;
	}
	return { path: parent.path, node };
}

function sanitizeIds(ids: unknown, knownIds?: string[]): string[] {
	if (!Array.isArray(ids)) {
		return [];
	}
	const known = knownIds?.length ? new Set(knownIds) : null;
	const seen: Record<string, true> = {};
	const result: string[] = [];
	for (let i = 0; i < ids.length; i++) {
		const id = ids[i];
		if (typeof id !== 'string' || !id || seen[id]) {
			continue;
		}
		if (known && !known.has(id)) {
			continue;
		}
		seen[id] = true;
		result.push(id);
	}
	return result;
}

function appendMissing(ids: string[], knownIds: string[]): string[] {
	if (!knownIds.length) {
		return ids;
	}
	const seen: Record<string, true> = {};
	for (let i = 0; i < ids.length; i++) {
		seen[ids[i]] = true;
	}
	const result = ids.slice();
	for (let i = 0; i < knownIds.length; i++) {
		const id = knownIds[i];
		if (!seen[id]) {
			result.push(id);
		}
	}
	return result;
}

/**
 * Dedupe, drop unknown ids, then append any missing config ids so off
 * items keep a slot in the resolved list.
 */
export function normalizeElementOrder(
	ids: unknown,
	knownIds: string[] = []
): string[] {
	return appendMissing(
		sanitizeIds(ids, knownIds.length ? knownIds : undefined),
		knownIds
	);
}

function liveChildIds(node: BlockNode, knownIds: string[]): string[] {
	const known = knownIds.length ? new Set(knownIds) : null;
	const seen: Record<string, true> = {};
	const result: string[] = [];
	const children = node.innerBlocks || [];
	for (let i = 0; i < children.length; i++) {
		const id = getStamp(children[i])?.id;
		if (!id || seen[id] || (known && !known.has(id))) {
			continue;
		}
		seen[id] = true;
		result.push(id);
	}
	return result;
}

/**
 * Full list order: live child stamps plus remaining `rule.ids`
 * (off items append in config order).
 */
export function resolveElementOrder(
	blocks: BlockNode[],
	rule: InnerOrderRule
): string[] {
	const knownIds = rule.ids || [];
	const lookup = lookupFromInnerOrder(rule);
	const found = getParentNode(blocks, rule.parentId, lookup);
	if (!found) {
		return knownIds.slice();
	}
	return appendMissing(liveChildIds(found.node, knownIds), knownIds);
}

export function getGroupInnerOrder(
	group: PanelGroupDef
): InnerOrderRule | null {
	for (let i = 0; i < group.controls.length; i++) {
		const rule = group.controls[i].innerOrder;
		if (rule?.parentId && rule.ids?.length) {
			return rule;
		}
	}
	return null;
}

export function isSortableElementControl(control: ControlDef): boolean {
	return (
		control.type === 'toggle' &&
		!!control.nestedPanel &&
		!!control.innerOrder?.parentId
	);
}

export type ElementBucket = {
	parentId: string;
	ids: string[];
};

/**
 * Stable partition: on items keep their relative order, then off items
 * keep theirs. Used to show disabled rows at the end of a sortable list.
 */
export function partitionOffIdsToEnd(
	ids: string[],
	isOn: (id: string) => boolean
): string[] {
	const on: string[] = [];
	const off: string[] = [];
	for (let i = 0; i < ids.length; i++) {
		const id = ids[i];
		if (isOn(id)) {
			on.push(id);
		} else {
			off.push(id);
		}
	}
	return on.concat(off);
}

export function partitionElementBucketsOffToEnd(
	buckets: ElementBucket[],
	isOn: (id: string) => boolean
): ElementBucket[] {
	return buckets.map((bucket) => ({
		parentId: bucket.parentId,
		ids: partitionOffIdsToEnd(bucket.ids, isOn),
	}));
}

/**
 * Keep a frozen id order, drop unknown ids, then append newly appeared
 * ids (on then off) so a list can grow without re-sorting the freeze.
 */
export function overlayFrozenIds(
	resolvedIds: string[],
	frozenIds: string[],
	isOn: (id: string) => boolean
): string[] {
	const known: Record<string, true> = {};
	for (let i = 0; i < resolvedIds.length; i++) {
		known[resolvedIds[i]] = true;
	}
	const result: string[] = [];
	const seen: Record<string, true> = {};
	for (let i = 0; i < frozenIds.length; i++) {
		const id = frozenIds[i];
		if (!known[id] || seen[id]) {
			continue;
		}
		seen[id] = true;
		result.push(id);
	}
	const missing: string[] = [];
	for (let i = 0; i < resolvedIds.length; i++) {
		const id = resolvedIds[i];
		if (!seen[id]) {
			missing.push(id);
		}
	}
	return result.concat(partitionOffIdsToEnd(missing, isOn));
}

/**
 * Frozen parent wins even when resolved leftovers sit on the last
 * parent (off items are not in the tree).
 */
export function overlayFrozenBuckets(
	resolved: ElementBucket[],
	frozen: ElementBucket[],
	isOn: (id: string) => boolean
): ElementBucket[] {
	const known: Record<string, true> = {};
	for (let i = 0; i < resolved.length; i++) {
		const ids = resolved[i].ids;
		for (let j = 0; j < ids.length; j++) {
			known[ids[j]] = true;
		}
	}
	const frozenByParent: Record<string, string[]> = {};
	for (let i = 0; i < frozen.length; i++) {
		frozenByParent[frozen[i].parentId] = frozen[i].ids;
	}
	const placed: Record<string, true> = {};
	const next: ElementBucket[] = [];
	for (let i = 0; i < resolved.length; i++) {
		const bucket = resolved[i];
		const frozenIds = frozenByParent[bucket.parentId] || [];
		const ids: string[] = [];
		for (let f = 0; f < frozenIds.length; f++) {
			const id = frozenIds[f];
			if (!known[id] || placed[id]) {
				continue;
			}
			placed[id] = true;
			ids.push(id);
		}
		const missing: string[] = [];
		for (let r = 0; r < bucket.ids.length; r++) {
			const id = bucket.ids[r];
			if (!placed[id]) {
				missing.push(id);
			}
		}
		next.push({
			parentId: bucket.parentId,
			ids: ids.concat(partitionOffIdsToEnd(missing, isOn)),
		});
	}
	return next;
}

/** Display buckets: freeze overlay, or partition on first view. */
export function resolveDisplayBuckets(
	resolved: ElementBucket[],
	frozen: ElementBucket[] | undefined,
	isOn: (id: string) => boolean
): { buckets: ElementBucket[]; seeded: boolean } {
	if (frozen) {
		return {
			buckets: overlayFrozenBuckets(resolved, frozen, isOn),
			seeded: false,
		};
	}
	return {
		buckets: partitionElementBucketsOffToEnd(resolved, isOn),
		seeded: true,
	};
}

/** Live Gutenberg `metadata.name` on a stamped parent, or empty. */
export function resolveParentStampName(
	blocks: BlockNode[],
	parentId: string,
	lookup?: StampLookupOptions
): string {
	const found = getParentNode(blocks, parentId, lookup);
	return found ? getMetaName(found.node) : '';
}

/**
 * Stamp id of the immediate parent of a stamped section, if that parent
 * itself is stamped (body / media / post-meta).
 */
export function findLiveParentStampId(
	blocks: BlockNode[],
	sectionId: string,
	lookup?: StampLookupOptions
): string | null {
	const child = resolveSectionState(blocks, sectionId, [], lookup);
	if (!child.path || child.path.length === 0) {
		return null;
	}
	const parentPath = child.path.slice(0, -1);
	if (parentPath.length === 0) {
		return null;
	}
	const parent = getAtPath(blocks, parentPath);
	return getStamp(parent)?.id || null;
}

/**
 * Parent to insert a toggled-on bucketed element into: last existing
 * bucket parent (body is listed last).
 */
export function resolveBucketInsertParent(
	blocks: BlockNode[],
	sectionId: string,
	bucketParents: string[],
	fallbackId: string,
	lookup?: StampLookupOptions
): string {
	for (let i = bucketParents.length - 1; i >= 0; i--) {
		const parentId = bucketParents[i];
		if (resolveSectionState(blocks, parentId, [], lookup).path) {
			return parentId;
		}
	}
	return fallbackId;
}

/**
 * Split known element ids across existing bucket parents. Live
 * placement wins; leftovers go to the last existing parent.
 */
export function resolveElementBuckets(
	blocks: BlockNode[],
	rule: InnerOrderRule
): ElementBucket[] {
	const knownIds = rule.ids || [];
	const bucketParents = rule.bucketParents || [];
	if (!bucketParents.length) {
		return [
			{
				parentId: rule.parentId,
				ids: resolveElementOrder(blocks, rule),
			},
		];
	}
	const lookup = lookupFromInnerOrder(rule);

	const existing: string[] = [];
	for (let i = 0; i < bucketParents.length; i++) {
		const parentId = bucketParents[i];
		if (resolveSectionState(blocks, parentId, [], lookup).path) {
			existing.push(parentId);
		}
	}
	if (!existing.length) {
		return [{ parentId: rule.parentId, ids: knownIds.slice() }];
	}

	const assigned: Record<string, string> = {};
	const lastParent = existing[existing.length - 1];
	for (let i = 0; i < knownIds.length; i++) {
		const id = knownIds[i];
		const live = findLiveParentStampId(blocks, id, lookup);
		assigned[id] =
			live && existing.indexOf(live) !== -1 ? live : lastParent;
	}

	const buckets: ElementBucket[] = [];
	for (let i = 0; i < existing.length; i++) {
		const parentId = existing[i];
		const inBucket: string[] = [];
		for (let k = 0; k < knownIds.length; k++) {
			if (assigned[knownIds[k]] === parentId) {
				inBucket.push(knownIds[k]);
			}
		}
		const ordered = resolveElementOrder(blocks, {
			parentId,
			ids: inBucket,
			within: rule.within,
		});
		buckets.push({ parentId, ids: ordered });
	}
	return buckets;
}
