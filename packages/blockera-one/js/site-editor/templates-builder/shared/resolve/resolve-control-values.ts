/**
 * Pure control-value resolution: map every config control to its current
 * state/value from the block tree + template settings (no React, no WP data).
 */

import type { TemplateSettingsRecord } from '../constants';
import { flattenPanelControls } from './resolve-options-panel';
import {
	resolveCompoundToggleEnabled,
	resolveLayoutState,
	resolveSectionState,
	resolveSidebarLayoutValue,
	resolveToggleState,
} from './resolve-state';
import { lookupFromControl } from '../stamp-lookup';
import { pickMergedAttributeValue } from '../attribute-merge';
import { getAtPath } from '../tree';
import { getStamp } from '../metadata';
import { getActiveBlockStyleName } from '../block-style';
import { getAttributeAtPath } from '../attribute-path';
import {
	deriveMetaItemsDesign,
	readMetaItemPart,
	readMetaSeparatorOption,
} from '../ops/meta';
import type {
	BlockNode,
	ControlDef,
	ControlValue,
	ResolvedOptionState,
	TemplateOptionsConfig,
} from '../types';

export type ControlViewState = {
	control: ControlDef;
	state: ResolvedOptionState;
	/** Resolved UI value (variant id, boolean, number, gap object). */
	value: ControlValue;
	visible: boolean;
	/** Last remaining member of `requireAtLeastOneOf` — lock the off switch. */
	disabled?: boolean;
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

function isLastRequiredOn(
	control: ControlDef,
	values: Record<string, ControlValue>
): boolean {
	const ids = control.requireAtLeastOneOf;
	if (!ids?.length || values[control.id] !== true) {
		return false;
	}
	let onCount = 0;
	for (let i = 0; i < ids.length; i++) {
		if (values[ids[i]] === true) {
			onCount++;
		}
	}
	return onCount === 1;
}

const EMPTY_BORDER_SIDE = { width: '', style: '', color: '' };

function pickBorderSideValue(
	raw: unknown,
	side: NonNullable<ControlDef['borderSide']>
): ControlValue {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return EMPTY_BORDER_SIDE;
	}
	const sideValue = (raw as Record<string, unknown>)[side];
	if (
		sideValue &&
		typeof sideValue === 'object' &&
		!Array.isArray(sideValue)
	) {
		return sideValue as Record<string, unknown>;
	}
	return EMPTY_BORDER_SIDE;
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

function isControlValue(value: unknown): value is ControlValue {
	if (value === null) {
		return true;
	}
	const t = typeof value;
	return (
		t === 'string' || t === 'number' || t === 'boolean' || t === 'object'
	);
}

function mapToggleAttributeToUi(
	control: ControlDef,
	raw: unknown
): ControlValue {
	if (control.type !== 'toggle' || control.onValue === undefined) {
		return raw as ControlValue;
	}
	return raw === control.onValue;
}

// Local copy of WP core presets — this module is documented as no React /
// no `@blockera/controls` (GP `CORE_WP_ASPECT_RATIO_VALUES` lives there).
const CORE_WP_ASPECT_RATIO_VALUES = [
	'1',
	'4/3',
	'3/4',
	'3/2',
	'2/3',
	'16/9',
	'9/16',
];

function isEmptyAspectRatio(raw: unknown): boolean {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return true;
	}
	const obj = raw as Record<string, unknown>;
	const val = obj.val !== undefined && obj.val !== null ? obj.val : obj.value;
	return val === undefined || val === '';
}

function aspectRatioFromWpValue(aspectRatio: unknown): Record<string, string> {
	if (
		typeof aspectRatio !== 'string' ||
		!aspectRatio ||
		aspectRatio === 'auto'
	) {
		return { val: '', width: '', height: '' };
	}
	if (CORE_WP_ASPECT_RATIO_VALUES.includes(aspectRatio)) {
		return { val: aspectRatio, width: '', height: '' };
	}
	if (aspectRatio.includes('/')) {
		const parts = aspectRatio.split('/');
		return {
			val: 'custom',
			width: (parts[0] || '').trim(),
			height: (parts[1] || '').trim(),
		};
	}
	return { val: 'custom', width: aspectRatio, height: aspectRatio };
}

function hydrateAspectRatio(
	raw: unknown,
	attributes: Record<string, unknown> | undefined
): ControlValue {
	if (!isEmptyAspectRatio(raw)) {
		return raw as ControlValue;
	}
	const fromWp = aspectRatioFromWpValue(attributes?.aspectRatio);
	if (fromWp.val) {
		return fromWp;
	}
	if (isControlValue(raw) && raw !== null) {
		return raw;
	}
	return { val: '', width: '', height: '' };
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
	const lookup = lookupFromControl(control);
	const child = resolveSectionState(blocks, control.target.id, [], lookup);
	if (!child.path) {
		return fallback;
	}
	const parent = resolveSectionState(blocks, parentId, [], lookup);
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
	settingBucket: string,
	selectedClientId?: string | null
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

	const lookupOf = (control: ControlDef) =>
		lookupFromControl(control, selectedClientId);

	// Same stamp id can live under page-header and article. `within` on
	// `page-header-*` control ids must not poison the article cache entry.
	const lookupKey = (control: ControlDef): string => {
		const lookup = lookupOf(control);
		return [
			lookup.within || '',
			lookup.fallbackWithin || '',
			lookup.parentId || '',
			lookup.selectedClientId || '',
		].join(':');
	};

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
		} else if (control.operation === 'broadcastSetting') {
			const path = control.settingPath;
			const stored =
				path && settings
					? (settings as Record<string, unknown>)[path]
					: undefined;
			if (typeof stored === 'string' || typeof stored === 'number') {
				const n = Number.parseFloat(String(stored).replace('%', ''));
				value = Number.isFinite(n)
					? n
					: ((control.defaultValue as number) ?? null);
			} else {
				value = (control.defaultValue as number) ?? null;
			}
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
		} else if (control.operation === 'setMetaItemPart') {
			state = resolveCached(
				`section:${control.target.id}:${lookupKey(control)}:meta-part`,
				() =>
					resolveSectionState(
						blocks,
						control.target.id,
						[],
						lookupOf(control)
					)
			);
			const part = control.attributePath;
			if (part === 'icon' || part === 'prefix' || part === 'suffix') {
				value = readMetaItemPart(
					blocks,
					control.target.id,
					part,
					lookupOf(control)
				);
			} else if (control.defaultValue !== undefined) {
				value = control.defaultValue;
			}
		} else if (control.operation === 'setMetaSeparator') {
			state = resolveCached(
				`section:${control.target.id}:${lookupKey(control)}:meta-sep`,
				() =>
					resolveSectionState(
						blocks,
						control.target.id,
						[],
						lookupOf(control)
					)
			);
			value = readMetaSeparatorOption(
				blocks,
				control.target.id,
				lookupOf(control)
			);
		} else if (control.operation === 'setMetaItemsDesign') {
			state = resolveCached(
				`section:${control.target.id}:${lookupKey(control)}:meta-design`,
				() =>
					resolveSectionState(
						blocks,
						control.target.id,
						[],
						lookupOf(control)
					)
			);
			value = deriveMetaItemsDesign(
				blocks,
				control.target.id,
				undefined,
				undefined,
				lookupOf(control)
			);
		} else if (control.operation === 'setSectionAttribute') {
			state = resolveCached(
				`section:${control.target.id}:${lookupKey(control)}:attr`,
				() =>
					resolveSectionState(
						blocks,
						control.target.id,
						[],
						lookupOf(control)
					)
			);
			if (state.path && control.attributePath) {
				const node = getAtPath(blocks, state.path);
				const raw = getAttributeAtPath(
					node?.attributes,
					control.attributePath
				);
				if (control.borderSide) {
					value = pickBorderSideValue(raw, control.borderSide);
				} else if (control.attributeMergeKeys?.length) {
					const picked = pickMergedAttributeValue(
						raw,
						control.attributeMergeKeys
					);
					value =
						picked === '' && control.defaultValue !== undefined
							? control.defaultValue
							: (picked as ControlValue);
				} else if (isControlValue(raw) && raw !== null) {
					value = mapToggleAttributeToUi(control, raw);
				} else if (control.defaultValue !== undefined) {
					value = control.defaultValue;
				}
				if (control.type === 'aspect-ratio') {
					value = hydrateAspectRatio(value, node?.attributes);
				}
			} else if (control.defaultValue !== undefined) {
				value = control.defaultValue;
			}
		} else if (control.operation === 'setBlockStyle') {
			state = resolveCached(
				`section:${control.target.id}:${lookupKey(control)}:style`,
				() =>
					resolveSectionState(
						blocks,
						control.target.id,
						[],
						lookupOf(control)
					)
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
			state = resolveCached(
				`section:${control.target.id}:${lookupKey(control)}:canvas`,
				() =>
					resolveSectionState(
						blocks,
						control.target.id,
						[],
						lookupOf(control)
					)
			);
			value = null;
		} else if (control.operation === 'placeSection') {
			state = resolveToggleState(
				blocks,
				control.target.id,
				lookupOf(control)
			);
			value = resolvePlaceControlValue(blocks, control);
		} else if (control.type === 'toggle') {
			const enabled = resolveCompoundToggleEnabled(
				blocks,
				control,
				lookupOf(control)
			);
			state = resolveToggleState(
				blocks,
				control.target.id,
				lookupOf(control)
			);
			value = control.invertPresence ? !enabled : enabled;
		} else {
			state = resolveCached(
				`section:${control.target.id}:${variantsKey(control)}:${lookupKey(control)}`,
				() =>
					resolveSectionState(
						blocks,
						control.target.id,
						control.variants,
						lookupOf(control)
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
			// Attribute/style edits must not ask to rebuild the layout.
			// Confirm is only for ops that swap, toggle, or transplant.
			needsConfirm:
				(control.operation === 'transplantLayout' ||
					control.operation === 'swapSection' ||
					control.operation === 'swapTemplatePart' ||
					control.operation === 'toggleSection' ||
					control.operation === 'placeSection') &&
				(state.kind === 'customized' || state.kind === 'unrecognized'),
			blockName,
			clientId,
		});
	}

	return states.map((item) => ({
		...item,
		visible: evaluateConditions(item.control, values),
		disabled: isLastRequiredOn(item.control, values),
	}));
}
