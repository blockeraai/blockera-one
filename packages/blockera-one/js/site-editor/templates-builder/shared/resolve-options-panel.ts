import type {
	ControlDef,
	NestedPanelDef,
	PanelGroupDef,
	TemplateOptionsConfig,
} from './types';
import type { NestedPanelNode } from '../../nested-panels';

export type ResolvedOptionsPanel = {
	/** Groups to render on the current screen. */
	groups: PanelGroupDef[];
	/** Nested-panel tree rooted at the builder root (for resolveNestedPanel). */
	tree: NestedPanelNode[];
	/** Groups at the stack leaf (same as groups when valid). */
	valid: boolean;
};

function controlList(group: PanelGroupDef): ControlDef[] {
	const list: ControlDef[] = [];
	if (group.headerToggle) {
		list.push(group.headerToggle);
	}
	list.push(...group.controls);
	return list;
}

/**
 * Nested panel declared on a group or on one of its controls.
 */
function findNestedPanel(
	groups: PanelGroupDef[],
	segment: string
): NestedPanelDef | null {
	for (const group of groups) {
		if (group.nestedPanel?.id === segment) {
			return group.nestedPanel;
		}
		const controls = controlList(group);
		for (let i = 0; i < controls.length; i++) {
			if (controls[i].nestedPanel?.id === segment) {
				return controls[i].nestedPanel as NestedPanelDef;
			}
		}
	}
	return null;
}

/**
 * Build a navigation tree from groups/controls that declare `nestedPanel`.
 */
export function buildNestedPanelTree(
	groups: PanelGroupDef[]
): NestedPanelNode[] {
	const nodes: NestedPanelNode[] = [];
	for (const group of groups) {
		if (group.nestedPanel) {
			nodes.push({
				id: group.nestedPanel.id,
				title: group.nestedPanel.title,
				children: buildNestedPanelTree(group.nestedPanel.groups),
			});
		}
		const controls = controlList(group);
		for (let i = 0; i < controls.length; i++) {
			const nested = controls[i].nestedPanel;
			if (!nested) {
				continue;
			}
			nodes.push({
				id: nested.id,
				title: nested.title,
				children: buildNestedPanelTree(nested.groups),
			});
		}
	}
	return nodes;
}

/**
 * Walk config.groups by stack segments to the active nestedPanel.groups.
 * Empty stack → root groups. Invalid segment → valid:false + root groups.
 */
export function resolveOptionsPanelGroups(
	config: TemplateOptionsConfig,
	stack: string[]
): ResolvedOptionsPanel {
	const tree = buildNestedPanelTree(config.groups);
	if (!stack.length) {
		return { groups: config.groups, tree, valid: true };
	}

	let groups = config.groups;
	for (const segment of stack) {
		const match = findNestedPanel(groups, segment);
		if (!match) {
			return { groups: config.groups, tree, valid: false };
		}
		groups = match.groups;
	}

	return { groups, tree, valid: true };
}

/**
 * Flatten headerToggle + controls from every group in the panel tree
 * (root and all nestedPanel descendants, including control-level panels)
 * for value resolution.
 */
export function flattenPanelControls(groups: PanelGroupDef[]): ControlDef[] {
	const out: ControlDef[] = [];
	const walk = (list: PanelGroupDef[]) => {
		for (const group of list) {
			if (group.headerToggle) {
				out.push(group.headerToggle);
				if (group.headerToggle.nestedPanel?.groups?.length) {
					walk(group.headerToggle.nestedPanel.groups);
				}
			}
			out.push(...group.controls);
			for (let i = 0; i < group.controls.length; i++) {
				const nested = group.controls[i].nestedPanel;
				if (nested?.groups?.length) {
					walk(nested.groups);
				}
			}
			if (group.nestedPanel?.groups?.length) {
				walk(group.nestedPanel.groups);
			}
		}
	};
	walk(groups);
	return out;
}
