/**
 * Pure operation dispatch: turn a control change into either a new block tree
 * or a `root/site` entity edit. No React, no WP data — the hook wires results
 * to the entity store.
 */

import type { OperationKind } from '../types';
import type {
	ApplyOperationArgs,
	OperationHandler,
	OperationResult,
} from './types';
import { handleBroadcastSetting } from './handlers/broadcast';
import { handleSetSectionAttribute } from './handlers/attribute';
import { handleSetBlockStyle } from './handlers/block-style';
import {
	handleSetMetaItemPart,
	handleSetMetaItemsDesign,
	handleSetMetaSeparator,
} from './handlers/meta';
import { handlePlaceSection } from './handlers/place';
import { handleReorderInnerSections } from './handlers/reorder';
import { handleSetTemplateSetting } from './handlers/settings';
import { handleSwapSection, handleSwapTemplatePart } from './handlers/swap';
import { handleToggleSection } from './handlers/toggle';
import { handleTransplantLayout } from './handlers/transplant';
import { clearSwapCleanCurrent } from '../../../session';

const OPERATION_HANDLERS = {
	transplantLayout: handleTransplantLayout,
	swapSection: handleSwapSection,
	swapTemplatePart: handleSwapTemplatePart,
	toggleSection: handleToggleSection,
	setSectionAttribute: handleSetSectionAttribute,
	setTemplateSetting: handleSetTemplateSetting,
	placeSection: handlePlaceSection,
	setBlockStyle: handleSetBlockStyle,
	selectInCanvas: () => null,
	reorderInnerSections: handleReorderInnerSections,
	setMetaItemPart: handleSetMetaItemPart,
	setMetaSeparator: handleSetMetaSeparator,
	setMetaItemsDesign: handleSetMetaItemsDesign,
	broadcastSetting: handleBroadcastSetting,
} satisfies Record<OperationKind, OperationHandler>;

export type { OperationResult, ApplyOperationArgs } from './types';

/**
 * Apply a control change. Pure: returns the resulting block tree or the
 * site-entity edits (setTemplateSetting), never mutates inputs.
 *
 * @param args.needsConfirm Transplant runs best-effort when the current
 *                          structure was customized/unrecognized.
 */
export function applyOperation(args: ApplyOperationArgs): OperationResult {
	const operation = args.control.operation;
	if (
		args.session &&
		args.entityKey &&
		operation !== 'swapSection' &&
		operation !== 'swapTemplatePart'
	) {
		clearSwapCleanCurrent(args.session, args.entityKey);
	}
	const handler = OPERATION_HANDLERS[operation];
	return handler ? handler(args) : null;
}
