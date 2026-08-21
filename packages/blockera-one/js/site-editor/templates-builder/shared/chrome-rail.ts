/**
 * Chrome (site header/footer) operations: vertical-rail wrap/unwrap and
 * template-part design swaps.
 */

import { withStamp } from './metadata';
import {
	insertAtPlacement,
	replaceSectionAtPath,
	type OpsContext,
} from './op-context';
import {
	CHROME_RAIL_STAMP_ID,
	findChromeRail,
	resolveLayoutState,
	resolveSectionState,
} from './resolve/resolve-state';
import {
	cloneTree,
	findByStamp,
	getAtPath,
	insertRelative,
	removeAtPath,
} from './tree';
import type { BlockNode, VariantDef } from './types';

/**
 * Stamp id of the empty body column inside the vertical-rail pattern
 * (`patterns/archive/builder-header-vertical.php`). The wrap op injects the
 * live layout here — the pattern ships the area empty.
 */
export const RAIL_BODY_AREA_ID = 'rail-body-area';

/**
 * Unwrap vertical-rail columns back to a flat [header?, layout, footer?] tree.
 * Returns the header part (if any), layout, and remaining siblings.
 */
export function unwrapChromeRail(
	blocks: BlockNode[],
	layoutId: string
): {
	blocks: BlockNode[];
	header: BlockNode | null;
} {
	const rail = findChromeRail(blocks);
	if (!rail) {
		const headerState = resolveSectionState(blocks, 'header');
		const header = headerState.path
			? getAtPath(blocks, headerState.path)
			: null;
		return {
			blocks,
			header: header ? cloneTree([header])[0] : null,
		};
	}

	// Stamp-anchored lookup first; the positional column fallback keeps
	// rails saved with the pre-pattern hardcoded shape (or rebuilt by hand
	// without stamps) unwrappable.
	const railTree = [rail.block];
	const columns = rail.block.innerBlocks || [];
	const headerPart =
		findByStamp(railTree, (stamp) => stamp?.id === 'header')?.block ||
		(columns[0]?.innerBlocks || []).find(
			(b) => b.name === 'core/template-part'
		) ||
		null;
	const layout =
		findByStamp(railTree, (stamp) => stamp?.id === layoutId)?.block ||
		(columns[1]?.innerBlocks || [])[0] ||
		null;

	const before = blocks.slice(0, rail.path[0]);
	const after = blocks.slice(rail.path[0] + 1);
	const middle: BlockNode[] = [];
	// Single deep clone shared by the returned tree and the `header` handle —
	// both consumers treat blocks as immutable, so aliasing is safe.
	const headerClone = headerPart ? cloneTree([headerPart])[0] : null;
	if (headerClone) {
		middle.push(headerClone);
	}
	if (layout) {
		middle.push(cloneTree([layout])[0]);
	}

	return {
		blocks: [...before, ...middle, ...after],
		header: headerClone,
	};
}

/**
 * Wrap the layout into a pattern-provided rail frame. The rail ships
 * pre-stamped from the theme pattern (chrome-rail container, header part,
 * empty `rail-body-area`) — this op only injects the live layout into the
 * body area. Footer and other top-level siblings stay outside the rail.
 */
function wrapVerticalRail(
	blocks: BlockNode[],
	params: {
		layoutId: string;
		rail: BlockNode;
	}
): BlockNode[] {
	const { layoutId, rail } = params;
	const layoutState = resolveLayoutState(blocks, layoutId);
	if (!layoutState.path) {
		return blocks;
	}

	// Drop existing header (and any prior chrome-rail) before wrapping.
	let next = blocks;
	const existingRail = findChromeRail(next);
	if (existingRail) {
		const unwrapped = unwrapChromeRail(next, layoutId);
		next = unwrapped.blocks;
	}
	const headerState = resolveSectionState(next, 'header');
	if (headerState.path) {
		next = removeAtPath(next, headerState.path);
	}
	const layoutAgain = resolveLayoutState(next, layoutId);
	if (!layoutAgain.path) {
		return blocks;
	}
	const layoutNode = getAtPath(next, layoutAgain.path);
	if (!layoutNode) {
		return blocks;
	}

	// Locate the body area by stamp; fall back to the last column when a
	// child-theme pattern override lost the area stamp.
	const railTree = [rail];
	let areaPath =
		findByStamp(railTree, (stamp) => stamp?.id === RAIL_BODY_AREA_ID)
			?.path || null;
	if (!areaPath) {
		const columns = rail.innerBlocks || [];
		for (let i = columns.length - 1; i >= 0; i--) {
			if (columns[i].name === 'core/column') {
				areaPath = [0, i];
				break;
			}
		}
	}
	if (!areaPath) {
		return blocks;
	}

	const filledRail = insertRelative(railTree, areaPath, 'inside-end', [
		cloneTree([layoutNode])[0],
	])[0];

	const layoutIdx = layoutAgain.path[0];
	const before = next.slice(0, layoutIdx);
	const after = next.slice(layoutIdx + 1);
	return [...before, filledRail, ...after];
}

/**
 * Swap a site header/footer template-part design (slug + placement + chrome).
 */
export function swapTemplatePart(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		targetVariant: VariantDef;
		layoutId: string;
		knownVariants?: VariantDef[];
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

	const layout = params.targetVariant.chromeLayout || 'stacked';

	if (params.sectionId === 'header' && layout === 'vertical-rail') {
		// Pattern-kind variant: the parsed html is the full pre-stamped rail
		// frame (header part + empty body area). Force the container stamp so
		// unwrap/idempotency never depend on a (child-theme overridable)
		// pattern keeping it. wrapVerticalRail flattens any existing chrome
		// before re-framing.
		const rail = withStamp(
			replacement[0],
			'container',
			CHROME_RAIL_STAMP_ID,
			'vertical-rail'
		);
		return wrapVerticalRail(blocks, {
			layoutId: params.layoutId,
			rail,
		});
	}

	let base = replacement[0];

	// Ensure slug matches the variant id for template-parts (before the
	// single restamp below).
	if (base.name === 'core/template-part') {
		base = {
			...base,
			attributes: {
				...(base.attributes || {}),
				slug: params.targetVariant.id,
			},
		};
	}
	const nextBlock = withStamp(
		base,
		'section',
		params.sectionId,
		params.targetVariant.id
	);

	// Stacked (or footer): unwrap vertical rail first when leaving it.
	let next = blocks;
	if (params.sectionId === 'header' && findChromeRail(next)) {
		const unwrapped = unwrapChromeRail(next, params.layoutId);
		next = unwrapped.blocks;
	}

	const state = resolveSectionState(
		next,
		params.sectionId,
		params.knownVariants || []
	);

	if (state.path) {
		return replaceSectionAtPath(
			next,
			state.path,
			params.targetVariant.placement,
			[nextBlock]
		);
	}

	if (params.targetVariant.placement) {
		const placed = insertAtPlacement(next, params.targetVariant.placement, [
			nextBlock,
		]);
		if (placed) {
			return placed;
		}
	}

	// Fallback positions: header before layout, footer after layout.
	const layoutMatch = findByStamp(
		next,
		(stamp) => stamp?.id === params.layoutId
	);
	if (layoutMatch) {
		const position = params.sectionId === 'footer' ? 'after' : 'before';
		return insertRelative(next, layoutMatch.path, position, [nextBlock]);
	}
	return params.sectionId === 'footer'
		? [...next, nextBlock]
		: [nextBlock, ...next];
}

/**
 * Prepare tree for hiding a chrome section: unwrap vertical-rail first so the
 * layout is not trapped inside columns when the header part is removed.
 */
export function prepareHideChromeSection(
	blocks: BlockNode[],
	sectionId: string,
	layoutId: string
): BlockNode[] {
	if (sectionId !== 'header') {
		return blocks;
	}
	if (!findChromeRail(blocks)) {
		return blocks;
	}
	return unwrapChromeRail(blocks, layoutId).blocks;
}
