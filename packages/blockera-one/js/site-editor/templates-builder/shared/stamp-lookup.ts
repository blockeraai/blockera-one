/**
 * Parent-scoped stamp lookup. Dictionary ids stay unique; the tree may
 * repeat nested ids under different parents (listing card vs article).
 * Layout, area, and chrome slots stay tree-global first-match.
 */

import { getStamp } from './metadata';
import type { Stamp } from './stamp';
import {
	findBlockByClientId,
	findByStamp,
	findByStampWithin,
	getAtPath,
	type WalkMatch,
} from './tree';
import type { BlockNode, ControlDef, InnerOrderRule } from './types';

/** Chrome slots in a template wrapping `core/template-part`. */
export const CHROME_SLOT_IDS = new Set(['header', 'footer', 'sidebar']);

/**
 * Stamp ids that always use tree-global first-match (skip selection and
 * parentId scoping). Layout roots, fill areas, and chrome slots.
 */
export const ALWAYS_GLOBAL_STAMP_IDS = new Set([
	'main',
	'header',
	'footer',
	'sidebar',
	'content',
	'sidebar-area',
	'rail-body-area',
	'site-header',
	'site-footer',
	'site-sidebar',
]);

export type StampLookupOptions = {
	/** Explicit ancestor stamp id (tested including that ancestor). */
	within?: string;
	/** Canvas selection — nearest section/container ancestor is the scope. */
	selectedClientId?: string | null;
	/** Fallback ancestor stamp id (`innerOrder.parentId`, heuristic parent). */
	parentId?: string;
	/**
	 * Like `within`, but after canvas selection. Used so listing `body`
	 * is not the tree-global first match when nothing is selected, without
	 * ignoring a selected loop item.
	 */
	fallbackWithin?: string;
};

export function isAlwaysGlobalStampId(id: string): boolean {
	return ALWAYS_GLOBAL_STAMP_IDS.has(id);
}

function isScopeRootStamp(stamp: Stamp): boolean {
	if (stamp.role === 'layout' || stamp.role === 'area') {
		return false;
	}
	if (CHROME_SLOT_IDS.has(stamp.id)) {
		return false;
	}
	return stamp.role === 'section' || stamp.role === 'container';
}

/**
 * Walk ancestors of the selected block. Return the nearest parent whose
 * stamp is a section or container (not chrome, layout, or area). The
 * selected node itself is used only when no parent scope exists (e.g.
 * the listing section is selected).
 */
export function resolveWithinFromSelection(
	blocks: BlockNode[],
	selectedClientId: string
): WalkMatch | null {
	const selected = findBlockByClientId(blocks, selectedClientId);
	if (!selected) {
		return null;
	}
	let selectedRoot: WalkMatch | null = null;
	for (let depth = selected.path.length; depth >= 1; depth--) {
		const path = selected.path.slice(0, depth);
		const block = getAtPath(blocks, path);
		if (!block) {
			continue;
		}
		const stamp = getStamp(block);
		if (!stamp || !isScopeRootStamp(stamp)) {
			continue;
		}
		const match = { block, path };
		if (depth === selected.path.length) {
			selectedRoot = match;
			continue;
		}
		return match;
	}
	return selectedRoot;
}

function findWithinAncestorId(
	blocks: BlockNode[],
	ancestorId: string,
	predicate: (stamp: Stamp | null, block: BlockNode) => boolean
): WalkMatch | null {
	const ancestor = findByStamp(blocks, (stamp) => stamp?.id === ancestorId);
	if (!ancestor) {
		return null;
	}
	return findByStampWithin(blocks, ancestor.path, predicate);
}

/**
 * Resolve a stamp id with parent scope, then miss fallbacks.
 *
 * Nested ids: within (exclusive) → selection → fallbackWithin →
 * parentId → tree-global first-match. Always-global ids skip the
 * scoped steps. An explicit `within` never falls through to another
 * section, so reorder cannot land in a sibling `body` / `start`.
 */
export function findStampById(
	blocks: BlockNode[],
	id: string,
	options?: StampLookupOptions
): WalkMatch | null {
	const byId = (stamp: Stamp | null) => stamp?.id === id;

	if (isAlwaysGlobalStampId(id)) {
		return findByStamp(blocks, byId);
	}

	if (options?.within) {
		return findWithinAncestorId(blocks, options.within, byId);
	}

	if (options?.selectedClientId) {
		const scope = resolveWithinFromSelection(
			blocks,
			options.selectedClientId
		);
		if (scope) {
			const match = findByStampWithin(blocks, scope.path, byId);
			if (match) {
				return match;
			}
		}
	}

	if (options?.fallbackWithin) {
		const match = findWithinAncestorId(
			blocks,
			options.fallbackWithin,
			byId
		);
		if (match) {
			return match;
		}
	}

	if (options?.parentId) {
		const match = findWithinAncestorId(blocks, options.parentId, byId);
		if (match) {
			return match;
		}
	}

	return findByStamp(blocks, byId);
}

/**
 * Pin nested `parentId` under the rule's ancestor. Used for panel reads
 * (buckets, stored order, parent names) where canvas selection is absent.
 */
export function lookupFromInnerOrder(
	rule: Pick<InnerOrderRule, 'parentId' | 'within'>,
	selectedClientId?: string | null
): StampLookupOptions {
	return {
		selectedClientId: selectedClientId || undefined,
		parentId: rule.parentId,
		...(rule.within ? { within: rule.within } : {}),
	};
}

/**
 * Page-header* ids always pin under `page-header`. Nested inner-order
 * `within` pins reorders immediately and listing toggles after selection.
 */
function controlLookupScope(
	control: Pick<ControlDef, 'id' | 'innerOrder'>
): Pick<StampLookupOptions, 'within' | 'fallbackWithin'> {
	if (control.id?.startsWith('page-header')) {
		return { within: 'page-header' };
	}
	const scope = control.innerOrder?.within;
	if (!scope) {
		return {};
	}
	if (control.id?.startsWith('reorder-')) {
		return { within: scope };
	}
	return { fallbackWithin: scope };
}

/** Lookup options from a control plus an optional canvas selection. */
export function lookupFromControl(
	control: Pick<ControlDef, 'innerOrder' | 'id'>,
	selectedClientId?: string | null
): StampLookupOptions {
	return {
		selectedClientId: selectedClientId || undefined,
		parentId: control.innerOrder?.parentId,
		...controlLookupScope(control),
	};
}
