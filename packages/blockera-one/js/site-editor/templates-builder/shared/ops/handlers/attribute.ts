/**
 * setSectionAttribute — nested attribute writes, alsoSetOn, and mirror merge.
 */

import { getAttributeAtPath } from '../../attribute-path';
import {
	isBorderSideAssigned,
	isEmptyMergeValue,
	isSpacingBox,
	mergeAttributeKeys,
	mergeBorderSide,
	pickMergedAttributeValue,
} from '../../attribute-merge';
import { flattenPanelControls } from '../../resolve/resolve-options-panel';
import { resolveSectionState } from '../../resolve/resolve-state';
import { lookupFromControl, type StampLookupOptions } from '../../stamp-lookup';
import { setSectionAttribute } from '../../section-ops';
import { getAtPath } from '../../tree';
import type { BlockNode, ControlDef, TemplateOptionsConfig } from '../../types';
import { localAttributeUpdates } from '../local-replace';
import type { OperationHandler } from '../types';

/**
 * Resolve the object written for setSectionAttribute. Merge keys patch the
 * current nested object so sibling sides (e.g. padding left/right) survive.
 */
function resolveAttributeWriteValue(
	blocks: BlockNode[],
	control: ControlDef,
	value: unknown,
	lookup?: StampLookupOptions
): unknown {
	const attributePath = control.attributePath;
	if (!attributePath) {
		return value;
	}
	const state = resolveSectionState(
		blocks,
		control.target.id,
		[],
		lookup || lookupFromControl(control)
	);
	const node = state.path ? getAtPath(blocks, state.path) : undefined;
	const current = getAttributeAtPath(node?.attributes, attributePath);
	if (control.borderSide) {
		return mergeBorderSide(current, control.borderSide, value);
	}
	if (
		control.type === 'toggle' &&
		(control.onValue !== undefined || control.offValue !== undefined)
	) {
		if (value === control.onValue || value === control.offValue) {
			return value;
		}
		return value ? (control.onValue ?? true) : (control.offValue ?? false);
	}
	const mergeKeys = control.attributeMergeKeys;
	if (!mergeKeys?.length) {
		return value;
	}
	// Swap reapply may pass the whole box; writing that into margin.top
	// makes Gutenberg's useBlockProps call .charAt() on an object.
	if (isSpacingBox(value)) {
		return value;
	}
	return mergeAttributeKeys(current, mergeKeys, value);
}

function readControlAttribute(
	blocks: BlockNode[],
	control: ControlDef,
	lookup?: StampLookupOptions
): unknown {
	if (!control.attributePath) {
		return undefined;
	}
	const state = resolveSectionState(
		blocks,
		control.target.id,
		[],
		lookup || lookupFromControl(control)
	);
	const node = state.path ? getAtPath(blocks, state.path) : undefined;
	const raw = getAttributeAtPath(node?.attributes, control.attributePath);
	if (control.borderSide && raw && typeof raw === 'object') {
		return (raw as Record<string, unknown>)[control.borderSide];
	}
	if (control.attributeMergeKeys?.length) {
		return pickMergedAttributeValue(raw, control.attributeMergeKeys);
	}
	return raw;
}

function applyMirrorMergeWhen(
	blocks: BlockNode[],
	control: ControlDef,
	config: TemplateOptionsConfig,
	selectedClientId?: string | null
): BlockNode[] {
	const spec = control.mirrorMergeWhen;
	if (!spec?.whenControlId || !spec.mergeKeys?.length) {
		return blocks;
	}
	const all = flattenPanelControls(config.groups);
	const sibling = all.find((item) => item.id === spec.whenControlId);
	if (!sibling) {
		return blocks;
	}

	const divider = spec.role === 'divider' ? control : sibling;
	const spacing = spec.role === 'spacing' ? control : sibling;
	const lookup = lookupFromControl(control, selectedClientId);
	const dividerValue = readControlAttribute(blocks, divider, lookup);
	const spacingValue = readControlAttribute(blocks, spacing, lookup);
	const paddingValue =
		isBorderSideAssigned(dividerValue) && !isEmptyMergeValue(spacingValue)
			? spacingValue
			: '';

	const spacingPath =
		spec.attributePath || spacing.attributePath || 'blockeraSpacing.value';
	const current = (() => {
		const state = resolveSectionState(
			blocks,
			spacing.target.id,
			[],
			lookup
		);
		const node = state.path ? getAtPath(blocks, state.path) : undefined;
		return getAttributeAtPath(node?.attributes, spacingPath);
	})();

	return setSectionAttribute(blocks, {
		sectionId: spacing.target.id,
		attributePath: spacingPath,
		value: mergeAttributeKeys(current, spec.mergeKeys, paddingValue),
		lookup,
	});
}

/**
 * Write one attribute onto the control target, then onto each alsoSetOn
 * stamp. Missing extra stamps are a no-op. `alsoWrite` then applies extra
 * inspector paths on the same target.
 */
export function applySectionAttribute(
	blocks: BlockNode[],
	control: ControlDef,
	value: unknown,
	selectedClientId?: string | null
): BlockNode[] {
	const attributePath = control.attributePath;
	if (!attributePath) {
		return blocks;
	}

	const lookup = lookupFromControl(control, selectedClientId);
	const writeValue = resolveAttributeWriteValue(
		blocks,
		control,
		value,
		lookup
	);
	let next = setSectionAttribute(blocks, {
		sectionId: control.target.id,
		attributePath,
		value: writeValue,
		lookup,
	});
	const extras = control.alsoSetOn;
	if (extras?.length) {
		for (let i = 0; i < extras.length; i++) {
			next = setSectionAttribute(next, {
				sectionId: extras[i],
				attributePath,
				value: writeValue,
				lookup,
			});
		}
	}
	const alsoWrite = control.alsoWrite;
	if (alsoWrite?.length) {
		for (let i = 0; i < alsoWrite.length; i++) {
			const extra = alsoWrite[i];
			if (!extra.attributePath) {
				continue;
			}
			next = setSectionAttribute(next, {
				sectionId: control.target.id,
				attributePath: extra.attributePath,
				value: extra.value,
				lookup,
			});
		}
	}
	return next;
}

export const handleSetSectionAttribute: OperationHandler = ({
	blocks,
	control,
	nextValue,
	config,
	selectedClientId,
}) => {
	if (!control.attributePath) {
		return null;
	}
	let tree = applySectionAttribute(
		blocks,
		control,
		nextValue,
		selectedClientId
	);
	tree = applyMirrorMergeWhen(tree, control, config, selectedClientId);
	const localReplace = localAttributeUpdates(blocks, tree);
	return localReplace
		? { kind: 'blocks', blocks: tree, localReplace }
		: { kind: 'blocks', blocks: tree };
};
