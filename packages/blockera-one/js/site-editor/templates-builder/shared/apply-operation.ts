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
	setSectionAttribute,
	swapSection,
	swapTemplatePart,
	toggleSection,
	transplantLayout,
} from './operations';
import { getPostsPerPageMap } from './resolve-control-values';
import { resolveSectionState } from './resolve-state';
import { flattenPanelControls } from './resolve-options-panel';
import type {
	BlockNode,
	ControlDef,
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
	nextValue: string | number | boolean,
	config: TemplateOptionsConfig
): OperationResult {
	const variant = control.variants?.find((v) => v.id === String(nextValue));
	if (!variant) {
		return null;
	}

	// Capture dependent-section variants before the swap — they may live
	// inside the swapped markup (e.g. pagination inside the posts listing)
	// and would reset to the default design that markup ships with. Skipped
	// when the dependent already uses its default (first) variant.
	const allControls = flattenPanelControls(config.groups);
	const reapplyPlans: Array<{
		sectionId: string;
		variant: VariantDef;
		knownVariants: VariantDef[];
	}> = [];
	for (const depId of control.swapHints?.reapplyControls || []) {
		const dep = allControls.find((c) => c.id === depId);
		if (!dep || dep.target.kind !== 'section' || !dep.variants?.length) {
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
	for (const plan of reapplyPlans) {
		next = swapSection(
			next,
			{
				sectionId: plan.sectionId,
				targetVariant: plan.variant,
				knownVariants: plan.knownVariants,
			},
			defaultOpsContext
		);
	}
	return { kind: 'blocks', blocks: next };
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
	nextValue: string | number | boolean;
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
		return {
			kind: 'blocks',
			blocks: toggleSection(
				tree,
				{
					sectionId: control.target.id,
					enabled,
					defaultVariant: control.variants?.[0],
					insert: control.insert,
				},
				defaultOpsContext
			),
		};
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

	return null;
}
