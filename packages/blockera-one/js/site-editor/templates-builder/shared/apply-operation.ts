/**
 * Pure operation dispatch: turn a control change into either a new block tree
 * or a `root/site` entity edit. No React, no WP data — the hook wires results
 * to the entity store.
 */

import { defaultOpsContext } from './blocks-adapter';
import {
	TEMPLATE_SETTINGS_KEY,
	type TemplateSettingsRecord,
} from './constants';
import {
	ensurePaginationNavLabels,
	moveInnerSection,
	prepareHideChromeSection,
	orderInnerSections,
	placeSection,
	setSectionAttribute,
	setSectionBlockStyle,
	swapSection,
	swapTemplatePart,
	toggleSection,
	transplantLayout,
} from './operations';
import { getActiveBlockStyleName } from './block-style';
import {
	clearStoredElementOrder,
	findLiveParentStampId,
	normalizeElementOrder,
	persistElementOrder,
	resolveBucketInsertParent,
	resolveElementBuckets,
	resolveElementOrder,
} from './element-order';
import { getPostsPerPageMap } from './resolve-control-values';
import {
	resolveCompoundToggleEnabled,
	resolveSectionState,
} from './resolve-state';
import { lookupFromControl, type StampLookupOptions } from './stamp-lookup';
import { flattenPanelControls } from './resolve-options-panel';
import {
	isBorderSideAssigned,
	isEmptyMergeValue,
	isSpacingBox,
	mergeAttributeKeys,
	mergeBorderSide,
	pickMergedAttributeValue,
} from './attribute-merge';
import { getAtPath } from './tree';
import { getStamp } from './metadata';
import type {
	BlockNode,
	ControlDef,
	ControlValue,
	InsertRule,
	ReorderElementsPayload,
	TemplateOptionsConfig,
	VariantDef,
} from './types';

export type OperationResult =
	| { kind: 'blocks'; blocks: BlockNode[] }
	| { kind: 'site-edits'; edits: Record<string, unknown> }
	| null;

function opsContextFor(control: ControlDef, selectedClientId?: string | null) {
	return {
		...defaultOpsContext,
		lookup: lookupFromControl(control, selectedClientId),
	};
}

/**
 * Resolve the object written for setSectionAttribute. Merge keys patch the
 * current nested object so sibling sides (e.g. padding left/right) survive.
 */
function resolveAttributeWriteValue(
	blocks: BlockNode[],
	control: ControlDef,
	value: unknown,
	lookup?: StampLookupOptions
): unknown {
	const attributePath = control.attributePath;
	if (!attributePath) {
		return value;
	}
	const state = resolveSectionState(
		blocks,
		control.target.id,
		[],
		lookup || lookupFromControl(control)
	);
	const node = state.path ? getAtPath(blocks, state.path) : undefined;
	const current = getAttributeAtPath(node?.attributes, attributePath);
	if (control.borderSide) {
		return mergeBorderSide(current, control.borderSide, value);
	}
	if (
		control.type === 'toggle' &&
		(control.onValue !== undefined || control.offValue !== undefined)
	) {
		if (value === control.onValue || value === control.offValue) {
			return value;
		}
		return value ? (control.onValue ?? true) : (control.offValue ?? false);
	}
	const mergeKeys = control.attributeMergeKeys;
	if (!mergeKeys?.length) {
		return value;
	}
	// Swap reapply may pass the whole box; writing that into margin.top
	// makes Gutenberg's useBlockProps call .charAt() on an object.
	if (isSpacingBox(value)) {
		return value;
	}
	return mergeAttributeKeys(current, mergeKeys, value);
}

/**
 * Write one attribute onto the control target, then onto each alsoSetOn
 * stamp. Missing extra stamps are a no-op. `alsoWrite` then applies extra
 * inspector paths on the same target.
 */
function applySectionAttribute(
	blocks: BlockNode[],
	control: ControlDef,
	value: unknown,
	selectedClientId?: string | null
): BlockNode[] {
	const attributePath = control.attributePath;
	if (!attributePath) {
		return blocks;
	}

	const lookup = lookupFromControl(control, selectedClientId);
	const writeValue = resolveAttributeWriteValue(
		blocks,
		control,
		value,
		lookup
	);
	let next = setSectionAttribute(blocks, {
		sectionId: control.target.id,
		attributePath,
		value: writeValue,
		lookup,
	});
	const extras = control.alsoSetOn;
	if (extras?.length) {
		for (let i = 0; i < extras.length; i++) {
			next = setSectionAttribute(next, {
				sectionId: extras[i],
				attributePath,
				value: writeValue,
				lookup,
			});
		}
	}
	const alsoWrite = control.alsoWrite;
	if (alsoWrite?.length) {
		for (let i = 0; i < alsoWrite.length; i++) {
			const extra = alsoWrite[i];
			if (!extra.attributePath) {
				continue;
			}
			next = setSectionAttribute(next, {
				sectionId: control.target.id,
				attributePath: extra.attributePath,
				value: extra.value,
				lookup,
			});
		}
	}
	return next;
}

function applyBlockStyle(
	blocks: BlockNode[],
	control: ControlDef,
	styleName: string,
	selectedClientId?: string | null
): BlockNode[] {
	const lookup = lookupFromControl(control, selectedClientId);
	let next = setSectionBlockStyle(blocks, {
		sectionId: control.target.id,
		styleName,
		lookup,
	});
	const extras = control.alsoSetOn;
	if (extras?.length) {
		for (let i = 0; i < extras.length; i++) {
			next = setSectionBlockStyle(next, {
				sectionId: extras[i],
				styleName,
				lookup,
			});
		}
	}
	return next;
}

function applyToggleControl(
	blocks: BlockNode[],
	control: ControlDef,
	enabled: boolean,
	orderSource: BlockNode[],
	layoutId: string,
	persistOrder = true,
	selectedClientId?: string | null
): BlockNode[] {
	const lookup = lookupFromControl(control, selectedClientId);
	const ctx = { ...defaultOpsContext, lookup };
	const rule = control.innerOrder;
	const bucketParents = rule?.bucketParents;
	let homeParent: string | null = null;
	let capturedBuckets: ReturnType<typeof resolveElementBuckets> | null = null;
	if (bucketParents?.length && rule) {
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
		return applyBucketedInnerOrder(
			tree,
			rule,
			control.target.id,
			homeParent || rule.parentId,
			persistOrder,
			capturedBuckets,
			lookup
		);
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
	return tree;
}

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
	capturedBuckets?: ReturnType<typeof resolveElementBuckets>,
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

function readControlAttribute(
	blocks: BlockNode[],
	control: ControlDef,
	lookup?: StampLookupOptions
): unknown {
	if (!control.attributePath) {
		return undefined;
	}
	const state = resolveSectionState(
		blocks,
		control.target.id,
		[],
		lookup || lookupFromControl(control)
	);
	const node = state.path ? getAtPath(blocks, state.path) : undefined;
	const raw = getAttributeAtPath(node?.attributes, control.attributePath);
	if (control.borderSide && raw && typeof raw === 'object') {
		return (raw as Record<string, unknown>)[control.borderSide];
	}
	if (control.attributeMergeKeys?.length) {
		return pickMergedAttributeValue(raw, control.attributeMergeKeys);
	}
	return raw;
}

function applyMirrorMergeWhen(
	blocks: BlockNode[],
	control: ControlDef,
	config: TemplateOptionsConfig,
	selectedClientId?: string | null
): BlockNode[] {
	const spec = control.mirrorMergeWhen;
	if (!spec?.whenControlId || !spec.mergeKeys?.length) {
		return blocks;
	}
	const all = flattenPanelControls(config.groups);
	const sibling = all.find((item) => item.id === spec.whenControlId);
	if (!sibling) {
		return blocks;
	}

	const divider = spec.role === 'divider' ? control : sibling;
	const spacing = spec.role === 'spacing' ? control : sibling;
	const lookup = lookupFromControl(control, selectedClientId);
	const dividerValue = readControlAttribute(blocks, divider, lookup);
	const spacingValue = readControlAttribute(blocks, spacing, lookup);
	const paddingValue =
		isBorderSideAssigned(dividerValue) && !isEmptyMergeValue(spacingValue)
			? spacingValue
			: '';

	const spacingPath =
		spec.attributePath || spacing.attributePath || 'blockeraSpacing.value';
	const current = (() => {
		const state = resolveSectionState(
			blocks,
			spacing.target.id,
			[],
			lookup
		);
		const node = state.path ? getAtPath(blocks, state.path) : undefined;
		return getAttributeAtPath(node?.attributes, spacingPath);
	})();

	return setSectionAttribute(blocks, {
		sectionId: spacing.target.id,
		attributePath: spacingPath,
		value: mergeAttributeKeys(current, spec.mergeKeys, paddingValue),
		lookup,
	});
}

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

	// Capture dependent-section state before the swap — nested sections
	// inside the swapped markup would reset to whatever the new pattern
	// ships. Re-apply toggles, positions, and non-default swap variants.
	const allControls = flattenPanelControls(config.groups);
	type ReapplyPlan =
		| {
				kind: 'swap';
				sectionId: string;
				variant: VariantDef;
				knownVariants: VariantDef[];
		  }
		| { kind: 'toggle'; control: ControlDef; enabled: boolean }
		| { kind: 'place'; control: ControlDef; value: string }
		| { kind: 'attribute'; control: ControlDef; value: unknown }
		| { kind: 'style'; control: ControlDef; value: string };
	const reapplyPlans: ReapplyPlan[] = [];
	for (const depId of control.swapHints?.reapplyControls || []) {
		const dep = allControls.find((c) => c.id === depId);
		if (!dep || dep.target.kind !== 'section') {
			continue;
		}
		if (dep.operation === 'toggleSection') {
			reapplyPlans.push({
				kind: 'toggle',
				control: dep,
				enabled: resolveCompoundToggleEnabled(
					blocks,
					dep,
					lookupFromControl(dep, selectedClientId)
				),
			});
			continue;
		}
		if (dep.operation === 'placeSection') {
			const placeValue = resolvePlaceValue(blocks, dep, selectedClientId);
			if (placeValue) {
				reapplyPlans.push({
					kind: 'place',
					control: dep,
					value: placeValue,
				});
			}
			continue;
		}
		if (dep.operation === 'setSectionAttribute' && dep.attributePath) {
			const prev = resolveSectionState(
				blocks,
				dep.target.id,
				[],
				lookupFromControl(dep, selectedClientId)
			);
			if (!prev.path) {
				continue;
			}
			const node = getAtPath(blocks, prev.path);
			const raw = getAttributeAtPath(node?.attributes, dep.attributePath);
			let value: unknown =
				raw !== undefined && raw !== null ? raw : dep.defaultValue;
			if (dep.borderSide && raw && typeof raw === 'object') {
				value = (raw as Record<string, unknown>)[dep.borderSide];
			} else if (dep.attributeMergeKeys?.length) {
				const picked = pickMergedAttributeValue(
					raw,
					dep.attributeMergeKeys
				);
				if (isEmptyMergeValue(picked)) {
					continue;
				}
				value = picked;
			}
			if (value === undefined) {
				continue;
			}
			reapplyPlans.push({
				kind: 'attribute',
				control: dep,
				value,
			});
			continue;
		}
		if (dep.operation === 'setBlockStyle') {
			const prev = resolveSectionState(
				blocks,
				dep.target.id,
				[],
				lookupFromControl(dep, selectedClientId)
			);
			if (!prev.path) {
				continue;
			}
			const node = getAtPath(blocks, prev.path);
			const className =
				typeof node?.attributes?.className === 'string'
					? node.attributes.className
					: '';
			reapplyPlans.push({
				kind: 'style',
				control: dep,
				value: getActiveBlockStyleName(className),
			});
			continue;
		}
		if (dep.operation !== 'swapSection' || !dep.variants?.length) {
			continue;
		}
		const prev = resolveSectionState(
			blocks,
			dep.target.id,
			[],
			lookupFromControl(dep, selectedClientId)
		);
		if (
			typeof prev.value !== 'string' ||
			!prev.value ||
			prev.value === dep.variants[0].id
		) {
			continue;
		}
		const depVariant = dep.variants.find((v) => v.id === prev.value);
		if (depVariant) {
			reapplyPlans.push({
				kind: 'swap',
				sectionId: dep.target.id,
				variant: depVariant,
				knownVariants: dep.variants,
			});
		}
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
	// New design pattern is the order source — drop any previous drag list.
	next = clearStoredElementOrder(next, control.target.id);
	for (const plan of reapplyPlans) {
		if (plan.kind === 'swap') {
			next = swapSection(
				next,
				{
					sectionId: plan.sectionId,
					targetVariant: plan.variant,
					knownVariants: plan.knownVariants,
				},
				opsContextFor(control, selectedClientId)
			);
			continue;
		}
		if (plan.kind === 'toggle') {
			next = applyToggleControl(
				next,
				plan.control,
				plan.enabled,
				next,
				config.layoutId,
				false,
				selectedClientId
			);
			continue;
		}
		if (plan.kind === 'attribute' && plan.control.attributePath) {
			next = applySectionAttribute(
				next,
				plan.control,
				plan.value,
				selectedClientId
			);
			continue;
		}
		if (plan.kind === 'style') {
			next = applyBlockStyle(
				next,
				plan.control,
				plan.value,
				selectedClientId
			);
			continue;
		}
		const placeVariant = plan.control.variants?.find(
			(v) => v.id === plan.value
		);
		if (placeVariant?.placement) {
			next = placeSection(next, {
				sectionId: plan.control.target.id,
				placement: placeVariant.placement,
				lookup: lookupFromControl(plan.control, selectedClientId),
			});
			next = applyInnerOrder(next, plan.control, next, selectedClientId);
		}
	}
	return {
		kind: 'blocks',
		blocks: ensurePaginationNavLabels(next),
	};
}

/**
 * Infer Top/Bottom from whether the section is the first inner block of
 * its placement parent. Missing section → defaultValue or "bottom".
 */
function resolvePlaceValue(
	blocks: BlockNode[],
	control: ControlDef,
	selectedClientId?: string | null
): string | null {
	const parentId =
		control.innerOrder?.parentId ||
		control.variants?.find((v) => v.placement)?.placement?.relativeTo;
	if (!parentId) {
		return typeof control.defaultValue === 'string'
			? control.defaultValue
			: 'bottom';
	}
	const lookup = lookupFromControl(control, selectedClientId);
	const child = resolveSectionState(blocks, control.target.id, [], lookup);
	if (!child.path) {
		return typeof control.defaultValue === 'string'
			? control.defaultValue
			: 'bottom';
	}
	const parent = resolveSectionState(blocks, parentId, [], lookup);
	if (!parent.path) {
		return 'bottom';
	}
	const parentNode = getAtPath(blocks, parent.path);
	const first = parentNode?.innerBlocks?.[0];
	return getStamp(first)?.id === control.target.id ? 'top' : 'bottom';
}

function resolveInnerOrderIds(
	control: ControlDef,
	sourceBlocks: BlockNode[]
): string[] | null {
	const rule = control.innerOrder;
	if (!rule?.ids?.length) {
		return null;
	}
	return resolveElementOrder(sourceBlocks, rule);
}

function getAttributeAtPath(
	attributes: Record<string, unknown> | undefined,
	path: string
): unknown {
	if (!attributes || !path) {
		return undefined;
	}
	const parts = path.split('.');
	let cursor: unknown = attributes;
	for (let i = 0; i < parts.length; i++) {
		if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
			return undefined;
		}
		cursor = (cursor as Record<string, unknown>)[parts[i]];
	}
	return cursor;
}

function isBucketReorderPayload(
	value: ControlValue
): value is Extract<ReorderElementsPayload, { buckets: unknown }> {
	return (
		!!value &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		Array.isArray((value as { buckets?: unknown }).buckets)
	);
}

/** Reorder present children to the stored/derived list after a toggle. */
function applyInnerOrder(
	tree: BlockNode[],
	control: ControlDef,
	sourceBlocks: BlockNode[],
	selectedClientId?: string | null
): BlockNode[] {
	const ids = resolveInnerOrderIds(control, sourceBlocks);
	if (!ids || !control.innerOrder) {
		return tree;
	}
	return orderInnerSections(
		tree,
		control.innerOrder.parentId,
		ids,
		lookupFromControl(control, selectedClientId)
	);
}

/**
 * Apply a control change. Pure: returns the resulting block tree or the
 * site-entity edits (setTemplateSetting), never mutates inputs.
 *
 * @param args.needsConfirm Transplant runs best-effort when the current
 *                          structure was customized/unrecognized.
 */
export function applyOperation(args: {
	blocks: BlockNode[];
	control: ControlDef;
	nextValue: ControlValue;
	config: TemplateOptionsConfig;
	settings: TemplateSettingsRecord;
	settingBucket: string;
	needsConfirm: boolean;
	selectedClientId?: string | null;
}): OperationResult {
	const {
		blocks,
		control,
		nextValue,
		config,
		settings,
		settingBucket,
		needsConfirm,
		selectedClientId,
	} = args;

	if (control.operation === 'setTemplateSetting') {
		const prev = getPostsPerPageMap(settings);
		const numeric = Number(nextValue) || 10;
		const nextSettings = {
			...(settings as object),
			posts_per_page: {
				...prev,
				[settingBucket]: numeric,
			},
		};
		// Frontend: blockera_one_template_settings + pre_get_posts.
		// Editor canvas: inherited Query loops read site.posts_per_page
		// (see Gutenberg QueryContent). Mirror WP core PostsPerPage.
		return {
			kind: 'site-edits',
			edits: {
				[TEMPLATE_SETTINGS_KEY]: nextSettings,
				posts_per_page: numeric,
			},
		};
	}

	if (control.operation === 'transplantLayout') {
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
		return {
			kind: 'blocks',
			blocks: transplantLayout(
				blocks,
				{
					layoutId: config.layoutId,
					targetVariant: variant,
					knownVariants: control.variants,
					bestEffort: needsConfirm,
					sectionPlacements: getActiveSectionPlacements(
						blocks,
						config
					),
					siblingSectionIds: config.layoutSiblingSections,
				},
				opsContextFor(control, selectedClientId)
			),
		};
	}

	if (control.operation === 'swapSection') {
		return applySwapSection(
			blocks,
			control,
			nextValue,
			config,
			selectedClientId
		);
	}

	if (control.operation === 'swapTemplatePart') {
		const variant = control.variants?.find(
			(v) => v.id === String(nextValue)
		);
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
	}

	if (control.operation === 'toggleSection') {
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
				selectedClientId
			),
		};
	}

	if (control.operation === 'reorderInnerSections') {
		const rule = control.innerOrder;
		if (!rule?.parentId) {
			return null;
		}
		if (isBucketReorderPayload(nextValue)) {
			let tree = blocks;
			const lookup = lookupFromControl(control, selectedClientId);
			if (nextValue.move) {
				tree = moveInnerSection(
					tree,
					nextValue.move.sectionId,
					nextValue.move.toParentId,
					nextValue.move.index,
					lookup
				);
			}
			for (let i = 0; i < nextValue.buckets.length; i++) {
				const bucket = nextValue.buckets[i];
				tree = persistElementOrder(
					tree,
					bucket.parentId,
					bucket.ids,
					lookup
				);
				tree = orderInnerSections(
					tree,
					bucket.parentId,
					bucket.ids,
					lookup
				);
			}
			return { kind: 'blocks', blocks: tree };
		}
		const ordered = normalizeElementOrder(nextValue, rule.ids);
		if (!ordered.length) {
			return null;
		}
		const lookup = lookupFromControl(control, selectedClientId);
		// Persist the full list (including off items) first, then reorder
		// only the children that are currently in the tree.
		let tree = persistElementOrder(blocks, rule.parentId, ordered, lookup);
		tree = orderInnerSections(tree, rule.parentId, ordered, lookup);
		return { kind: 'blocks', blocks: tree };
	}

	if (control.operation === 'placeSection') {
		const variant = control.variants?.find(
			(v) => v.id === String(nextValue)
		);
		if (!variant?.placement) {
			return null;
		}
		const tree = placeSection(blocks, {
			sectionId: control.target.id,
			placement: variant.placement,
			lookup: lookupFromControl(control, selectedClientId),
		});
		return { kind: 'blocks', blocks: tree };
	}

	if (control.operation === 'setSectionAttribute' && control.attributePath) {
		let tree = applySectionAttribute(
			blocks,
			control,
			nextValue,
			selectedClientId
		);
		tree = applyMirrorMergeWhen(tree, control, config, selectedClientId);
		return { kind: 'blocks', blocks: tree };
	}

	if (control.operation === 'setBlockStyle') {
		return {
			kind: 'blocks',
			blocks: applyBlockStyle(
				blocks,
				control,
				String(nextValue || 'default'),
				selectedClientId
			),
		};
	}

	return null;
}
