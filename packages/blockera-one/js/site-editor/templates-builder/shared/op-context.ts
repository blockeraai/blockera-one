/**
 * Shared operation context (injected parse/serialize so unit tests run
 * without WP) and the placement helper used by every block operation.
 */

import { findStampById, type StampLookupOptions } from './stamp-lookup';
import { insertRelative, removeAtPath, replaceNodeWithBlocks } from './tree';
import type { BlockNode, InsertRule } from './types';

export type ParseFn = (html: string) => BlockNode[];
export type SerializeFn = (blocks: BlockNode[]) => string;

export type OpsContext = {
	parse: ParseFn;
	serialize: SerializeFn;
	lookup?: StampLookupOptions;
};

/**
 * Insert nodes at a placement anchor. Returns null when the anchor stamp is
 * not present so callers can fall back (in-place replace, content area, …).
 */
export function insertAtPlacement(
	blocks: BlockNode[],
	placement: InsertRule,
	nodes: BlockNode[],
	lookup?: StampLookupOptions
): BlockNode[] | null {
	const anchor = findStampById(blocks, placement.relativeTo, lookup);
	if (!anchor) {
		return null;
	}
	return insertRelative(blocks, anchor.path, placement.position, nodes);
}

/**
 * Replace the section at `path` with `nodes`, honoring an optional relocation
 * placement. Designs with a placement move the section (e.g. Simple title
 * inside content vs Banner at the layout root): the old block is removed
 * first so the anchor path resolves against the tree without it. When the
 * placement anchor is missing (or no placement), replace in place.
 */
export function replaceSectionAtPath(
	blocks: BlockNode[],
	path: number[],
	placement: InsertRule | undefined,
	nodes: BlockNode[],
	lookup?: StampLookupOptions
): BlockNode[] {
	if (placement) {
		const withoutOld = removeAtPath(blocks, path);
		const placed = insertAtPlacement(withoutOld, placement, nodes, lookup);
		if (placed) {
			return placed;
		}
	}
	return replaceNodeWithBlocks(blocks, path, nodes);
}
