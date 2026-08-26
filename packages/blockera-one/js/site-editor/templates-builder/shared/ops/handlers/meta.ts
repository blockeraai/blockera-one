/**
 * Post Meta part / separator / Items Design operations.
 */

import { lookupFromControl } from '../../stamp-lookup';
import type { BlockNode } from '../../types';
import {
	setMetaItemPart,
	setMetaItemsDesign,
	syncMetaSeparators,
	type MetaItemPart,
	type MetaItemsPreset,
	type MetaSeparatorOption,
} from '../meta';
import {
	loadMetaParkOverlay,
	saveMetaParkOverlay,
} from '../meta/session-overlay';
import { localInnerPatches } from '../local-replace';
import type { OperationHandler, OperationResult } from '../types';

function finishMeta(prev: BlockNode[], next: BlockNode[]): OperationResult {
	const localReplace = localInnerPatches(prev, next);
	return localReplace
		? { kind: 'blocks', blocks: next, localReplace }
		: { kind: 'blocks', blocks: next };
}

export const handleSetMetaItemPart: OperationHandler = ({
	blocks,
	control,
	nextValue,
	selectedClientId,
	session,
	entityKey,
}) => {
	if (!control.attributePath) {
		return null;
	}
	const part = control.attributePath as MetaItemPart;
	if (part !== 'icon' && part !== 'prefix' && part !== 'suffix') {
		return null;
	}
	const park = loadMetaParkOverlay(session, entityKey, control);
	const next = setMetaItemPart(blocks, {
		sectionId: control.target.id,
		part,
		value: nextValue,
		lookup: lookupFromControl(control, selectedClientId),
		overlay: park.overlay,
	});
	saveMetaParkOverlay(session, park.key, park.overlay);
	return finishMeta(blocks, next);
};

export const handleSetMetaSeparator: OperationHandler = ({
	blocks,
	control,
	nextValue,
	selectedClientId,
}) => {
	const option = String(nextValue || 'none') as MetaSeparatorOption;
	const next = syncMetaSeparators(
		blocks,
		control.target.id,
		option,
		lookupFromControl(control, selectedClientId)
	);
	return finishMeta(blocks, next);
};

export const handleSetMetaItemsDesign: OperationHandler = ({
	blocks,
	control,
	nextValue,
	selectedClientId,
	session,
	entityKey,
}) => {
	const design = String(nextValue || 'simple') as MetaItemsPreset;
	if (design !== 'simple' && design !== 'labels' && design !== 'icons') {
		return null;
	}
	const park = loadMetaParkOverlay(session, entityKey, control);
	const next = setMetaItemsDesign(
		blocks,
		control.target.id,
		design,
		undefined,
		lookupFromControl(control, selectedClientId),
		park.overlay
	);
	saveMetaParkOverlay(session, park.key, park.overlay);
	return finishMeta(blocks, next);
};
