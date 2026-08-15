/**
 * Resolve and persist the full inner-element order for a stamped parent.
 *
 * Present children live in the block tree. Off items are removed, so the
 * complete list (including off slots) is stored on the parent as
 * `metadata.blockeraOneInnerOrder` after the first drag.
 */

import { getStamp } from './metadata';
import { resolveSectionState } from './resolve-state';
import { getAtPath, replaceAtPath } from './tree';
import type {
	BlockNode,
	ControlDef,
	InnerOrderRule,
	PanelGroupDef,
} from './types';

export const INNER_ORDER_META_KEY = 'blockeraOneInnerOrder';

function getParentNode(
	blocks: BlockNode[],
	parentId: string
): { path: number[]; node: BlockNode } | null {
	const parent = resolveSectionState(blocks, parentId);
	if (!parent.path) {
		return null;
	}
	const node = getAtPath(blocks, parent.path);
	if (!node) {
		return null;
	}
	return { path: parent.path, node };
}

function getMetadata(
	block: BlockNode | null | undefined
): Record<string, unknown> {
	const metadata = block?.attributes?.metadata;
	if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
		return {};
	}
	return metadata as Record<string, unknown>;
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
 * items keep a slot in the stored list.
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

/** Read a previously dragged order from the parent section, if any. */
export function getStoredElementOrder(
	blocks: BlockNode[],
	parentId: string
): string[] | null {
	const found = getParentNode(blocks, parentId);
	if (!found) {
		return null;
	}
	const stored = sanitizeIds(getMetadata(found.node)[INNER_ORDER_META_KEY]);
	return stored.length ? stored : null;
}

/**
 * Full list order: stored metadata wins; otherwise live child stamps plus
 * remaining `rule.ids` (off items append in config order).
 */
export function resolveElementOrder(
	blocks: BlockNode[],
	rule: InnerOrderRule
): string[] {
	const knownIds = rule.ids || [];
	const found = getParentNode(blocks, rule.parentId);
	if (!found) {
		return knownIds.slice();
	}
	const stored = getMetadata(found.node)[INNER_ORDER_META_KEY];
	if (Array.isArray(stored) && stored.length) {
		return normalizeElementOrder(stored, knownIds);
	}
	return appendMissing(liveChildIds(found.node, knownIds), knownIds);
}

/** Write the full ordered id list onto the parent section. */
export function persistElementOrder(
	blocks: BlockNode[],
	parentId: string,
	orderedIds: string[]
): BlockNode[] {
	const found = getParentNode(blocks, parentId);
	if (!found) {
		return blocks;
	}
	return replaceAtPath(blocks, found.path, {
		...found.node,
		attributes: {
			...(found.node.attributes || {}),
			metadata: {
				...getMetadata(found.node),
				[INNER_ORDER_META_KEY]: orderedIds.slice(),
			},
		},
	});
}

/** Drop a stored drag order so the next resolve reads the live pattern. */
export function clearStoredElementOrder(
	blocks: BlockNode[],
	parentId: string
): BlockNode[] {
	const found = getParentNode(blocks, parentId);
	if (!found) {
		return blocks;
	}
	const metadata = getMetadata(found.node);
	if (!(INNER_ORDER_META_KEY in metadata)) {
		return blocks;
	}
	const nextMeta = { ...metadata };
	delete nextMeta[INNER_ORDER_META_KEY];
	return replaceAtPath(blocks, found.path, {
		...found.node,
		attributes: {
			...(found.node.attributes || {}),
			metadata: nextMeta,
		},
	});
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
