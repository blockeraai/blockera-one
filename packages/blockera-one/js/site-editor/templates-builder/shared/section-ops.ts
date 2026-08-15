/**
 * Leaf-section operations: swap a section design, toggle a section on/off,
 * set a nested attribute on a detected section block.
 */

import { getStamp, withStamp } from './metadata';
import {
	insertAtPlacement,
	replaceSectionAtPath,
	type OpsContext,
} from './op-context';
import { resolveSectionState } from './resolve-state';
import {
	cloneTree,
	findByStamp,
	getAtPath,
	insertRelative,
	pickBlockeraExtensionAttributes,
	removeAtPath,
	replaceAtPath,
} from './tree';
import type { BlockNode, InsertRule, VariantDef } from './types';
import {
	applyBlockeraInspectorAttribute,
	isBlockeraExtensionPath,
} from './blockera-attribute';
import { replaceBlockStyleClassName } from './block-style';

/**
 * Replace a leaf section with a variant, carrying user attributes.
 */
export function swapSection(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		targetVariant: VariantDef;
		knownVariants?: VariantDef[];
		/** Preserve query.inherit / query object keys when swapping listings. */
		preserveQuery?: boolean;
	},
	ctx: OpsContext
): BlockNode[] {
	const html = params.targetVariant.html;
	if (!html) {
		return blocks;
	}

	const replacement = cloneTree(ctx.parse(html));
	if (replacement.length === 0) {
		return blocks;
	}

	const state = resolveSectionState(
		blocks,
		params.sectionId,
		params.knownVariants || []
	);

	let nextBlock = withStamp(
		replacement[0],
		'section',
		params.sectionId,
		params.targetVariant.id
	);

	if (state.path) {
		const prev = getAtPath(blocks, state.path);
		if (prev) {
			// Design/layout swaps must use the target variant's look. Carrying
			// previous style/color/align (via mergeUserAttributes) made Banner →
			// Simple keep the banner band. Only keep Blockera extensions.
			// Do not copy metadata.blockeraOneInnerOrder — a new design
			// resets element order to the pattern.
			const extensions = pickBlockeraExtensionAttributes(
				prev.attributes || {}
			);
			nextBlock = withStamp(
				{
					...nextBlock,
					attributes: {
						...(nextBlock.attributes || {}),
						...extensions,
					},
				},
				'section',
				params.sectionId,
				params.targetVariant.id
			);

			if (params.preserveQuery && prev.name === 'core/query') {
				const prevQuery =
					(prev.attributes?.query as Record<string, unknown>) || {};
				const nextQuery =
					(nextBlock.attributes?.query as Record<string, unknown>) ||
					{};
				nextBlock = {
					...nextBlock,
					attributes: {
						...(nextBlock.attributes || {}),
						query: {
							...nextQuery,
							inherit: prevQuery.inherit ?? nextQuery.inherit,
							perPage: prevQuery.perPage ?? nextQuery.perPage,
							order: prevQuery.order ?? nextQuery.order,
							orderBy: prevQuery.orderBy ?? nextQuery.orderBy,
						},
					},
				};
			}
		}

		return replaceSectionAtPath(
			blocks,
			state.path,
			params.targetVariant.placement,
			[nextBlock]
		);
	}

	// Missing — insert at the variant placement, content area, or root end.
	if (params.targetVariant.placement) {
		const placed = insertAtPlacement(
			blocks,
			params.targetVariant.placement,
			[nextBlock]
		);
		if (placed) {
			return placed;
		}
	}
	const contentArea = findByStamp(blocks, (stamp) => stamp?.id === 'content');
	if (contentArea) {
		return insertRelative(blocks, contentArea.path, 'inside-end', [
			nextBlock,
		]);
	}
	return [...blocks, nextBlock];
}

/**
 * Toggle a section off (remove) or on (insert the default variant).
 * Removal is destructive by design — no parked backup is kept.
 */
export function toggleSection(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		enabled: boolean;
		defaultVariant?: VariantDef;
		/** Fallback insertion rule when the variant has no placement. */
		insert?: InsertRule;
	},
	ctx: OpsContext
): BlockNode[] {
	const state = resolveSectionState(blocks, params.sectionId);

	if (!params.enabled) {
		if (!state.path) {
			return blocks;
		}
		return removeAtPath(blocks, state.path);
	}

	// Enable — insert the default variant markup.
	if (state.path) {
		return blocks; // already present
	}
	if (!params.defaultVariant?.html) {
		return blocks;
	}
	let restoreBlocks = ctx.parse(params.defaultVariant.html);
	if (restoreBlocks.length === 0) {
		return blocks;
	}

	restoreBlocks = [
		withStamp(
			restoreBlocks[0],
			'section',
			params.sectionId,
			params.defaultVariant.id ||
				getStamp(restoreBlocks[0])?.variant ||
				'default'
		),
		...restoreBlocks.slice(1),
	];

	// Variant placement wins; the control-level insert rule is the fallback.
	const insertRule = params.defaultVariant.placement || params.insert;
	if (insertRule) {
		restoreBlocks = alignInsertedWithParent(
			blocks,
			insertRule.relativeTo,
			restoreBlocks
		);
		const placed = insertAtPlacement(blocks, insertRule, restoreBlocks);
		if (placed) {
			return placed;
		}
	}

	const content = findByStamp(blocks, (stamp) => stamp?.id === 'content');
	return content
		? insertRelative(blocks, content.path, 'inside-start', restoreBlocks)
		: [...blocks, ...restoreBlocks];
}

/**
 * Set a nested attribute on a detected section block.
 */
export function setSectionAttribute(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		attributePath: string;
		value: unknown;
	}
): BlockNode[] {
	const state = resolveSectionState(blocks, params.sectionId);
	if (!state.path) {
		return blocks;
	}
	const node = getAtPath(blocks, state.path);
	if (!node) {
		return blocks;
	}

	const attrs = { ...(node.attributes || {}) } as Record<string, unknown>;
	let nextAttrs = attrs;

	if (isBlockeraExtensionPath(params.attributePath)) {
		nextAttrs = applyBlockeraInspectorAttribute(
			attrs,
			params.attributePath,
			params.value,
			node.name
		);
	} else {
		const parts = params.attributePath.split('.');
		let cursor: Record<string, unknown> = nextAttrs;
		for (let i = 0; i < parts.length - 1; i++) {
			const key = parts[i];
			const nextVal =
				cursor[key] && typeof cursor[key] === 'object'
					? { ...(cursor[key] as Record<string, unknown>) }
					: {};
			cursor[key] = nextVal;
			cursor = nextVal;
		}
		cursor[parts[parts.length - 1]] = params.value;
	}

	return replaceAtPath(blocks, state.path, {
		...node,
		attributes: nextAttrs,
	});
}

/**
 * Swap the Gutenberg `is-style-*` class on a detected section. Preserves
 * other className tokens (including Blockera generated ids).
 */
export function setSectionBlockStyle(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		styleName: string;
	}
): BlockNode[] {
	const state = resolveSectionState(blocks, params.sectionId);
	if (!state.path) {
		return blocks;
	}
	const node = getAtPath(blocks, state.path);
	if (!node) {
		return blocks;
	}

	const className = replaceBlockStyleClassName(
		typeof node.attributes?.className === 'string'
			? node.attributes.className
			: '',
		params.styleName
	);

	return replaceAtPath(blocks, state.path, {
		...node,
		attributes: {
			...(node.attributes || {}),
			className,
		},
	});
}

/**
 * Move an existing stamped section to a placement (inside-start / inside-end
 * of a parent, or before/after a sibling). No-op when the section is missing.
 */
export function placeSection(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		placement: InsertRule;
	}
): BlockNode[] {
	const state = resolveSectionState(blocks, params.sectionId);
	if (!state.path) {
		return blocks;
	}
	const node = getAtPath(blocks, state.path);
	if (!node) {
		return blocks;
	}
	const without = removeAtPath(blocks, state.path);
	const placed = insertAtPlacement(without, params.placement, [node]);
	return placed || blocks;
}

/**
 * Rebuild `parentId` innerBlocks so stamped children follow `orderedIds`.
 * Unstamped (or unknown-stamp) siblings stay after the managed set.
 */
export function orderInnerSections(
	blocks: BlockNode[],
	parentId: string,
	orderedIds: string[]
): BlockNode[] {
	if (!orderedIds.length) {
		return blocks;
	}
	const parent = resolveSectionState(blocks, parentId);
	if (!parent.path) {
		return blocks;
	}
	const node = getAtPath(blocks, parent.path);
	if (!node) {
		return blocks;
	}

	const idSet: Record<string, true> = {};
	for (let i = 0; i < orderedIds.length; i++) {
		idSet[orderedIds[i]] = true;
	}

	const byId: Record<string, BlockNode> = {};
	const rest: BlockNode[] = [];
	const children = node.innerBlocks || [];
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const id = getStamp(child)?.id;
		if (id && idSet[id] && !byId[id]) {
			byId[id] = child;
		} else {
			rest.push(child);
		}
	}

	const ordered: BlockNode[] = [];
	for (let i = 0; i < orderedIds.length; i++) {
		const child = byId[orderedIds[i]];
		if (child) {
			ordered.push(child);
		}
	}

	return replaceAtPath(blocks, parent.path, {
		...node,
		innerBlocks: [...ordered, ...rest],
	});
}

/**
 * Banner page-header children are centered; copy that onto inserted blocks
 * so a toggled-back title matches the active design.
 */
function alignInsertedWithParent(
	blocks: BlockNode[],
	parentId: string,
	insertBlocks: BlockNode[]
): BlockNode[] {
	const parent = resolveSectionState(blocks, parentId);
	if (!parent.path) {
		return insertBlocks;
	}
	const parentNode = getAtPath(blocks, parent.path);
	if (getStamp(parentNode)?.variant !== 'banner') {
		return insertBlocks;
	}
	return insertBlocks.map((block) => ({
		...block,
		attributes: {
			...(block.attributes || {}),
			textAlign: 'center',
		},
	}));
}
