/**
 * Place, reorder, and move stamped children inside a parent.
 */

import { insertAtPlacement } from './op-context';
import { getStamp } from './metadata';
import { resolveSectionState } from './resolve/resolve-state';
import type { StampLookupOptions } from './stamp-lookup';
import { getAtPath, removeAtPath, replaceAtPath } from './tree';
import type { BlockNode, InsertRule } from './types';

/**
 * Move an existing stamped section to a placement (inside-start / inside-end
 * of a parent, or before/after a sibling). No-op when the section is missing.
 */
export function placeSection(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		placement: InsertRule;
		lookup?: StampLookupOptions;
	}
): BlockNode[] {
	const state = resolveSectionState(
		blocks,
		params.sectionId,
		[],
		params.lookup
	);
	if (!state.path) {
		return blocks;
	}
	const node = getAtPath(blocks, state.path);
	if (!node) {
		return blocks;
	}
	const without = removeAtPath(blocks, state.path);
	const placed = insertAtPlacement(
		without,
		params.placement,
		[node],
		params.lookup
	);
	return placed || blocks;
}

/**
 * Rebuild `parentId` innerBlocks so stamped children follow `orderedIds`.
 * Unstamped (or unknown-stamp) siblings stay after the managed set.
 */
export function orderInnerSections(
	blocks: BlockNode[],
	parentId: string,
	orderedIds: string[],
	lookup?: StampLookupOptions
): BlockNode[] {
	if (!orderedIds.length) {
		return blocks;
	}
	const parent = resolveSectionState(blocks, parentId, [], lookup);
	if (!parent.path) {
		return blocks;
	}
	const node = getAtPath(blocks, parent.path);
	if (!node) {
		return blocks;
	}

	const idSet: Record<string, true> = {};
	for (let i = 0; i < orderedIds.length; i++) {
		idSet[orderedIds[i]] = true;
	}

	const byId: Record<string, BlockNode> = {};
	const rest: BlockNode[] = [];
	const children = node.innerBlocks || [];
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const id = getStamp(child)?.id;
		if (id && idSet[id] && !byId[id]) {
			byId[id] = child;
		} else {
			rest.push(child);
		}
	}

	const ordered: BlockNode[] = [];
	for (let i = 0; i < orderedIds.length; i++) {
		const child = byId[orderedIds[i]];
		if (child) {
			ordered.push(child);
		}
	}

	return replaceAtPath(blocks, parent.path, {
		...node,
		innerBlocks: [...ordered, ...rest],
	});
}

/**
 * Move a stamped section into another stamped parent at `index`.
 * Unstamped siblings in the destination stay in place; the moved node
 * is inserted among all children (not only managed stamps).
 */
export function moveInnerSection(
	blocks: BlockNode[],
	sectionId: string,
	toParentId: string,
	index: number,
	lookup?: StampLookupOptions
): BlockNode[] {
	const child = resolveSectionState(blocks, sectionId, [], lookup);
	if (!child.path) {
		return blocks;
	}
	const node = getAtPath(blocks, child.path);
	if (!node) {
		return blocks;
	}
	const dest = resolveSectionState(blocks, toParentId, [], lookup);
	if (!dest.path) {
		return blocks;
	}

	const fromParentPath = child.path.slice(0, -1);
	let sameParent = fromParentPath.length === dest.path.length;
	if (sameParent) {
		for (let i = 0; i < dest.path.length; i++) {
			if (fromParentPath[i] !== dest.path[i]) {
				sameParent = false;
				break;
			}
		}
	}

	if (sameParent) {
		const parent = getAtPath(blocks, dest.path);
		if (!parent) {
			return blocks;
		}
		const siblings = [...(parent.innerBlocks || [])];
		const fromIndex = child.path[child.path.length - 1];
		if (fromIndex < 0 || fromIndex >= siblings.length) {
			return blocks;
		}
		const [moved] = siblings.splice(fromIndex, 1);
		const clamped = Math.max(0, Math.min(index, siblings.length));
		siblings.splice(clamped, 0, moved);
		return replaceAtPath(blocks, dest.path, {
			...parent,
			innerBlocks: siblings,
		});
	}

	const tree = removeAtPath(blocks, child.path);
	const destAfter = resolveSectionState(tree, toParentId, [], lookup);
	if (!destAfter.path) {
		return blocks;
	}
	const destNode = getAtPath(tree, destAfter.path);
	if (!destNode) {
		return blocks;
	}
	const siblings = [...(destNode.innerBlocks || [])];
	const clamped = Math.max(0, Math.min(index, siblings.length));
	siblings.splice(clamped, 0, node);
	return replaceAtPath(tree, destAfter.path, {
		...destNode,
		innerBlocks: siblings,
	});
}
