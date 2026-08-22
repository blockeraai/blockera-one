/**
 * toggleSection — show/hide a stamped section and keep inner order.
 */

import { defaultOpsContext } from '../../blocks-adapter';
import { prepareHideChromeSection } from '../../chrome-rail';
import { orderInnerSections, toggleSection } from '../../section-ops';
import {
	findLiveParentStampId,
	persistElementOrder,
	resolveBucketInsertParent,
	resolveElementBuckets,
	type ElementBucket,
} from '../../element-order';
import { resolveCompoundToggleEnabled } from '../../resolve/resolve-state';
import { lookupFromControl, type StampLookupOptions } from '../../stamp-lookup';
import { flattenPanelControls } from '../../resolve/resolve-options-panel';
import type { BlockNode, ControlDef, TemplateOptionsConfig } from '../../types';
import { applyMetaToggleSideEffects } from '../meta';
import { applyInnerOrder, resolveInnerOrderIds } from '../handler-helpers';
import type { OperationHandler } from '../types';

/**
 * Keep a toggled loop-item in its last parent (media vs body) even
 * after it is removed from the tree, then persist each bucket separately.
 */
function applyBucketedInnerOrder(
	tree: BlockNode[],
	rule: NonNullable<ControlDef['innerOrder']>,
	sectionId: string,
	homeParent: string,
	persistOrder: boolean,
	capturedBuckets?: ElementBucket[],
	lookup?: StampLookupOptions
): BlockNode[] {
	const resolved = capturedBuckets || resolveElementBuckets(tree, rule);
	const buckets = resolved.map((bucket) => ({
		parentId: bucket.parentId,
		ids: bucket.ids.slice(),
	}));
	const dest =
		buckets.find((bucket) => bucket.parentId === homeParent) ||
		buckets[buckets.length - 1];
	if (dest && dest.ids.indexOf(sectionId) === -1) {
		dest.ids.push(sectionId);
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
		if (persistOrder) {
			next = persistElementOrder(
				next,
				bucket.parentId,
				bucket.ids,
				lookup
			);
		}
	}
	return next;
}

function wouldLeaveZeroRequired(
	blocks: BlockNode[],
	control: ControlDef,
	config: TemplateOptionsConfig
): boolean {
	const ids = control.requireAtLeastOneOf;
	if (!ids?.length) {
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
	persistOrder = true,
	selectedClientId?: string | null,
	orderBuckets?: ElementBucket[]
): BlockNode[] {
	const lookup = lookupFromControl(control, selectedClientId);
	const ctx = { ...defaultOpsContext, lookup };
	const rule = control.innerOrder;
	const bucketParents = rule?.bucketParents;
	let homeParent: string | null = null;
	let capturedBuckets: ElementBucket[] | null = null;
	if (rule && orderBuckets?.length) {
		capturedBuckets = orderBuckets.map((bucket) => ({
			parentId: bucket.parentId,
			ids: bucket.ids.slice(),
		}));
		homeParent =
			findLiveParentStampId(blocks, control.target.id, lookup) ||
			(bucketParents?.length
				? resolveBucketInsertParent(
						blocks,
						control.target.id,
						bucketParents,
						rule.parentId,
						lookup
					)
				: rule.parentId);
	} else if (bucketParents?.length && rule) {
		// Capture order while the section is still in the tree so a
		// toggle-off does not append the id to the end of the list.
		capturedBuckets = resolveElementBuckets(blocks, rule);
		homeParent =
			findLiveParentStampId(blocks, control.target.id, lookup) ||
			resolveBucketInsertParent(
				blocks,
				control.target.id,
				bucketParents,
				rule.parentId,
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
			persistOrder,
			capturedBuckets,
			lookup
		);
		return applyMetaToggleSideEffects(tree, control, enabled);
	}

	tree = applyInnerOrder(tree, control, orderSource, selectedClientId);
	// User toggles persist the drag list. Design-swap reapply must not —
	// the new pattern is the order source and stored order was just cleared.
	if (persistOrder && control.innerOrder) {
		const ids = resolveInnerOrderIds(control, orderSource);
		if (ids) {
			tree = persistElementOrder(
				tree,
				control.innerOrder.parentId,
				ids,
				lookup
			);
		}
	}
	return applyMetaToggleSideEffects(tree, control, enabled);
}

export const handleToggleSection: OperationHandler = ({
	blocks,
	control,
	nextValue,
	config,
	selectedClientId,
	orderBuckets,
}) => {
	const enabled = control.invertPresence ? !nextValue : !!nextValue;
	if (!enabled && wouldLeaveZeroRequired(blocks, control, config)) {
		return { kind: 'blocks', blocks };
	}
	return {
		kind: 'blocks',
		blocks: applyToggleControl(
			blocks,
			control,
			enabled,
			blocks,
			config.layoutId,
			true,
			selectedClientId,
			orderBuckets
		),
	};
};
