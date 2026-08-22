/**
 * Session freeze for orderable Templates Builder lists.
 *
 * Keyed by InnerOrderRule identity so a parent card and its nested panel
 * that share the same rule (Post Content) keep one order. Surfaces are
 * every panel that renders that rule; freeze drops when none remain in
 * the ancestor chain (`root` + URL stack).
 */

import { getGroupInnerOrder, type ElementBucket } from './element-order';
import type { InnerOrderRule, PanelGroupDef } from './types';

export const ROOT_PANEL_KEY = 'root';

export type FrozenOrders = Record<string, ElementBucket[]>;
export type InnerOrderSurfaces = Record<string, string[]>;

/** Stable identity for a logical sortable list (not group.id / URL segment). */
export function innerOrderFreezeKey(rule: InnerOrderRule): string {
	const buckets = (rule.bucketParents || []).join(',');
	const ids = (rule.ids || []).join(',');
	return `${rule.within || ''}::${rule.parentId}::${buckets}::${ids}`;
}

function addSurface(
	acc: InnerOrderSurfaces,
	key: string,
	panelKey: string
): void {
	const current = acc[key] || [];
	if (current.indexOf(panelKey) === -1) {
		acc[key] = current.concat(panelKey);
	}
}

function walkGroups(
	groups: PanelGroupDef[],
	panelKey: string,
	acc: InnerOrderSurfaces
): void {
	for (let g = 0; g < groups.length; g++) {
		const group = groups[g];
		if (group.sortable) {
			const rule = getGroupInnerOrder(group);
			if (rule) {
				addSurface(acc, innerOrderFreezeKey(rule), panelKey);
			}
		}
		const headerPanel = group.headerToggle?.nestedPanel;
		if (headerPanel?.groups?.length) {
			walkGroups(headerPanel.groups, headerPanel.id, acc);
		}
		for (let i = 0; i < group.controls.length; i++) {
			const nested = group.controls[i].nestedPanel;
			if (nested?.groups?.length) {
				walkGroups(nested.groups, nested.id, acc);
			}
		}
		if (group.nestedPanel?.groups?.length) {
			walkGroups(group.nestedPanel.groups, group.nestedPanel.id, acc);
		}
	}
}

/**
 * Map freeze key → panel ids that render that InnerOrderRule
 * (`root` plus nestedPanel ids).
 */
export function collectInnerOrderSurfaces(
	groups: PanelGroupDef[]
): InnerOrderSurfaces {
	const acc: InnerOrderSurfaces = {};
	walkGroups(groups, ROOT_PANEL_KEY, acc);
	return acc;
}

/**
 * Drop freezes whose every surface has left the ancestor chain.
 */
export function pruneFrozenOrders(
	frozen: FrozenOrders,
	surfaces: InnerOrderSurfaces,
	stack: string[]
): FrozenOrders {
	const keys = Object.keys(frozen);
	if (!keys.length) {
		return frozen;
	}
	const active: Record<string, true> = { [ROOT_PANEL_KEY]: true };
	for (let i = 0; i < stack.length; i++) {
		active[stack[i]] = true;
	}
	const next: FrozenOrders = {};
	let dropped = false;
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const panels = surfaces[key];
		if (!panels?.length) {
			dropped = true;
			continue;
		}
		let keep = false;
		for (let p = 0; p < panels.length; p++) {
			if (active[panels[p]]) {
				keep = true;
				break;
			}
		}
		if (keep) {
			next[key] = frozen[key];
		} else {
			dropped = true;
		}
	}
	return dropped ? next : frozen;
}
