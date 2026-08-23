/**
 * toggleSection — show/hide a stamped section and keep inner order.
 */

import { defaultOpsContext } from '../../blocks-adapter';
import { prepareHideChromeSection } from '../../chrome-rail';
import { orderInnerSections, toggleSection } from '../../section-ops';
import {
	findLiveParentStampId,
	resolveBucketInsertParent,
	resolveElementBuckets,
	type ElementBucket,
} from '../../element-order';
import { resolveCompoundToggleEnabled } from '../../resolve/resolve-state';
import { flattenPanelControls } from '../../resolve/resolve-options-panel';
import {
	findStampById,
	lookupFromControl,
	type StampLookupOptions,
} from '../../stamp-lookup';
import type { BlockNode, ControlDef, TemplateOptionsConfig } from '../../types';
import { applyInnerOrder } from '../handler-helpers';
import { applyMetaToggleSideEffects } from '../meta';
import { localInnerPatches, localToggleForSection } from '../local-replace';
import { parkLiveItem, type MetaParkOverlay } from '../meta/parts';
import {
	loadMetaParkOverlay,
	saveMetaParkOverlay,
} from '../meta/session-overlay';
import type { OperationHandler } from '../types';

function findBucketParentId(
	buckets: ElementBucket[],
	sectionId: string
): string | null {
	for (let i = 0; i < buckets.length; i++) {
		if (buckets[i].ids.indexOf(sectionId) !== -1) {
			return buckets[i].parentId;
		}
	}
	return null;
}

function cloneBuckets(buckets: ElementBucket[]): ElementBucket[] {
	return buckets.map((bucket) => ({
		parentId: bucket.parentId,
		ids: bucket.ids.slice(),
	}));
}

/**
 * Live parent, else the freeze/resolved bucket that already lists the
 * id (off items stay in Media while frozen), else last existing parent.
 */
function resolveToggleHomeParent(
	blocks: BlockNode[],
	sectionId: string,
	rule: NonNullable<ControlDef['innerOrder']>,
	buckets: ElementBucket[],
	lookup?: StampLookupOptions
): string {
	const live = findLiveParentStampId(blocks, sectionId, lookup);
	if (live) {
		return live;
	}
	const fromBuckets = findBucketParentId(buckets, sectionId);
	if (fromBuckets) {
		return fromBuckets;
	}
	if (rule.bucketParents?.length) {
		return resolveBucketInsertParent(
			blocks,
			sectionId,
			rule.bucketParents,
			rule.parentId,
			lookup
		);
	}
	return rule.parentId;
}

/**
 * Reorder live children in each bucket after a toggle (media vs body).
 */
function applyBucketedInnerOrder(
	tree: BlockNode[],
	rule: NonNullable<ControlDef['innerOrder']>,
	sectionId: string,
	homeParent: string,
	capturedBuckets?: ElementBucket[],
	lookup?: StampLookupOptions
): BlockNode[] {
	const buckets = cloneBuckets(
		capturedBuckets || resolveElementBuckets(tree, rule)
	);
	if (!findBucketParentId(buckets, sectionId)) {
		const dest =
			buckets.find((bucket) => bucket.parentId === homeParent) ||
			buckets[buckets.length - 1];
		if (dest) {
			dest.ids.push(sectionId);
		}
	}
	let next = tree;
	for (let i = 0; i < buckets.length; i++) {
		const bucket = buckets[i];
		next = orderInnerSections(
			next,
			bucket.parentId,
			bucket.ids,
			lookup || { parentId: bucket.parentId }
		);
	}
	return next;
}

function wouldLeaveZeroRequired(
	blocks: BlockNode[],
	control: ControlDef,
	config: TemplateOptionsConfig
): boolean {
	const ids = control.requireAtLeastOneOf;
	if (!ids?.length || ids.indexOf(control.id) === -1) {
		return false;
	}
	const all = flattenPanelControls(config.groups);
	let onCount = 0;
	for (let i = 0; i < ids.length; i++) {
		const sibling = all.find((item) => item.id === ids[i]);
		if (!sibling) {
			continue;
		}
		if (
			resolveCompoundToggleEnabled(
				blocks,
				sibling,
				lookupFromControl(sibling)
			)
		) {
			onCount++;
		}
	}
	return onCount <= 1;
}

export function applyToggleControl(
	blocks: BlockNode[],
	control: ControlDef,
	enabled: boolean,
	orderSource: BlockNode[],
	layoutId: string,
	selectedClientId?: string | null,
	orderBuckets?: ElementBucket[],
	overlay?: MetaParkOverlay
): BlockNode[] {
	const lookup = lookupFromControl(control, selectedClientId);
	const ctx = { ...defaultOpsContext, lookup };
	if (!enabled && overlay) {
		const match = findStampById(blocks, control.target.id, lookup);
		if (match) {
			parkLiveItem(overlay, control.target.id, match.block);
		}
	}
	const rule = control.innerOrder;
	let homeParent: string | null = null;
	let capturedBuckets: ElementBucket[] | null = null;
	if (rule && orderBuckets?.length) {
		capturedBuckets = orderBuckets;
	} else if (rule?.bucketParents?.length) {
		// Capture buckets before toggle-off removes the stamp from the tree.
		capturedBuckets = resolveElementBuckets(blocks, rule);
	}
	if (capturedBuckets && rule) {
		homeParent = resolveToggleHomeParent(
			blocks,
			control.target.id,
			rule,
			capturedBuckets,
			lookup
		);
	}

	let insert = control.insert;
	if (enabled && homeParent && insert) {
		insert = { ...insert, relativeTo: homeParent };
	}

	let tree = blocks;
	if (!enabled) {
		tree = prepareHideChromeSection(tree, control.target.id, layoutId);
	}
	tree = toggleSection(
		tree,
		{
			sectionId: control.target.id,
			enabled,
			defaultVariant: control.variants?.[0],
			insert,
		},
		ctx
	);
	const extras = control.alsoToggle;
	if (extras?.length) {
		for (let i = 0; i < extras.length; i++) {
			const companion = extras[i];
			tree = toggleSection(
				tree,
				{
					sectionId: companion.id,
					enabled,
					defaultVariant: companion.variants?.[0],
					insert: companion.insert,
				},
				ctx
			);
		}
	}

	if (capturedBuckets && rule) {
		tree = applyBucketedInnerOrder(
			tree,
			rule,
			control.target.id,
			homeParent || rule.parentId,
			capturedBuckets,
			lookup
		);
		return applyMetaToggleSideEffects(tree, control, enabled, overlay);
	}

	tree = applyInnerOrder(tree, control, orderSource, selectedClientId);
	return applyMetaToggleSideEffects(tree, control, enabled, overlay);
}

export const handleToggleSection: OperationHandler = ({
	blocks,
	control,
	nextValue,
	config,
	selectedClientId,
	orderBuckets,
	session,
	entityKey,
}) => {
	const enabled = control.invertPresence ? !nextValue : !!nextValue;
	if (!enabled && wouldLeaveZeroRequired(blocks, control, config)) {
		return { kind: 'blocks', blocks };
	}
	const park = loadMetaParkOverlay(session, entityKey, control);
	const nextBlocks = applyToggleControl(
		blocks,
		control,
		enabled,
		blocks,
		config.layoutId,
		selectedClientId,
		orderBuckets,
		park.overlay
	);
	saveMetaParkOverlay(session, park.key, park.overlay);
	const localReplace =
		localToggleForSection(
			blocks,
			nextBlocks,
			control.target.id,
			lookupFromControl(control, selectedClientId)
		) || localInnerPatches(blocks, nextBlocks);
	return localReplace
		? { kind: 'blocks', blocks: nextBlocks, localReplace }
		: { kind: 'blocks', blocks: nextBlocks };
};
