/**
 * swapSection / swapTemplatePart — replace a stamped section or chrome part.
 */

import {
	remapVolatileIds,
	sessionSwapKey,
	sessionSwapPartKey,
	clearSwapCleanCurrent,
	readSwapCleanCurrent,
	setSwapCleanCurrent,
	swapCleanCurrentMatches,
	treesMatchIgnoringVolatileIds,
	unwrapSwapSnapshot,
	wrapSwapSnapshot,
	swapSnapshotIsSessionEdited,
	type EditorSessionApi,
} from '../../../../session';
import { defaultOpsContext } from '../../blocks-adapter';
import {
	swapTemplatePart,
	unwrapChromeRail,
	wrapVerticalRail,
} from '../../chrome-rail';
import { getStamp } from '../../metadata';
import {
	CHROME_RAIL_STAMP_ID,
	findChromeRail,
	resolveSectionState,
} from '../../resolve/resolve-state';
import { ensurePaginationNavLabels, swapSection } from '../../section-ops';
import { STAMP_IDS } from '../../stamp-ids';
import { lookupFromControl } from '../../stamp-lookup';
import { cloneTree, getAtPath } from '../../tree';
import { insertAtPlacement, replaceSectionAtPath } from '../../op-context';
import type {
	BlockNode,
	ControlDef,
	ControlValue,
	InsertRule,
	TemplateOptionsConfig,
	VariantDef,
} from '../../types';
import { opsContextFor } from '../handler-helpers';
import { localReplaceForSection } from '../local-replace';
import { applyListingMetaItemsPreset } from '../meta';
import { controlWithin } from '../meta/session-overlay';
import type { OperationHandler, OperationResult } from '../types';
import { reapplyAfterSwap } from './swap-reapply';

function blocksResult(
	prev: BlockNode[],
	next: BlockNode[],
	sectionId: string,
	selectedClientId?: string | null,
	control?: ControlDef
): OperationResult {
	const lookup = control
		? lookupFromControl(control, selectedClientId)
		: undefined;
	const localReplace = localReplaceForSection(prev, next, sectionId, lookup);
	return localReplace
		? { kind: 'blocks', blocks: next, localReplace }
		: { kind: 'blocks', blocks: next };
}

function catalogTree(variant: VariantDef | undefined): BlockNode[] {
	if (!variant?.html) {
		return [];
	}
	return cloneTree(defaultOpsContext.parse(variant.html));
}

function snapshotOutgoing(
	session: EditorSessionApi | undefined,
	key: string | null,
	outgoing: BlockNode[] | null,
	currentVariant: VariantDef | undefined,
	ignoreStampIds?: string[],
	entityDirty?: boolean,
	outgoingIsCleanRestore?: boolean
): void {
	if (!session || !key || !outgoing?.length) {
		return;
	}
	const catalog = catalogTree(currentVariant);
	if (!catalog.length) {
		return;
	}
	if (treesMatchIgnoringVolatileIds(outgoing, catalog, { ignoreStampIds })) {
		session.delete(key);
		return;
	}
	const sessionEdited = outgoingIsCleanRestore
		? false
		: entityDirty !== false;
	session.set(key, wrapSwapSnapshot(outgoing, sessionEdited));
}

function outgoingSectionTree(
	blocks: BlockNode[],
	sectionId: string,
	knownVariants: VariantDef[],
	control: ControlDef,
	selectedClientId?: string | null
): { tree: BlockNode[] | null; variantId: string | null } {
	const lookup = lookupFromControl(control, selectedClientId);
	const state = resolveSectionState(blocks, sectionId, knownVariants, lookup);
	if (!state.path) {
		return { tree: null, variantId: null };
	}
	const node = getAtPath(blocks, state.path);
	if (!node) {
		return { tree: null, variantId: null };
	}
	const variantId =
		typeof state.value === 'string' && state.value ? state.value : null;
	return { tree: cloneTree([node]), variantId };
}

function outgoingPartTree(
	blocks: BlockNode[],
	sectionId: string
): {
	tree: BlockNode[] | null;
	variantId: string | null;
} {
	if (sectionId === 'header') {
		const rail = findChromeRail(blocks);
		if (rail) {
			return {
				tree: cloneTree([rail.block]),
				variantId: getStamp(rail.block)?.variant || 'vertical-rail',
			};
		}
	}
	const state = resolveSectionState(blocks, sectionId);
	if (!state.path) {
		return { tree: null, variantId: null };
	}
	const node = getAtPath(blocks, state.path);
	if (!node) {
		return { tree: null, variantId: null };
	}
	const variantId =
		typeof state.value === 'string' && state.value ? state.value : null;
	return { tree: cloneTree([node]), variantId };
}

function restoreSectionSnapshot(
	blocks: BlockNode[],
	sectionId: string,
	snapshot: BlockNode[],
	control: ControlDef,
	selectedClientId: string | null | undefined,
	placement: InsertRule | undefined
): BlockNode[] {
	const remapped = remapVolatileIds(snapshot);
	if (!remapped[0]) {
		return blocks;
	}
	const lookup = lookupFromControl(control, selectedClientId);
	const state = resolveSectionState(
		blocks,
		sectionId,
		control.variants || [],
		lookup
	);
	if (!state.path) {
		if (placement) {
			const placed = insertAtPlacement(
				blocks,
				placement,
				remapped,
				lookup
			);
			if (placed) {
				return placed;
			}
		}
		return blocks;
	}
	return replaceSectionAtPath(
		blocks,
		state.path,
		placement,
		remapped,
		lookup
	);
}

function restorePartSnapshot(
	blocks: BlockNode[],
	sectionId: string,
	snapshot: BlockNode[],
	layoutId: string,
	placement?: InsertRule
): BlockNode[] {
	const remapped = remapVolatileIds(snapshot);
	const root = remapped[0];
	if (!root) {
		return blocks;
	}
	if (getStamp(root)?.id === CHROME_RAIL_STAMP_ID) {
		return wrapVerticalRail(blocks, { layoutId, rail: root });
	}
	let working = blocks;
	if (sectionId === 'header' && findChromeRail(working)) {
		working = unwrapChromeRail(working, layoutId).blocks;
	}
	const placed = resolveSectionState(working, sectionId);
	if (placed.path) {
		return replaceSectionAtPath(working, placed.path, placement, [root]);
	}
	if (placement) {
		const inserted = insertAtPlacement(working, placement, [root]);
		if (inserted) {
			return inserted;
		}
	}
	return working;
}

function applySwapSection(
	blocks: BlockNode[],
	control: ControlDef,
	nextValue: ControlValue,
	config: TemplateOptionsConfig,
	selectedClientId?: string | null,
	session?: EditorSessionApi,
	entityKey?: string,
	entityDirty?: boolean
): OperationResult {
	const variant = control.variants?.find((v) => v.id === String(nextValue));
	if (!variant || variant.disabled) {
		return null;
	}

	const knownVariants = control.variants || [];
	const sectionId = control.target.id;
	const outgoing = outgoingSectionTree(
		blocks,
		sectionId,
		knownVariants,
		control,
		selectedClientId
	);
	// Layout picker can fire the current tile; do not park/restore in place.
	if (outgoing.variantId && variant.id === outgoing.variantId) {
		return null;
	}
	const within = controlWithin(control);
	const currentDef = knownVariants.find((v) => v.id === outgoing.variantId);
	const outKey =
		session && entityKey && outgoing.variantId
			? sessionSwapKey(entityKey, within, sectionId, outgoing.variantId)
			: null;
	snapshotOutgoing(
		session,
		outKey,
		outgoing.tree,
		currentDef,
		control.swapHints?.reapplyControls,
		entityDirty,
		swapCleanCurrentMatches(
			readSwapCleanCurrent(session, entityKey),
			sectionId,
			outgoing.variantId
		)
	);

	const inKey =
		session && entityKey
			? sessionSwapKey(entityKey, within, sectionId, variant.id)
			: null;
	const rawStored = inKey ? session?.get(inKey) : undefined;
	const stored = unwrapSwapSnapshot(rawStored);
	if (stored?.length) {
		const restored = restoreSectionSnapshot(
			blocks,
			sectionId,
			stored,
			control,
			selectedClientId,
			variant.placement
		);
		session?.delete(inKey as string);
		setSwapCleanCurrent(
			session,
			entityKey,
			sectionId,
			variant.id,
			swapSnapshotIsSessionEdited(rawStored)
		);
		return blocksResult(
			blocks,
			ensurePaginationNavLabels(restored),
			sectionId,
			selectedClientId,
			control
		);
	}

	clearSwapCleanCurrent(session, entityKey);

	let next = swapSection(
		blocks,
		{
			sectionId,
			targetVariant: variant,
			knownVariants,
			preserveQuery: !!control.swapHints?.preserveQuery,
			preserveBlockeraExtensions:
				!!control.swapHints?.preserveBlockeraExtensions,
		},
		opsContextFor(control, selectedClientId)
	);
	next = reapplyAfterSwap(next, blocks, control, config, selectedClientId);
	if (sectionId === STAMP_IDS.postsListing) {
		next = applyListingMetaItemsPreset(next);
	}
	return blocksResult(
		blocks,
		ensurePaginationNavLabels(next),
		sectionId,
		selectedClientId,
		control
	);
}

export const handleSwapSection: OperationHandler = ({
	blocks,
	control,
	nextValue,
	config,
	selectedClientId,
	session,
	entityKey,
	entityDirty,
}) => {
	return applySwapSection(
		blocks,
		control,
		nextValue,
		config,
		selectedClientId,
		session,
		entityKey,
		entityDirty
	);
};

export const handleSwapTemplatePart: OperationHandler = ({
	blocks,
	control,
	nextValue,
	config,
	selectedClientId,
	session,
	entityKey,
	entityDirty,
}) => {
	const variant = control.variants?.find((v) => v.id === String(nextValue));
	if (!variant) {
		return null;
	}
	const area = control.target.id;
	const outgoing = outgoingPartTree(blocks, area);
	const currentDef = (control.variants || []).find(
		(v) => v.id === outgoing.variantId
	);
	const outKey =
		session && entityKey && outgoing.variantId
			? sessionSwapPartKey(entityKey, area, outgoing.variantId)
			: null;
	snapshotOutgoing(
		session,
		outKey,
		outgoing.tree,
		currentDef,
		undefined,
		entityDirty,
		swapCleanCurrentMatches(
			readSwapCleanCurrent(session, entityKey),
			area,
			outgoing.variantId
		)
	);

	const inKey =
		session && entityKey
			? sessionSwapPartKey(entityKey, area, variant.id)
			: null;
	const rawStored = inKey ? session?.get(inKey) : undefined;
	const stored = unwrapSwapSnapshot(rawStored);
	if (stored?.length) {
		const restored = restorePartSnapshot(
			blocks,
			area,
			stored,
			config.layoutId,
			variant.placement
		);
		session?.delete(inKey as string);
		setSwapCleanCurrent(
			session,
			entityKey,
			area,
			variant.id,
			swapSnapshotIsSessionEdited(rawStored)
		);
		return blocksResult(blocks, restored, area, selectedClientId, control);
	}

	clearSwapCleanCurrent(session, entityKey);

	return blocksResult(
		blocks,
		swapTemplatePart(
			blocks,
			{
				sectionId: area,
				targetVariant: variant,
				layoutId: config.layoutId,
				knownVariants: control.variants,
			},
			opsContextFor(control, selectedClientId)
		),
		area,
		selectedClientId,
		control
	);
};
