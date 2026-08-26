/**
 * Swap parks a variant tree for restore. `sessionEdited` is only true when
 * the outgoing tree was unsaved vs the last persist — saved catalog drift
 * still parks so restore works, but does not show the layout-picker badge.
 */

import type { BlockNode } from '../templates-builder/shared/types';

export type SwapSnapshot = {
	tree: BlockNode[];
	sessionEdited: boolean;
};

export function wrapSwapSnapshot(
	tree: BlockNode[],
	sessionEdited: boolean
): SwapSnapshot {
	return { tree, sessionEdited };
}

export function unwrapSwapSnapshot(stored: unknown): BlockNode[] | undefined {
	if (Array.isArray(stored) && stored.length) {
		return stored as BlockNode[];
	}
	if (
		stored &&
		typeof stored === 'object' &&
		Array.isArray((stored as SwapSnapshot).tree) &&
		(stored as SwapSnapshot).tree.length
	) {
		return (stored as SwapSnapshot).tree;
	}
	return undefined;
}

export function swapSnapshotIsSessionEdited(stored: unknown): boolean {
	if (stored === undefined) {
		return false;
	}
	if (Array.isArray(stored)) {
		return true;
	}
	if (
		stored &&
		typeof stored === 'object' &&
		'sessionEdited' in (stored as SwapSnapshot)
	) {
		return !!(stored as SwapSnapshot).sessionEdited;
	}
	return false;
}
