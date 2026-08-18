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

type NestedPanelOwner = {
	panel: NestedPanelDef;
	control?: ControlDef;
	group?: PanelGroupDef;
};

/**
 * Nested panel declared on a group or on one of its controls, plus the
 * owner used to infer a canvas scroll stamp.
 */
function findNestedPanelOwner(
	groups: PanelGroupDef[],
	segment: string
): NestedPanelOwner | null {
	for (const group of groups) {
		if (group.nestedPanel?.id === segment) {
			return { panel: group.nestedPanel, group };
		}
		const controls = controlList(group);
		for (let i = 0; i < controls.length; i++) {
			const nested = controls[i].nestedPanel;
			if (nested?.id === segment) {
				return { panel: nested, control: controls[i] };
			}
		}
	}
	return null;
}

/**
 * Nested panel declared on a group or on one of its controls.
 */
function findNestedPanel(
	groups: PanelGroupDef[],
	segment: string
): NestedPanelDef | null {
	return findNestedPanelOwner(groups, segment)?.panel || null;
}

function stampIdFromTarget(target?: ControlDef['target']): string | null {
	if (!target) {
		return null;
	}
	if (target.kind === 'section' || target.kind === 'container') {
		return target.id;
	}
	return null;
}

/**
 * Stamp id to reveal in the canvas for the stack leaf. Empty / invalid
 * stack, or `scrollIntoView: false`, returns null. Layout-kind targets
 * are never used; those panels fall back to `scrollTarget` or panel id.
 */
export function resolveNestedPanelScrollTarget(
	config: TemplateOptionsConfig,
	stack: string[]
): string | null {
	if (!stack.length) {
		return null;
	}

	let groups = config.groups;
	let owner: NestedPanelOwner | null = null;
	for (let i = 0; i < stack.length; i++) {
		owner = findNestedPanelOwner(groups, stack[i]);
		if (!owner) {
			return null;
		}
		groups = owner.panel.groups;
	}

	if (!owner || owner.panel.scrollIntoView === false) {
		return null;
	}
	if (owner.panel.scrollTarget) {
		return owner.panel.scrollTarget;
	}

	const fromControl = stampIdFromTarget(owner.control?.target);
	if (fromControl) {
		return fromControl;
	}

	const fromToggle = stampIdFromTarget(owner.group?.headerToggle?.target);
	if (fromToggle) {
		return fromToggle;
	}

	return owner.panel.id;
}

/** Section / layout toggles that insert or remove a stamp. */
export function isPresenceToggle(control: ControlDef): boolean {
	return (
		control.operation === 'toggleSection' ||
		(control.operation === 'transplantLayout' && control.type === 'toggle')
	);
}

function isPresenceOff(control: ControlDef, nextValue: unknown): boolean {
	if (!isPresenceToggle(control)) {
		return false;
	}
	if (control.operation === 'toggleSection') {
		return control.invertPresence ? !!nextValue : !nextValue;
	}
	return !nextValue;
}

function stampIdForControl(control: ControlDef): string | null {
	if (control.scrollTarget) {
		return control.scrollTarget;
	}
	const fromTarget = stampIdFromTarget(control.target);
	if (fromTarget) {
		return fromTarget;
	}
	// Layout targets are the page frame (main), not a stamp.
	// The control id is the stamp (sidebar). Setting-kind ids are not
	// stamps — require scrollTarget so we do not start a canvas hunt.
	if (control.target?.kind === 'layout' && control.id) {
		return control.id;
	}
	return null;
}

/**
 * Stamp id to reveal after any control change. Presence-off (section
 * removed) and `scrollIntoView: false` return null. In-viewport skip
 * happens later in scrollStampIntoCanvas, except presence-on which
 * force-lands (inserted stamps are often already in the lower canvas).
 */
export function resolveEnableScrollTarget(
	control: ControlDef,
	nextValue: unknown
): string | null {
	if (control.scrollIntoView === false || isPresenceOff(control, nextValue)) {
		return null;
	}
	return stampIdForControl(control);
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
