import type { ControlDef, PanelGroupDef, TemplateOptionsConfig } from './types';
import type { NestedPanelNode } from '../../nested-panels';

export type ResolvedOptionsPanel = {
	/** Groups to render on the current screen. */
	groups: PanelGroupDef[];
	/** Nested-panel tree rooted at the builder root (for resolveNestedPanel). */
	tree: NestedPanelNode[];
	/** Groups at the stack leaf (same as groups when valid). */
	valid: boolean;
};

/**
 * Build a navigation tree from groups that declare `nestedPanel`.
 */
export function buildNestedPanelTree(
	groups: PanelGroupDef[]
): NestedPanelNode[] {
	const nodes: NestedPanelNode[] = [];
	for (const group of groups) {
		if (!group.nestedPanel) {
			continue;
		}
		nodes.push({
			id: group.nestedPanel.id,
			title: group.nestedPanel.title,
			children: buildNestedPanelTree(group.nestedPanel.groups),
		});
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
		const match = groups.find(
			(g) => g.nestedPanel && g.nestedPanel.id === segment
		);
		if (!match?.nestedPanel) {
			return { groups: config.groups, tree, valid: false };
		}
		groups = match.nestedPanel.groups;
	}

	return { groups, tree, valid: true };
}

/**
 * Flatten headerToggle + controls from every group in the panel tree
 * (root and all nestedPanel descendants) for value resolution.
 */
export function flattenPanelControls(groups: PanelGroupDef[]): ControlDef[] {
	const out: ControlDef[] = [];
	const walk = (list: PanelGroupDef[]) => {
		for (const group of list) {
			if (group.headerToggle) {
				out.push(group.headerToggle);
			}
			out.push(...group.controls);
			if (group.nestedPanel?.groups?.length) {
				walk(group.nestedPanel.groups);
			}
		}
	};
	walk(groups);
	return out;
}
