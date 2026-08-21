/**
 * Shared lookup / inner-order helpers used by several operation handlers.
 */

import { defaultOpsContext } from '../blocks-adapter';
import { orderInnerSections } from '../section-ops';
import { resolveElementOrder } from '../element-order';
import { lookupFromControl } from '../stamp-lookup';
import type { BlockNode, ControlDef } from '../types';

export function opsContextFor(
	control: ControlDef,
	selectedClientId?: string | null
) {
	return {
		...defaultOpsContext,
		lookup: lookupFromControl(control, selectedClientId),
	};
}

export function resolveInnerOrderIds(
	control: ControlDef,
	sourceBlocks: BlockNode[]
): string[] | null {
	const rule = control.innerOrder;
	if (!rule?.ids?.length) {
		return null;
	}
	return resolveElementOrder(sourceBlocks, rule);
}

/** Reorder present children to the stored/derived list after a toggle. */
export function applyInnerOrder(
	tree: BlockNode[],
	control: ControlDef,
	sourceBlocks: BlockNode[],
	selectedClientId?: string | null
): BlockNode[] {
	const ids = resolveInnerOrderIds(control, sourceBlocks);
	if (!ids || !control.innerOrder) {
		return tree;
	}
	return orderInnerSections(
		tree,
		control.innerOrder.parentId,
		ids,
		lookupFromControl(control, selectedClientId)
	);
}
