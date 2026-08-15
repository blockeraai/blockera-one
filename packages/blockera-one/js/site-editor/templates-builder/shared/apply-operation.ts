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
	normalizeElementOrder,
	persistElementOrder,
	resolveElementOrder,
} from './element-order';
import { getPostsPerPageMap } from './resolve-control-values';
import { resolveSectionState, resolveToggleState } from './resolve-state';
import { flattenPanelControls } from './resolve-options-panel';
import { getAtPath } from './tree';
import { getStamp } from './metadata';
import type {
	BlockNode,
	ControlDef,
	ControlValue,
	InsertRule,
	TemplateOptionsConfig,
	VariantDef,
} from './types';

export type OperationResult =
	| { kind: 'blocks'; blocks: BlockNode[] }
	| { kind: 'site-edits'; edits: Record<string, unknown> }
	| null;

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
	config: TemplateOptionsConfig
): OperationResult {
	const variant = control.variants?.find((v) => v.id === String(nextValue));
	if (!variant) {
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
			const prev = resolveToggleState(blocks, dep.target.id);
			reapplyPlans.push({
				kind: 'toggle',
				control: dep,
				enabled: !!prev.value,
			});
			continue;
		}
		if (dep.operation === 'placeSection') {
			const placeValue = resolvePlaceValue(blocks, dep);
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
			const prev = resolveSectionState(blocks, dep.target.id);
			if (!prev.path) {
				continue;
			}
			const node = getAtPath(blocks, prev.path);
			const raw = getAttributeAtPath(node?.attributes, dep.attributePath);
			const value =
				raw !== undefined && raw !== null ? raw : dep.defaultValue;
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
			const prev = resolveSectionState(blocks, dep.target.id);
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
		const prev = resolveSectionState(blocks, dep.target.id);
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
		},
		defaultOpsContext
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
				defaultOpsContext
			);
			continue;
		}
		if (plan.kind === 'toggle') {
			next = toggleSection(
				next,
				{
					sectionId: plan.control.target.id,
					enabled: plan.enabled,
					defaultVariant: plan.control.variants?.[0],
					insert: plan.control.insert,
				},
				defaultOpsContext
			);
			next = applyInnerOrder(next, plan.control, next);
			continue;
		}
		if (plan.kind === 'attribute' && plan.control.attributePath) {
			next = setSectionAttribute(next, {
				sectionId: plan.control.target.id,
				attributePath: plan.control.attributePath,
				value: plan.value,
			});
			continue;
		}
		if (plan.kind === 'style') {
			next = setSectionBlockStyle(next, {
				sectionId: plan.control.target.id,
				styleName: plan.value,
			});
			continue;
		}
		const placeVariant = plan.control.variants?.find(
			(v) => v.id === plan.value
		);
		if (placeVariant?.placement) {
			next = placeSection(next, {
				sectionId: plan.control.target.id,
				placement: placeVariant.placement,
			});
			next = applyInnerOrder(next, plan.control, next);
		}
	}
	return { kind: 'blocks', blocks: next };
}

/**
 * Infer Top/Bottom from whether the section is the first inner block of
 * its placement parent. Missing section → defaultValue or "bottom".
 */
function resolvePlaceValue(
	blocks: BlockNode[],
	control: ControlDef
): string | null {
	const parentId =
		control.innerOrder?.parentId ||
		control.variants?.find((v) => v.placement)?.placement?.relativeTo;
	if (!parentId) {
		return typeof control.defaultValue === 'string'
			? control.defaultValue
			: 'bottom';
	}
	const child = resolveSectionState(blocks, control.target.id);
	if (!child.path) {
		return typeof control.defaultValue === 'string'
			? control.defaultValue
			: 'bottom';
	}
	const parent = resolveSectionState(blocks, parentId);
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

/** Reorder present children to the stored/derived list after a toggle. */
function applyInnerOrder(
	tree: BlockNode[],
	control: ControlDef,
	sourceBlocks: BlockNode[]
): BlockNode[] {
	const ids = resolveInnerOrderIds(control, sourceBlocks);
	if (!ids || !control.innerOrder) {
		return tree;
	}
	return orderInnerSections(tree, control.innerOrder.parentId, ids);
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
}): OperationResult {
	const {
		blocks,
		control,
		nextValue,
		config,
		settings,
		settingBucket,
		needsConfirm,
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
				defaultOpsContext
			),
		};
	}

	if (control.operation === 'swapSection') {
		return applySwapSection(blocks, control, nextValue, config);
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
				defaultOpsContext
			),
		};
	}

	if (control.operation === 'toggleSection') {
		const enabled = control.invertPresence ? !nextValue : !!nextValue;
		let tree = blocks;
		if (!enabled) {
			tree = prepareHideChromeSection(
				tree,
				control.target.id,
				config.layoutId
			);
		}
		tree = toggleSection(
			tree,
			{
				sectionId: control.target.id,
				enabled,
				defaultVariant: control.variants?.[0],
				insert: control.insert,
			},
			defaultOpsContext
		);
		// Use the pre-toggle tree so stored/live order still includes the
		// item being hidden; orderInnerSections then applies present ids.
		tree = applyInnerOrder(tree, control, blocks);
		return { kind: 'blocks', blocks: tree };
	}

	if (control.operation === 'reorderInnerSections') {
		const rule = control.innerOrder;
		if (!rule?.parentId) {
			return null;
		}
		const ordered = normalizeElementOrder(nextValue, rule.ids);
		if (!ordered.length) {
			return null;
		}
		// Persist the full list (including off items) first, then reorder
		// only the children that are currently in the tree.
		let tree = persistElementOrder(blocks, rule.parentId, ordered);
		tree = orderInnerSections(tree, rule.parentId, ordered);
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
		});
		return { kind: 'blocks', blocks: tree };
	}

	if (control.operation === 'setSectionAttribute' && control.attributePath) {
		return {
			kind: 'blocks',
			blocks: setSectionAttribute(blocks, {
				sectionId: control.target.id,
				attributePath: control.attributePath,
				value: nextValue,
			}),
		};
	}

	if (control.operation === 'setBlockStyle') {
		return {
			kind: 'blocks',
			blocks: setSectionBlockStyle(blocks, {
				sectionId: control.target.id,
				styleName: String(nextValue || 'default'),
			}),
		};
	}

	return null;
}
