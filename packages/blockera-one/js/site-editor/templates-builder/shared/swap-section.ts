/**
 * Replace a leaf section with a variant, carrying user attributes.
 */

import { withStamp } from './metadata';
import {
	insertAtPlacement,
	replaceSectionAtPath,
	type OpsContext,
} from './op-context';
import { resolveSectionState } from './resolve/resolve-state';
import {
	cloneTree,
	findByStamp,
	getAtPath,
	insertRelative,
	pickBlockeraExtensionAttributes,
} from './tree';
import type { BlockNode, VariantDef } from './types';

export function swapSection(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		targetVariant: VariantDef;
		knownVariants?: VariantDef[];
		/** Preserve query.inherit / query object keys when swapping listings. */
		preserveQuery?: boolean;
		/**
		 * Overlay previous `blockera*` attributes onto the new pattern.
		 * Off by default so the target design keeps its own look
		 * (e.g. Simple `alignItems: flex-start` must not land on Banner).
		 */
		preserveBlockeraExtensions?: boolean;
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
		params.knownVariants || [],
		ctx.lookup
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
			// Simple keep the banner band. Native WP attrs are never copied.
			// `blockera*` attrs are copied only when opted in — otherwise
			// Simple flex-start / spacing would overwrite Banner defaults.
			if (params.preserveBlockeraExtensions) {
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
			}

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
			[nextBlock],
			ctx.lookup
		);
	}

	// Missing — insert at the variant placement, content area, or root end.
	if (params.targetVariant.placement) {
		const placed = insertAtPlacement(
			blocks,
			params.targetVariant.placement,
			[nextBlock],
			ctx.lookup
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
