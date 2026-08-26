/**
 * reorderInnerSections — apply inner child order (and buckets).
 */

import { moveInnerSection, orderInnerSections } from '../../section-ops';
import { normalizeElementOrder } from '../../element-order';
import { lookupFromControl } from '../../stamp-lookup';
import type {
	BlockNode,
	ControlValue,
	ReorderElementsPayload,
} from '../../types';
import { isMetaRowId, syncMetaSeparators } from '../meta';
import { localInnerPatches, localReorderForParent } from '../local-replace';
import type { OperationHandler, OperationResult } from '../types';

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

function finishReorder(
	prev: BlockNode[],
	next: BlockNode[],
	parentId: string,
	lookup: ReturnType<typeof lookupFromControl>
): OperationResult {
	if (next === prev) {
		return null;
	}
	const localReplace =
		localReorderForParent(prev, next, parentId, lookup) ||
		localInnerPatches(prev, next);
	return localReplace
		? { kind: 'blocks', blocks: next, localReplace }
		: { kind: 'blocks', blocks: next };
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
	const lookup = lookupFromControl(control, selectedClientId);
	if (isBucketReorderPayload(nextValue)) {
		let tree = blocks;
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
			tree = orderInnerSections(
				tree,
				bucket.parentId,
				bucket.ids,
				lookup
			);
		}
		return finishReorder(
			blocks,
			syncMetaRowIfNeeded(tree, rule.parentId),
			rule.parentId,
			lookup
		);
	}
	const ordered = normalizeElementOrder(nextValue, rule.ids);
	if (!ordered.length) {
		return null;
	}
	const tree = orderInnerSections(blocks, rule.parentId, ordered, lookup);
	return finishReorder(
		blocks,
		syncMetaRowIfNeeded(tree, rule.parentId),
		rule.parentId,
		lookup
	);
};
