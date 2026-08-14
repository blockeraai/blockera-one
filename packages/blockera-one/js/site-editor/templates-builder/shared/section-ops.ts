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

	const parts = params.attributePath.split('.');
	const attrs = { ...(node.attributes || {}) } as Record<string, unknown>;
	let cursor: Record<string, unknown> = attrs;
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

	return replaceAtPath(blocks, state.path, {
		...node,
		attributes: attrs,
	});
}
