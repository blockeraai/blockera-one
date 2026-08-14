/**
 * Pure control-value resolution: map every config control to its current
 * state/value from the block tree + template settings (no React, no WP data).
 */

import type { TemplateSettingsRecord } from './constants';
import { flattenPanelControls } from './resolve-options-panel';
import {
	resolveLayoutState,
	resolveSectionState,
	resolveSidebarLayoutValue,
	resolveToggleState,
} from './resolve-state';
import type {
	BlockNode,
	ControlDef,
	ResolvedOptionState,
	TemplateOptionsConfig,
} from './types';

export type ControlViewState = {
	control: ControlDef;
	state: ResolvedOptionState;
	/** Resolved UI value (variant id, boolean, number). */
	value: string | number | boolean | null;
	visible: boolean;
	needsConfirm: boolean;
};

function evaluateConditions(
	control: ControlDef,
	values: Record<string, string | number | boolean | null>
): boolean {
	if (!control.conditions?.length) {
		return true;
	}
	for (const cond of control.conditions) {
		const current = values[cond.controlId];
		if (cond.equals !== undefined && current !== cond.equals) {
			return false;
		}
		if (cond.notEquals !== undefined && current === cond.notEquals) {
			return false;
		}
	}
	return true;
}

/** posts_per_page map from the settings record ({ bucket: n }). */
export function getPostsPerPageMap(
	settings: TemplateSettingsRecord | null | undefined
): Record<string, number> {
	const rawMap = settings?.posts_per_page;
	return rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap)
		? (rawMap as Record<string, number>)
		: {};
}

/**
 * Resolve view state for every control in the config.
 */
export function resolveControlViewStates(
	blocks: BlockNode[],
	config: TemplateOptionsConfig,
	settings: TemplateSettingsRecord,
	settingBucket: string
): ControlViewState[] {
	const values: Record<string, string | number | boolean | null> = {};
	const states: ControlViewState[] = [];
	// `values[id] !== undefined` misses controls whose first resolution
	// yielded null, so duplicates could resolve (and render) twice.
	const seenIds = new Set<string>();
	// Detection walks the whole tree per target; controls sharing a target
	// (e.g. sidebar toggle + sidebar-position picker on the layout) reuse
	// one resolution. Keyed by kind/id + the variant list identity, since
	// known variants influence the resolved kind (value vs customized).
	const stateCache = new Map<string, ResolvedOptionState>();

	const resolveCached = (
		key: string,
		resolve: () => ResolvedOptionState
	): ResolvedOptionState => {
		let state = stateCache.get(key);
		if (!state) {
			state = resolve();
			stateCache.set(key, state);
		}
		return state;
	};

	const variantsKey = (control: ControlDef): string =>
		(control.variants || []).map((v) => v.id).join(',');

	for (const control of flattenPanelControls(config.groups)) {
		// Header toggle and a body control may share an id; resolve once.
		if (seenIds.has(control.id)) {
			continue;
		}
		seenIds.add(control.id);
		let state: ResolvedOptionState = { kind: 'value', value: null };
		let value: string | number | boolean | null = null;

		if (control.operation === 'setTemplateSetting') {
			const map = getPostsPerPageMap(settings);
			value =
				map[settingBucket] ?? (control.defaultValue as number) ?? 10;
			state = { kind: 'value', value };
		} else if (control.target.kind === 'layout') {
			const layout = resolveCached(
				`layout:${config.layoutId}:${variantsKey(control)}`,
				() =>
					resolveLayoutState(
						blocks,
						config.layoutId,
						control.variants
					)
			);
			const layoutValue = resolveSidebarLayoutValue(layout);
			if (control.type === 'toggle') {
				value = layoutValue !== 'no-sidebar';
				state = { ...layout, value };
			} else {
				value = layoutValue;
				state = { ...layout, value };
			}
		} else if (control.type === 'toggle') {
			state = resolveToggleState(blocks, control.target.id);
			value = control.invertPresence ? !state.value : !!state.value;
		} else {
			state = resolveCached(
				`section:${control.target.id}:${variantsKey(control)}`,
				() =>
					resolveSectionState(
						blocks,
						control.target.id,
						control.variants
					)
			);
			value =
				(state.value as string | null) ??
				control.variants?.[0]?.id ??
				null;
		}

		values[control.id] = value;
		states.push({
			control,
			state,
			value,
			visible: true,
			needsConfirm:
				state.kind === 'customized' || state.kind === 'unrecognized',
		});
	}

	return states.map((item) => ({
		...item,
		visible: evaluateConditions(item.control, values),
	}));
}
