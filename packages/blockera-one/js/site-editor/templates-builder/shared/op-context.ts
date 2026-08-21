/**
 * Shared operation context (injected parse/serialize so unit tests run
 * without WP) and the placement helper used by every block operation.
 */

import { withStamp, getStamp } from './metadata';
import { findStampById, type StampLookupOptions } from './stamp-lookup';
import {
	insertRelative,
	removeAtPath,
	replaceAtPath,
	replaceNodeWithBlocks,
} from './tree';
import type { BlockNode, InsertRule } from './types';

export type ParseFn = (html: string) => BlockNode[];
export type SerializeFn = (blocks: BlockNode[]) => string;

export type OpsContext = {
	parse: ParseFn;
	serialize: SerializeFn;
	lookup?: StampLookupOptions;
};

/** Canonical inner-region order (do not re-parent existing blocks). */
export const INNER_CONTAINER_ORDER = [
	'start',
	'media',
	'body',
	'end',
	'comments',
] as const;

const CONTAINER_NAMES: Record<string, string> = {
	start: 'Start',
	media: 'Media',
	body: 'Content Blocks',
	end: 'End',
	comments: 'Comments',
};

function canonicalInsertIndex(
	children: BlockNode[],
	containerId: string
): number {
	const want = INNER_CONTAINER_ORDER.indexOf(
		containerId as (typeof INNER_CONTAINER_ORDER)[number]
	);
	if (want < 0) {
		return children.length;
	}
	for (let i = 0; i < children.length; i++) {
		const id = getStamp(children[i])?.id;
		const have = INNER_CONTAINER_ORDER.indexOf(
			id as (typeof INNER_CONTAINER_ORDER)[number]
		);
		if (have > want) {
			return i;
		}
	}
	let lastContainer = -1;
	for (let i = 0; i < children.length; i++) {
		const id = getStamp(children[i])?.id;
		if (
			INNER_CONTAINER_ORDER.indexOf(
				id as (typeof INNER_CONTAINER_ORDER)[number]
			) >= 0
		) {
			lastContainer = i;
		}
	}
	return lastContainer === -1 ? children.length : lastContainer + 1;
}

/**
 * Create a stamped inner container under `ownerId` when it is missing.
 * Existing siblings are left in place; the new group is inserted in
 * canonical slot order among other inner containers.
 */
export function ensureInnerContainer(
	blocks: BlockNode[],
	containerId: string,
	ownerId: string,
	lookup?: StampLookupOptions
): BlockNode[] {
	if (findStampById(blocks, containerId, lookup)) {
		return blocks;
	}
	const owner = findStampById(blocks, ownerId, lookup);
	if (!owner) {
		return blocks;
	}
	const children = owner.block.innerBlocks || [];
	const container = withStamp(
		{
			name: 'core/group',
			attributes: {
				layout: { type: 'constrained' },
				metadata: {
					name: CONTAINER_NAMES[containerId] || containerId,
				},
			},
			innerBlocks: [],
		},
		'container',
		containerId
	);
	const index = canonicalInsertIndex(children, containerId);
	return replaceAtPath(blocks, owner.path, {
		...owner.block,
		innerBlocks: [
			...children.slice(0, index),
			container,
			...children.slice(index),
		],
	});
}

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
	let tree = blocks;
	if (placement.ensureContainerOwner) {
		tree = ensureInnerContainer(
			tree,
			placement.relativeTo,
			placement.ensureContainerOwner,
			lookup
		);
	}
	const anchor = findStampById(tree, placement.relativeTo, lookup);
	if (!anchor) {
		return null;
	}
	return insertRelative(tree, anchor.path, placement.position, nodes);
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
