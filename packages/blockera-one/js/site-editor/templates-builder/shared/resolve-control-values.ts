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
import { getAtPath } from './tree';
import { getStamp } from './metadata';
import { getActiveBlockStyleName } from './block-style';
import type {
	BlockNode,
	ControlDef,
	ControlValue,
	ResolvedOptionState,
	TemplateOptionsConfig,
} from './types';

export type ControlViewState = {
	control: ControlDef;
	state: ResolvedOptionState;
	/** Resolved UI value (variant id, boolean, number, gap object). */
	value: ControlValue;
	visible: boolean;
	needsConfirm: boolean;
	/** Block name of the bound section, when detected. */
	blockName?: string;
	/** Canvas clientId of the bound section, when present on the node. */
	clientId?: string;
};

function evaluateConditions(
	control: ControlDef,
	values: Record<string, ControlValue>
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

function isControlValue(value: unknown): value is ControlValue {
	if (value === null) {
		return true;
	}
	const t = typeof value;
	return (
		t === 'string' || t === 'number' || t === 'boolean' || t === 'object'
	);
}

/**
 * Top vs bottom from whether the section is the first inner block of its
 * placement parent. Missing → defaultValue or "bottom".
 */
function resolvePlaceControlValue(
	blocks: BlockNode[],
	control: ControlDef
): string {
	const fallback =
		typeof control.defaultValue === 'string'
			? control.defaultValue
			: 'bottom';
	const parentId =
		control.innerOrder?.parentId ||
		control.variants?.find((v) => v.placement)?.placement?.relativeTo;
	if (!parentId) {
		return fallback;
	}
	const child = resolveSectionState(blocks, control.target.id);
	if (!child.path) {
		return fallback;
	}
	const parent = resolveSectionState(blocks, parentId);
	if (!parent.path) {
		return fallback;
	}
	const parentNode = getAtPath(blocks, parent.path);
	const first = parentNode?.innerBlocks?.[0];
	return getStamp(first)?.id === control.target.id ? 'top' : 'bottom';
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
	const values: Record<string, ControlValue> = {};
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
		let value: ControlValue = null;

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
		} else if (control.operation === 'setSectionAttribute') {
			state = resolveCached(`section:${control.target.id}:`, () =>
				resolveSectionState(blocks, control.target.id)
			);
			if (state.path && control.attributePath) {
				const node = getAtPath(blocks, state.path);
				const raw = getAttributeAtPath(
					node?.attributes,
					control.attributePath
				);
				if (isControlValue(raw) && raw !== null) {
					value = raw;
				} else if (control.defaultValue !== undefined) {
					value = control.defaultValue;
				}
			} else if (control.defaultValue !== undefined) {
				value = control.defaultValue;
			}
		} else if (control.operation === 'setBlockStyle') {
			state = resolveCached(`section:${control.target.id}:`, () =>
				resolveSectionState(blocks, control.target.id)
			);
			if (state.path) {
				const node = getAtPath(blocks, state.path);
				const className =
					typeof node?.attributes?.className === 'string'
						? node.attributes.className
						: '';
				value = getActiveBlockStyleName(className);
			} else if (control.defaultValue !== undefined) {
				value = control.defaultValue;
			} else {
				value = 'default';
			}
		} else if (control.operation === 'selectInCanvas') {
			state = resolveCached(`section:${control.target.id}:`, () =>
				resolveSectionState(blocks, control.target.id)
			);
			value = null;
		} else if (control.operation === 'placeSection') {
			state = resolveToggleState(blocks, control.target.id);
			value = resolvePlaceControlValue(blocks, control);
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
		const sectionNode = state.path
			? getAtPath(blocks, state.path)
			: undefined;
		const blockName = sectionNode?.name;
		const clientId =
			typeof sectionNode?.clientId === 'string'
				? sectionNode.clientId
				: undefined;
		states.push({
			control,
			state,
			value,
			visible: true,
			needsConfirm:
				state.kind === 'customized' || state.kind === 'unrecognized',
			blockName,
			clientId,
		});
	}

	return states.map((item) => ({
		...item,
		visible: evaluateConditions(item.control, values),
	}));
}
