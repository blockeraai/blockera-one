/**
 * Post Meta part / separator / Items Design operations.
 */

import { lookupFromControl } from '../../stamp-lookup';
import {
	setMetaItemPart,
	setMetaItemsDesign,
	syncMetaSeparators,
	type MetaItemPart,
	type MetaItemsPreset,
	type MetaSeparatorOption,
} from '../meta';
import type { OperationHandler } from '../types';

export const handleSetMetaItemPart: OperationHandler = ({
	blocks,
	control,
	nextValue,
	selectedClientId,
}) => {
	if (!control.attributePath) {
		return null;
	}
	const part = control.attributePath as MetaItemPart;
	if (part !== 'icon' && part !== 'prefix' && part !== 'suffix') {
		return null;
	}
	return {
		kind: 'blocks',
		blocks: setMetaItemPart(blocks, {
			sectionId: control.target.id,
			part,
			value: nextValue,
			lookup: lookupFromControl(control, selectedClientId),
		}),
	};
};

export const handleSetMetaSeparator: OperationHandler = ({
	blocks,
	control,
	nextValue,
	selectedClientId,
}) => {
	const option = String(nextValue || 'none') as MetaSeparatorOption;
	return {
		kind: 'blocks',
		blocks: syncMetaSeparators(
			blocks,
			control.target.id,
			option,
			lookupFromControl(control, selectedClientId)
		),
	};
};

export const handleSetMetaItemsDesign: OperationHandler = ({
	blocks,
	control,
	nextValue,
	selectedClientId,
}) => {
	const design = String(nextValue || 'simple') as MetaItemsPreset;
	if (design !== 'simple' && design !== 'labels' && design !== 'icons') {
		return null;
	}
	return {
		kind: 'blocks',
		blocks: setMetaItemsDesign(
			blocks,
			control.target.id,
			design,
			undefined,
			lookupFromControl(control, selectedClientId)
		),
	};
};
