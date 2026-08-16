/**
 * Layout transplant: swap the layout variant while preserving area content,
 * container attributes and full-width sibling sections.
 */

import { getStamp, withStamp } from './metadata';
import { insertAtPlacement, type OpsContext } from './op-context';
import {
	LAYOUT_ROOT_CONTAINER_KEY,
	resolveLayoutState,
	resolveSectionState,
} from './resolve-state';
import {
	cloneTree,
	findByStamp,
	getAtPath,
	insertRelative,
	mergeUserAttributes,
	replaceAtPath,
	replaceNodeWithBlocks,
} from './tree';
import type { BlockNode, InsertRule, VariantDef } from './types';

function fillArea(
	blocks: BlockNode[],
	areaId: string,
	content: BlockNode[]
): BlockNode[] {
	const match = findByStamp(blocks, (stamp) => stamp?.id === areaId);
	if (!match) {
		return blocks;
	}
	return replaceAtPath(blocks, match.path, {
		...match.block,
		innerBlocks: cloneTree(content),
	});
}

function applyContainerCarryOver(
	tree: BlockNode[],
	containerMap: NonNullable<
		ReturnType<typeof resolveLayoutState>['containerMap']
	>
): BlockNode[] {
	// Single-pass rebuild: merging while mapping avoids the previous
	// replaceAtPath-per-container O(n·k) tree reconstruction.
	return tree.map((block) => {
		const stamp = getStamp(block);
		// The layout root has no container stamp of its own; it carries the
		// "main" container attributes across transplants.
		const role = stamp?.role || null;
		let containerKey: string | null = null;
		if (role === 'container' && stamp) {
			containerKey = stamp.id;
		} else if (role === 'layout') {
			containerKey = LAYOUT_ROOT_CONTAINER_KEY;
		}

		const source = containerKey ? containerMap[containerKey] : undefined;
		const children = block.innerBlocks?.length
			? applyContainerCarryOver(block.innerBlocks, containerMap)
			: block.innerBlocks;

		if (!source && children === block.innerBlocks) {
			return block;
		}
		return {
			...block,
			attributes: source
				? mergeUserAttributes(block.attributes || {}, source.attributes)
				: block.attributes,
			innerBlocks: children,
		};
	});
}

/**
 * Transplant layout variant while preserving area content + container attrs.
 */
export function transplantLayout(
	blocks: BlockNode[],
	params: {
		layoutId: string;
		targetVariant: VariantDef;
		knownVariants?: VariantDef[];
		/** When true, collect unmatched body into content (unrecognized). */
		bestEffort?: boolean;
		/**
		 * Active design placement per sibling section id (e.g. page-header).
		 * Sections without an entry re-attach at the layout root start.
		 */
		sectionPlacements?: Record<string, InsertRule>;
		/**
		 * Full-width sections living as layout siblings that must be
		 * carried across the transplant (config `layoutSiblingSections`).
		 */
		siblingSectionIds?: string[];
	},
	ctx: OpsContext
): BlockNode[] {
	const { layoutId, targetVariant } = params;
	const siblingSectionIds = params.siblingSectionIds || [];
	const html = targetVariant.html;
	if (!html) {
		return blocks;
	}

	const state = resolveLayoutState(
		blocks,
		layoutId,
		params.knownVariants || []
	);

	// Collect full-width sibling sections (e.g. page-header) before the layout
	// is replaced so they stay above content/sidebar columns.
	const siblingSections: BlockNode[] = [];
	for (const sectionId of siblingSectionIds) {
		const sectionState = resolveSectionState(blocks, sectionId);
		if (!sectionState.path) {
			continue;
		}
		const node = getAtPath(blocks, sectionState.path);
		if (node) {
			siblingSections.push(cloneTree([node])[0]);
		}
	}

	// Extract area contents from current tree.
	const extracted: Record<string, BlockNode[]> = {};
	if (state.areaMap) {
		for (const [areaId, area] of Object.entries(state.areaMap)) {
			const node = getAtPath(blocks, area.path);
			if (node) {
				extracted[areaId] = cloneTree(node.innerBlocks || []);
			}
		}
	} else if (params.bestEffort && state.path) {
		const body = getAtPath(blocks, state.path);
		extracted.content = cloneTree(body?.innerBlocks || []);
	}

	// Peel sibling sections out of content if a legacy template still nests them.
	if (extracted.content?.length && siblingSections.length) {
		const siblingIds = new Set<string>(siblingSectionIds);
		extracted.content = extracted.content.filter(
			(block) => !siblingIds.has(getStamp(block)?.id || '')
		);
	}

	// Instantiate target layout.
	let nextLayout = cloneTree(ctx.parse(html));
	if (nextLayout.length === 0) {
		return blocks;
	}

	// Fill areas that exist on the target. Content in areas the target does
	// not expose is discarded by design (no parking).
	const targetAreas = new Set(targetVariant.areas || ['content']);
	for (const areaId of targetAreas) {
		const content = extracted[areaId];
		if (content && content.length > 0) {
			nextLayout = fillArea(nextLayout, areaId, content);
		}
	}

	// Re-attach sibling sections. Each section follows its active design's
	// placement (e.g. Simple title inside the content area, Banner at the
	// layout root); without one it goes to the start of the layout body.
	for (const section of siblingSections) {
		const sectionId = getStamp(section)?.id || '';
		const placement = params.sectionPlacements?.[sectionId];
		const placed = placement
			? insertAtPlacement(nextLayout, placement, [section])
			: null;
		if (placed) {
			nextLayout = placed;
			continue;
		}
		const root = nextLayout[0];
		nextLayout = [
			{
				...root,
				innerBlocks: [section, ...(root.innerBlocks || [])],
			},
			...nextLayout.slice(1),
		];
	}

	// Container attribute carry-over.
	if (state.containerMap) {
		nextLayout = applyContainerCarryOver(nextLayout, state.containerMap);
	}

	// Re-stamp the layout root with the target variant.
	nextLayout = [
		withStamp(nextLayout[0], 'layout', layoutId, targetVariant.id),
		...nextLayout.slice(1),
	];

	// Replace old layout (or best-effort body) in the full template tree.
	if (state.path) {
		return replaceNodeWithBlocks(blocks, state.path, nextLayout);
	}

	// No layout found — insert after header / before footer.
	const header = findByStamp(
		blocks,
		(stamp, b) =>
			stamp?.id === 'header' ||
			(b.name === 'core/template-part' && b.attributes?.slug === 'header')
	);
	if (header) {
		return insertRelative(blocks, header.path, 'after', nextLayout);
	}
	return [...nextLayout, ...blocks];
}
