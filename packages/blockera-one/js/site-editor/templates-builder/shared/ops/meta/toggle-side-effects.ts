/**
 * Post Meta row side-effects after a child item is toggled.
 */

import { lookupFromControl } from '../../stamp-lookup';
import type { BlockNode, ControlDef } from '../../types';
import { adoptMetaItemDesign } from './design';
import { getMetaRowIdForSection, isMetaRowId, isSpaceFillerId } from './ids';
import { ensureSpaceFiller } from './parts';
import { syncMetaSeparators } from './separators';

export function applyMetaToggleSideEffects(
	tree: BlockNode[],
	control: ControlDef,
	enabled: boolean
): BlockNode[] {
	// The meta row toggle restores a full pattern (seps already correct).
	// Child toggles must adopt design and rebuild seps after inner-order
	// dumps unmanaged separator blocks to the end.
	if (isMetaRowId(control.target.id)) {
		return tree;
	}
	const rowId = getMetaRowIdForSection(control.target.id);
	if (!rowId) {
		return tree;
	}
	const lookup = lookupFromControl(control);
	let next = tree;
	if (enabled) {
		next = adoptMetaItemDesign(next, control.target.id, lookup);
		if (isSpaceFillerId(control.target.id)) {
			next = ensureSpaceFiller(next, control.target.id, lookup);
		}
	}
	return syncMetaSeparators(next, rowId, undefined, lookup);
}
