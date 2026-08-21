/**
 * reorderInnerSections — persist and apply inner child order (and buckets).
 */

import { moveInnerSection, orderInnerSections } from '../../section-ops';
import {
	normalizeElementOrder,
	persistElementOrder,
} from '../../element-order';
import { lookupFromControl } from '../../stamp-lookup';
import type {
	BlockNode,
	ControlValue,
	ReorderElementsPayload,
} from '../../types';
import { isMetaRowId, syncMetaSeparators } from '../meta';
import type { OperationHandler } from '../types';

function isBucketReorderPayload(
	value: ControlValue
): value is Extract<ReorderElementsPayload, { buckets: unknown }> {
	return (
		!!value &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		Array.isArray((value as { buckets?: unknown }).buckets)
	);
}

function syncMetaRowIfNeeded(tree: BlockNode[], parentId: string): BlockNode[] {
	return isMetaRowId(parentId) ? syncMetaSeparators(tree, parentId) : tree;
}

export const handleReorderInnerSections: OperationHandler = ({
	blocks,
	control,
	nextValue,
	selectedClientId,
}) => {
	const rule = control.innerOrder;
	if (!rule?.parentId) {
		return null;
	}
	if (isBucketReorderPayload(nextValue)) {
		let tree = blocks;
		const lookup = lookupFromControl(control, selectedClientId);
		if (nextValue.move) {
			tree = moveInnerSection(
				tree,
				nextValue.move.sectionId,
				nextValue.move.toParentId,
				nextValue.move.index,
				lookup
			);
		}
		for (let i = 0; i < nextValue.buckets.length; i++) {
			const bucket = nextValue.buckets[i];
			tree = persistElementOrder(
				tree,
				bucket.parentId,
				bucket.ids,
				lookup
			);
			tree = orderInnerSections(
				tree,
				bucket.parentId,
				bucket.ids,
				lookup
			);
		}
		return {
			kind: 'blocks',
			blocks: syncMetaRowIfNeeded(tree, rule.parentId),
		};
	}
	const ordered = normalizeElementOrder(nextValue, rule.ids);
	if (!ordered.length) {
		return null;
	}
	const lookup = lookupFromControl(control, selectedClientId);
	// Persist the full list (including off items) first, then reorder
	// only the children that are currently in the tree.
	let tree = persistElementOrder(blocks, rule.parentId, ordered, lookup);
	tree = orderInnerSections(tree, rule.parentId, ordered, lookup);
	return {
		kind: 'blocks',
		blocks: syncMetaRowIfNeeded(tree, rule.parentId),
	};
};
