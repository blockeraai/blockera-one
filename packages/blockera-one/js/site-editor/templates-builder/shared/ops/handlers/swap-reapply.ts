/**
 * After a design swap, restore dependent toggles / places / attributes /
 * styles that the new pattern would otherwise reset.
 */

import { getAttributeAtPath } from '../../attribute-path';
import {
	isEmptyMergeValue,
	pickMergedAttributeValue,
} from '../../attribute-merge';
import { getActiveBlockStyleName } from '../../block-style';
import { getStamp } from '../../metadata';
import { placeSection, swapSection } from '../../section-ops';
import { flattenPanelControls } from '../../resolve/resolve-options-panel';
import {
	resolveCompoundToggleEnabled,
	resolveSectionState,
} from '../../resolve/resolve-state';
import { lookupFromControl } from '../../stamp-lookup';
import { getAtPath } from '../../tree';
import type {
	BlockNode,
	ControlDef,
	TemplateOptionsConfig,
	VariantDef,
} from '../../types';
import { applyInnerOrder, opsContextFor } from '../handler-helpers';
import { applySectionAttribute } from './attribute';
import { applyBlockStyle } from './block-style';
import { applyToggleControl } from './toggle';

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

/**
 * Infer Top/Bottom from whether the section is the first inner block of
 * its placement parent. Missing section → defaultValue or "bottom".
 */
export function resolvePlaceValue(
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

function collectReapplyPlans(
	blocks: BlockNode[],
	control: ControlDef,
	config: TemplateOptionsConfig,
	selectedClientId?: string | null
): ReapplyPlan[] {
	const allControls = flattenPanelControls(config.groups);
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
	return reapplyPlans;
}

export function reapplyAfterSwap(
	swapped: BlockNode[],
	original: BlockNode[],
	control: ControlDef,
	config: TemplateOptionsConfig,
	selectedClientId?: string | null
): BlockNode[] {
	const reapplyPlans = collectReapplyPlans(
		original,
		control,
		config,
		selectedClientId
	);
	let next = swapped;
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
	return next;
}
