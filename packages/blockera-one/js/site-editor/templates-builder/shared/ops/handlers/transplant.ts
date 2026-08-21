/**
 * transplantLayout — re-attach the page chrome around a new layout variant.
 */

import { flattenPanelControls } from '../../resolve/resolve-options-panel';
import { resolveSectionState } from '../../resolve/resolve-state';
import { transplantLayout } from '../../layout-transplant';
import type {
	BlockNode,
	InsertRule,
	TemplateOptionsConfig,
	VariantDef,
} from '../../types';
import {
	DEFAULT_SIDEBAR_WIDTH,
	applySidebarWidth,
} from '../broadcast/sidebar-width';
import { opsContextFor } from '../handler-helpers';
import type { OperationHandler } from '../types';

/**
 * Map each swappable section to its active design's placement rule so a
 * layout transplant can re-attach every section where its design expects
 * it (e.g. Simple title inside content vs Banner at the layout root).
 */
function getActiveSectionPlacements(
	blocks: BlockNode[],
	config: TemplateOptionsConfig
): Record<string, InsertRule> {
	const placements: Record<string, InsertRule> = {};
	for (const control of flattenPanelControls(config.groups)) {
		if (
			control.operation !== 'swapSection' ||
			control.target.kind !== 'section' ||
			!control.variants?.length
		) {
			continue;
		}
		const state = resolveSectionState(
			blocks,
			control.target.id,
			control.variants
		);
		if (!state.path) {
			continue;
		}
		// Only trust a confidently resolved variant; customized sections
		// fall back to the transplant's default re-attach position.
		const activeVariant = control.variants.find(
			(v) => v.id === state.value
		);
		if (activeVariant?.placement) {
			placements[control.target.id] = activeVariant.placement;
		}
	}
	return placements;
}

export const handleTransplantLayout: OperationHandler = ({
	blocks,
	control,
	nextValue,
	config,
	settings,
	needsConfirm,
	selectedClientId,
}) => {
	let variantId = String(nextValue);
	if (control.type === 'toggle') {
		variantId = nextValue
			? String(control.onValue || 'sidebar-right')
			: String(control.offValue || 'no-sidebar');
	}
	const variant = control.variants?.find((v) => v.id === variantId) as
		VariantDef | undefined;
	if (!variant) {
		return null;
	}
	let next = transplantLayout(
		blocks,
		{
			layoutId: config.layoutId,
			targetVariant: variant,
			knownVariants: control.variants,
			bestEffort: needsConfirm,
			sectionPlacements: getActiveSectionPlacements(blocks, config),
			siblingSectionIds: config.layoutSiblingSections,
		},
		opsContextFor(control, selectedClientId)
	);
	const applied = applySidebarWidth(
		next,
		settings.sidebar_width ?? DEFAULT_SIDEBAR_WIDTH
	);
	if (applied) {
		next = applied;
	}
	return {
		kind: 'blocks',
		blocks: next,
	};
};
