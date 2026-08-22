/**
 * Which layout-picker tiles show an edits indicator.
 *
 * Kept out of render-control so unit tests do not load the nested-panels
 * barrel / @blockera/controls (duplicate @wordpress/block-editor stores).
 */

import {
	readSwapCleanCurrent,
	sessionSwapKey,
	sessionSwapPartKey,
	swapCleanCurrentMatches,
	swapSnapshotIsSessionEdited,
	treesMatchIgnoringVolatileIds,
	type EditorSessionApi,
} from '../../../session';
import { defaultOpsContext } from '../blocks-adapter';
import { cloneTree, getAtPath } from '../tree';
import type { BlockNode, ControlDef, ResolvedOptionState } from '../types';

const EMPTY_EDITED_VARIANT_IDS: string[] = [];

function currentLayoutIsEdited(
	control: ControlDef,
	currentId: string | null,
	state: ResolvedOptionState,
	blocks?: BlockNode[],
	entityDirty?: boolean,
	session?: EditorSessionApi,
	entityKey?: string
): boolean {
	if (!currentId || !blocks?.length || !state.path) {
		return false;
	}
	const variant = control.variants?.find((item) => item.id === currentId);
	if (!variant?.html) {
		return false;
	}
	const node = getAtPath(blocks, state.path);
	if (!node) {
		return false;
	}
	const catalog = cloneTree(defaultOpsContext.parse(variant.html));
	if (!catalog.length) {
		return false;
	}
	const ignoreStampIds = control.swapHints?.reapplyControls;
	const matchesCatalog = treesMatchIgnoringVolatileIds([node], catalog, {
		ignoreStampIds,
	});
	return (
		!!entityDirty &&
		!matchesCatalog &&
		!swapCleanCurrentMatches(
			readSwapCleanCurrent(session, entityKey),
			control.target.id,
			currentId
		)
	);
}

export function editedVariantIds(
	control: ControlDef,
	currentId: string | null,
	state: ResolvedOptionState,
	session?: EditorSessionApi,
	entityKey?: string,
	blocks?: BlockNode[],
	entityDirty?: boolean
): string[] {
	if (!control.variants?.length) {
		return EMPTY_EDITED_VARIANT_IDS;
	}
	const within = control.innerOrder?.within || '';
	const ids: string[] = [];
	for (let i = 0; i < control.variants.length; i++) {
		const variantId = control.variants[i].id;
		if (currentId && variantId === currentId) {
			if (
				currentLayoutIsEdited(
					control,
					currentId,
					state,
					blocks,
					entityDirty,
					session,
					entityKey
				)
			) {
				ids.push(variantId);
			}
			continue;
		}
		if (!session || !entityKey) {
			continue;
		}
		const key =
			control.operation === 'swapTemplatePart'
				? sessionSwapPartKey(entityKey, control.target.id, variantId)
				: sessionSwapKey(
						entityKey,
						within,
						control.target.id,
						variantId
					);
		if (swapSnapshotIsSessionEdited(session.get(key))) {
			ids.push(variantId);
		}
	}
	return ids.length ? ids : EMPTY_EDITED_VARIANT_IDS;
}
