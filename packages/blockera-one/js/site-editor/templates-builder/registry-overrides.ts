/**
 * Filter overlays: remove / patch / inject groups and controls.
 * Pure — never mutates `config`.
 */

import type {
	ControlDef,
	GroupPatch,
	PanelGroupDef,
	TemplateOptionsConfig,
	TemplateOverride,
} from './shared/types';

function transformControl(
	control: ControlDef,
	removeGroupIds: Set<string>,
	removeControlIds: Set<string>,
	controlPatches: Map<string, Partial<ControlDef>>,
	groupPatches: Map<string, GroupPatch>
): ControlDef | null {
	if (removeControlIds.has(control.id)) {
		return null;
	}

	let next = control;
	const patch = controlPatches.get(control.id);
	if (patch) {
		next = { ...control, ...patch };
	}

	if (!next.nestedPanel?.groups?.length) {
		return next;
	}

	const nestedGroups = transformGroups(
		next.nestedPanel.groups,
		removeGroupIds,
		removeControlIds,
		controlPatches,
		groupPatches
	);
	if (nestedGroups === next.nestedPanel.groups && next === control) {
		return next;
	}

	return {
		...next,
		nestedPanel: {
			...next.nestedPanel,
			groups: nestedGroups,
		},
	};
}

function transformGroups(
	groups: PanelGroupDef[],
	removeGroupIds: Set<string>,
	removeControlIds: Set<string>,
	controlPatches: Map<string, Partial<ControlDef>>,
	groupPatches: Map<string, GroupPatch>
): PanelGroupDef[] {
	return groups
		.filter((group) => !removeGroupIds.has(group.id))
		.map((group) => {
			const headerToggle = group.headerToggle
				? (transformControl(
						group.headerToggle,
						removeGroupIds,
						removeControlIds,
						controlPatches,
						groupPatches
					) ?? undefined)
				: group.headerToggle;
			const controls = group.controls
				.map((control) =>
					transformControl(
						control,
						removeGroupIds,
						removeControlIds,
						controlPatches,
						groupPatches
					)
				)
				.filter((control): control is ControlDef => control !== null);
			const nestedPanel = group.nestedPanel
				? {
						...group.nestedPanel,
						groups: transformGroups(
							group.nestedPanel.groups,
							removeGroupIds,
							removeControlIds,
							controlPatches,
							groupPatches
						),
					}
				: group.nestedPanel;
			const groupPatch = groupPatches.get(group.id);
			if (!groupPatch) {
				return {
					...group,
					headerToggle,
					controls,
					nestedPanel,
				};
			}

			const { nestedPanel: nestedPanelPatch, ...restPatch } = groupPatch;

			return {
				...group,
				...restPatch,
				headerToggle,
				controls,
				nestedPanel:
					nestedPanel && nestedPanelPatch
						? { ...nestedPanel, ...nestedPanelPatch }
						: nestedPanel,
			};
		});
}

function insertAddedGroup(
	groups: PanelGroupDef[],
	addition: { group: PanelGroupDef; after?: string },
	isRoot: boolean
): { groups: PanelGroupDef[]; placed: boolean } {
	if (!addition.after) {
		if (isRoot) {
			return { groups: [...groups, addition.group], placed: true };
		}
		return { groups, placed: false };
	}

	const index = groups.findIndex((group) => group.id === addition.after);
	if (index >= 0) {
		return {
			groups: [
				...groups.slice(0, index + 1),
				addition.group,
				...groups.slice(index + 1),
			],
			placed: true,
		};
	}

	let placed = false;
	const next = groups.map((group) => {
		if (placed || !group.nestedPanel?.groups) {
			return group;
		}
		const nested = insertAddedGroup(
			group.nestedPanel.groups,
			addition,
			false
		);
		if (!nested.placed) {
			return group;
		}
		placed = true;
		return {
			...group,
			nestedPanel: {
				...group.nestedPanel,
				groups: nested.groups,
			},
		};
	});

	return { groups: next, placed };
}

function injectControlsIntoGroups(
	groups: PanelGroupDef[],
	injections: NonNullable<TemplateOverride['injectControls']>
): PanelGroupDef[] {
	return groups.map((group) => {
		const matches = injections.filter(
			(injection) => injection.groupId === group.id
		);
		let controls = group.controls;
		for (const injection of matches) {
			if (injection.after) {
				const index = controls.findIndex(
					(control) => control.id === injection.after
				);
				controls =
					index >= 0
						? [
								...controls.slice(0, index + 1),
								...injection.controls,
								...controls.slice(index + 1),
							]
						: [...controls, ...injection.controls];
			} else {
				controls = [...controls, ...injection.controls];
			}
		}
		const nestedPanel = group.nestedPanel
			? {
					...group.nestedPanel,
					groups: injectControlsIntoGroups(
						group.nestedPanel.groups,
						injections
					),
				}
			: group.nestedPanel;
		if (controls === group.controls && nestedPanel === group.nestedPanel) {
			return group;
		}
		return { ...group, controls, nestedPanel };
	});
}

/**
 * Apply a filter's `templateOverrides` overlay. Pure — never mutates
 * `config`. Returns the same object when the filter has no overlay.
 */
export function applyTemplateOverrides(
	config: TemplateOptionsConfig,
	filter: string
): TemplateOptionsConfig {
	const overlay: TemplateOverride | undefined =
		config.templateOverrides?.[filter];
	if (!overlay) {
		return config;
	}

	const removeGroupIds = new Set(overlay.removeGroups ?? []);
	const removeControlIds = new Set(overlay.removeControls ?? []);
	const controlPatches = new Map<string, Partial<ControlDef>>();
	for (const entry of overlay.patchControls ?? []) {
		controlPatches.set(entry.controlId, {
			...(controlPatches.get(entry.controlId) || {}),
			...entry.patch,
		});
	}
	const groupPatches = new Map<string, GroupPatch>();
	for (const entry of overlay.patchGroups ?? []) {
		const previous = groupPatches.get(entry.groupId) || {};
		groupPatches.set(entry.groupId, {
			...previous,
			...entry.patch,
			nestedPanel:
				previous.nestedPanel || entry.patch.nestedPanel
					? {
							...previous.nestedPanel,
							...entry.patch.nestedPanel,
						}
					: undefined,
		});
	}

	let groups = transformGroups(
		config.groups,
		removeGroupIds,
		removeControlIds,
		controlPatches,
		groupPatches
	);

	for (const addition of overlay.addGroups ?? []) {
		const inserted = insertAddedGroup(groups, addition, true);
		groups = inserted.groups;
	}

	if (overlay.injectControls?.length) {
		groups = injectControlsIntoGroups(groups, overlay.injectControls);
	}

	return {
		...config,
		groups,
	};
}
