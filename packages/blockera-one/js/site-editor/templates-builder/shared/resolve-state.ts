/**
 * Section / layout detection — stamp anchors first, then heuristics.
 */

import { getStamp } from './metadata';
import { findByStamp, getAtPath, walkBlocks } from './tree';
import type {
	BlockNode,
	ResolvedOptionState,
	SectionHeuristic,
	VariantDef,
} from './types';

/**
 * The layout root block doubles as the "main" container for attribute
 * carry-over across transplants (it has no separate container stamp).
 */
export const LAYOUT_ROOT_CONTAINER_KEY = 'main';

function buildAreaAndContainerMaps(
	layoutBlock: BlockNode,
	layoutPath: number[]
) {
	const areaMap: NonNullable<ResolvedOptionState['areaMap']> = {};
	const containerMap: NonNullable<ResolvedOptionState['containerMap']> = {};

	walkBlocks(
		[layoutBlock],
		(block, relativePath) => {
			const stamp = getStamp(block);
			if (!stamp) {
				return;
			}
			const absolutePath =
				relativePath.length === 1
					? layoutPath
					: [...layoutPath, ...relativePath.slice(1)];

			const role = stamp.role;
			if (role === 'area') {
				areaMap[stamp.id] = {
					path: absolutePath,
					attributes: { ...(block.attributes || {}) },
					innerBlocks: [...(block.innerBlocks || [])],
				};
			} else if (role === 'container') {
				containerMap[stamp.id] = {
					path: absolutePath,
					attributes: { ...(block.attributes || {}) },
				};
			} else if (
				role === 'layout' &&
				!containerMap[LAYOUT_ROOT_CONTAINER_KEY]
			) {
				// One role per block: the root carries only the layout stamp
				// but still acts as the "main" container for carry-over.
				containerMap[LAYOUT_ROOT_CONTAINER_KEY] = {
					path: absolutePath,
					attributes: { ...(block.attributes || {}) },
				};
			}
		},
		[]
	);

	return { areaMap, containerMap };
}

/**
 * Global section id → stampless heuristic registry. Each template-type config
 * declares its `sectionHeuristics`; `registry.ts` feeds them here at module
 * load so this engine stays template-agnostic.
 */
const HEURISTIC_REGISTRY = new Map<string, SectionHeuristic>();

export function registerSectionHeuristics(
	heuristics: Record<string, SectionHeuristic>
): void {
	for (const [id, heuristic] of Object.entries(heuristics)) {
		HEURISTIC_REGISTRY.set(id, heuristic);
	}
}

/**
 * Nearest group ancestor directly wrapping a child of the given block name.
 * Used for group-wrapped sections (e.g. page-title group around query-title):
 * never treat the bare child as the section root — that kept the toggle "on"
 * after remove when a similar block existed inside the listing.
 */
function heuristicFindWrappingGroup(
	blocks: BlockNode[],
	childName: string
): { block: BlockNode; path: number[] } | null {
	const child = findByStamp(blocks, (_s, b) => b.name === childName);
	if (!child) {
		return null;
	}

	let skippedContainer = false;
	for (let depth = child.path.length - 1; depth >= 1; depth--) {
		const ancestorPath = child.path.slice(0, depth);
		const ancestor = getAtPath(blocks, ancestorPath);
		if (!ancestor || ancestor.name !== 'core/group') {
			continue;
		}
		// Skip structural wrappers (e.g. container/elements) so the
		// section root stays the outer group, not the inner stack.
		if (getStamp(ancestor)?.role === 'container') {
			skippedContainer = true;
			continue;
		}
		const children = ancestor.innerBlocks || [];
		const hasMatchingChild = children.some(
			(node) => node.name === childName
		);
		if (hasMatchingChild || skippedContainer) {
			return { block: ancestor, path: ancestorPath };
		}
	}

	return null;
}

function matchesTemplatePartHeuristic(
	block: BlockNode,
	heuristic: Extract<SectionHeuristic, { kind: 'templatePart' }>
): boolean {
	if (block.name !== 'core/template-part') {
		return false;
	}
	const slug =
		typeof block.attributes?.slug === 'string'
			? String(block.attributes.slug)
			: '';
	if (heuristic.area && block.attributes?.area === heuristic.area) {
		return true;
	}
	if (heuristic.slugPrefix && slug.startsWith(heuristic.slugPrefix)) {
		return true;
	}
	if (heuristic.slugIncludes && slug.includes(heuristic.slugIncludes)) {
		return true;
	}
	return false;
}

function heuristicFindSection(
	blocks: BlockNode[],
	sectionId: string
): { block: BlockNode; path: number[] } | null {
	const heuristic = HEURISTIC_REGISTRY.get(sectionId);
	if (!heuristic) {
		return null;
	}
	switch (heuristic.kind) {
		case 'blockName':
			return findByStamp(blocks, (_s, b) => b.name === heuristic.name);
		case 'groupWrapping':
			return heuristicFindWrappingGroup(blocks, heuristic.childName);
		case 'templatePart':
			return findByStamp(blocks, (_s, b) =>
				matchesTemplatePartHeuristic(b, heuristic)
			);
		case 'innerBlock':
			return heuristicFindInnerBlock(
				blocks,
				heuristic.parentId,
				heuristic.name
			);
		default:
			return null;
	}
}

/**
 * Direct child of a parent section whose block name matches. Parent is
 * resolved by stamp first, then by the parent's own heuristic (never
 * `innerBlock`, so this cannot recurse into itself).
 */
function heuristicFindInnerBlock(
	blocks: BlockNode[],
	parentId: string,
	name: string
): { block: BlockNode; path: number[] } | null {
	const parentByStamp = findByStamp(
		blocks,
		(stamp) => stamp?.id === parentId
	);
	const parent =
		parentByStamp || heuristicFindParentSection(blocks, parentId);
	if (!parent) {
		return null;
	}
	const children = parent.block.innerBlocks || [];
	for (let i = 0; i < children.length; i++) {
		if (children[i].name === name) {
			return { block: children[i], path: [...parent.path, i] };
		}
	}
	return null;
}

function heuristicFindParentSection(
	blocks: BlockNode[],
	parentId: string
): { block: BlockNode; path: number[] } | null {
	const heuristic = HEURISTIC_REGISTRY.get(parentId);
	if (!heuristic || heuristic.kind === 'innerBlock') {
		return null;
	}
	switch (heuristic.kind) {
		case 'blockName':
			return findByStamp(blocks, (_s, b) => b.name === heuristic.name);
		case 'groupWrapping':
			return heuristicFindWrappingGroup(blocks, heuristic.childName);
		case 'templatePart':
			return findByStamp(blocks, (_s, b) =>
				matchesTemplatePartHeuristic(b, heuristic)
			);
		default:
			return null;
	}
}

function heuristicFindLayout(
	blocks: BlockNode[]
): { block: BlockNode; path: number[] } | null {
	// Prefer main tagName group.
	const main = findByStamp(
		blocks,
		(_s, b) => b.name === 'core/group' && b.attributes?.tagName === 'main'
	);
	if (main) {
		return main;
	}
	// Fallback: first top-level group that is not a template-part.
	for (let i = 0; i < blocks.length; i++) {
		if (blocks[i].name === 'core/group') {
			return { block: blocks[i], path: [i] };
		}
	}
	return null;
}

/**
 * Resolve layout state including area/container maps.
 */
export function resolveLayoutState(
	blocks: BlockNode[],
	layoutId: string,
	knownVariants: VariantDef[] = []
): ResolvedOptionState {
	const byStamp = findByStamp(blocks, (stamp) => stamp?.id === layoutId);

	if (byStamp) {
		const stamp = getStamp(byStamp.block);
		const maps = buildAreaAndContainerMaps(byStamp.block, byStamp.path);
		const knownIds = new Set(knownVariants.map((v) => v.id));
		const variant = stamp?.variant || null;
		const kind =
			variant && knownIds.size > 0 && !knownIds.has(variant)
				? 'customized'
				: 'value';
		return {
			kind,
			value: variant,
			path: byStamp.path,
			areaMap: maps.areaMap,
			containerMap: maps.containerMap,
		};
	}

	// Partial: areas exist without layout stamp.
	const contentArea = findByStamp(blocks, (stamp) => stamp?.id === 'content');
	if (contentArea) {
		const layoutGuess = heuristicFindLayout(blocks);
		if (layoutGuess) {
			const maps = buildAreaAndContainerMaps(
				layoutGuess.block,
				layoutGuess.path
			);
			return {
				kind: 'customized',
				value: null,
				path: layoutGuess.path,
				areaMap: maps.areaMap,
				containerMap: maps.containerMap,
			};
		}
	}

	const heuristic = heuristicFindLayout(blocks);
	if (heuristic) {
		// Best-effort: treat whole main as content.
		return {
			kind: 'unrecognized',
			value: null,
			path: heuristic.path,
			areaMap: {
				content: {
					path: heuristic.path,
					attributes: { ...(heuristic.block.attributes || {}) },
					innerBlocks: [...(heuristic.block.innerBlocks || [])],
				},
			},
			containerMap: {
				[LAYOUT_ROOT_CONTAINER_KEY]: {
					path: heuristic.path,
					attributes: { ...(heuristic.block.attributes || {}) },
				},
			},
		};
	}

	return { kind: 'unrecognized', value: null };
}

/**
 * Map a leftover `default` stamp onto `simple` when the catalog dropped
 * `default` and now ships `simple` (page-title Simple rename).
 */
function canonicalizeVariant(variant: string, knownIds: Set<string>): string {
	if (knownIds.size === 0 || knownIds.has(variant)) {
		return variant;
	}
	if (variant === 'default' && knownIds.has('simple')) {
		return 'simple';
	}
	return variant;
}

/**
 * Resolve a leaf section state.
 */
export function resolveSectionState(
	blocks: BlockNode[],
	sectionId: string,
	knownVariants: VariantDef[] = []
): ResolvedOptionState {
	const byStamp = findByStamp(blocks, (stamp) => stamp?.id === sectionId);
	if (byStamp) {
		const stamp = getStamp(byStamp.block);
		const knownIds = new Set(knownVariants.map((v) => v.id));
		// Template-part chrome sections use slug as the design id.
		const slug =
			byStamp.block.name === 'core/template-part' &&
			typeof byStamp.block.attributes?.slug === 'string'
				? String(byStamp.block.attributes.slug)
				: null;
		const rawVariant = slug || stamp?.variant || 'default';
		const variant = canonicalizeVariant(rawVariant, knownIds);
		const kind =
			knownIds.size > 0 && !knownIds.has(variant)
				? 'customized'
				: 'value';
		return {
			kind,
			value: variant,
			path: byStamp.path,
		};
	}

	const heuristic = heuristicFindSection(blocks, sectionId);
	if (heuristic) {
		return {
			kind: 'customized',
			value: null,
			path: heuristic.path,
		};
	}

	return { kind: 'missing', value: false };
}

/**
 * Resolve toggle presence for a section (on/off).
 */
export function resolveToggleState(
	blocks: BlockNode[],
	sectionId: string
): ResolvedOptionState {
	const state = resolveSectionState(blocks, sectionId);
	if (state.kind === 'missing') {
		return { kind: 'value', value: false };
	}
	return { kind: 'value', value: true, path: state.path };
}

/**
 * Toggle is on when the primary section or any alsoToggle companion exists.
 */
export function resolveCompoundToggleEnabled(
	blocks: BlockNode[],
	control: { target: { id: string }; alsoToggle?: Array<{ id: string }> }
): boolean {
	if (resolveToggleState(blocks, control.target.id).value) {
		return true;
	}
	const extras = control.alsoToggle;
	if (!extras?.length) {
		return false;
	}
	for (let i = 0; i < extras.length; i++) {
		if (resolveToggleState(blocks, extras[i].id).value) {
			return true;
		}
	}
	return false;
}

/**
 * Infer sidebar position from layout variant or column order.
 */
export function resolveSidebarLayoutValue(
	layoutState: ResolvedOptionState
): string {
	if (typeof layoutState.value === 'string' && layoutState.value) {
		return layoutState.value;
	}
	if (layoutState.areaMap?.['sidebar-area']) {
		const contentPath = layoutState.areaMap.content?.path || [];
		const sidebarPath = layoutState.areaMap['sidebar-area'].path;
		// Compare first differing index under columns.
		const contentIdx = contentPath[contentPath.length - 2] ?? 1;
		const sidebarIdx = sidebarPath[sidebarPath.length - 2] ?? 0;
		return sidebarIdx < contentIdx ? 'sidebar-left' : 'sidebar-right';
	}
	return 'no-sidebar';
}

export function findLayoutPath(
	blocks: BlockNode[],
	layoutId: string
): number[] | null {
	const match = findByStamp(blocks, (stamp) => stamp?.id === layoutId);
	return match?.path ?? null;
}

/** Stamp id for the vertical-rail columns container around header + body. */
export const CHROME_RAIL_STAMP_ID = 'chrome-rail';

/**
 * Find the vertical-rail chrome columns block, if present.
 */
export function findChromeRail(
	blocks: BlockNode[]
): { block: BlockNode; path: number[] } | null {
	return findByStamp(blocks, (stamp) => stamp?.id === CHROME_RAIL_STAMP_ID);
}

/**
 * True when the header template-part currently sits inside a chrome-rail.
 */
export function isVerticalRailChrome(blocks: BlockNode[]): boolean {
	return !!findChromeRail(blocks);
}
