/**
 * swapSection / swapTemplatePart — replace a stamped section or chrome part.
 */

import { swapTemplatePart } from '../../chrome-rail';
import { ensurePaginationNavLabels, swapSection } from '../../section-ops';
import { STAMP_IDS } from '../../stamp-ids';
import type {
	BlockNode,
	ControlDef,
	ControlValue,
	TemplateOptionsConfig,
} from '../../types';
import { opsContextFor } from '../handler-helpers';
import { applyListingMetaItemsPreset } from '../meta';
import type { OperationHandler, OperationResult } from '../types';
import { reapplyAfterSwap } from './swap-reapply';

function applySwapSection(
	blocks: BlockNode[],
	control: ControlDef,
	nextValue: ControlValue,
	config: TemplateOptionsConfig,
	selectedClientId?: string | null
): OperationResult {
	const variant = control.variants?.find((v) => v.id === String(nextValue));
	if (!variant || variant.disabled) {
		return null;
	}

	let next = swapSection(
		blocks,
		{
			sectionId: control.target.id,
			targetVariant: variant,
			knownVariants: control.variants,
			preserveQuery: !!control.swapHints?.preserveQuery,
			preserveBlockeraExtensions:
				!!control.swapHints?.preserveBlockeraExtensions,
		},
		opsContextFor(control, selectedClientId)
	);
	next = reapplyAfterSwap(next, blocks, control, config, selectedClientId);
	if (control.target.id === STAMP_IDS.postsListing) {
		next = applyListingMetaItemsPreset(next);
	}
	return {
		kind: 'blocks',
		blocks: ensurePaginationNavLabels(next),
	};
}

export const handleSwapSection: OperationHandler = ({
	blocks,
	control,
	nextValue,
	config,
	selectedClientId,
}) => {
	return applySwapSection(
		blocks,
		control,
		nextValue,
		config,
		selectedClientId
	);
};

export const handleSwapTemplatePart: OperationHandler = ({
	blocks,
	control,
	nextValue,
	config,
	selectedClientId,
}) => {
	const variant = control.variants?.find((v) => v.id === String(nextValue));
	if (!variant) {
		return null;
	}
	return {
		kind: 'blocks',
		blocks: swapTemplatePart(
			blocks,
			{
				sectionId: control.target.id,
				targetVariant: variant,
				layoutId: config.layoutId,
				knownVariants: control.variants,
			},
			opsContextFor(control, selectedClientId)
		),
	};
};
