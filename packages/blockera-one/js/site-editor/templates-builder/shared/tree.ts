/**
 * Immutable block-tree helpers used by detection and operations.
 */

import type { Stamp } from './stamp';
import type { BlockNode } from './types';
import { getStamp } from './metadata';

export function cloneTree(blocks: BlockNode[]): BlockNode[] {
	return blocks.map((block) => ({
		...block,
		attributes: { ...(block.attributes || {}) },
		innerBlocks: cloneTree(block.innerBlocks || []),
	}));
}

export function getAtPath(
	blocks: BlockNode[],
	path: number[]
): BlockNode | null {
	let list = blocks;
	let current: BlockNode | null = null;
	for (let i = 0; i < path.length; i++) {
		current = list[path[i]] || null;
		if (!current) {
			return null;
		}
		list = current.innerBlocks || [];
	}
	return current;
}

/**
 * Replace the block at path with `next`. Deletions go through `removeAtPath`.
 */
export function replaceAtPath(
	blocks: BlockNode[],
	path: number[],
	next: BlockNode
): BlockNode[] {
	if (path.length === 0) {
		return [next];
	}

	const [index, ...rest] = path;
	return blocks.map((block, i) => {
		if (i !== index) {
			return block;
		}
		if (rest.length === 0) {
			return next;
		}
		const children = replaceAtPath(block.innerBlocks || [], rest, next);
		return { ...block, innerBlocks: children };
	});
}

/**
 * Remove the block at path; returns new tree.
 */
export function removeAtPath(blocks: BlockNode[], path: number[]): BlockNode[] {
	if (path.length === 0) {
		return blocks;
	}
	if (path.length === 1) {
		return blocks.filter((_, i) => i !== path[0]);
	}
	const [index, ...rest] = path;
	return blocks.map((block, i) => {
		if (i !== index) {
			return block;
		}
		return {
			...block,
			innerBlocks: removeAtPath(block.innerBlocks || [], rest),
		};
	});
}

/**
 * Replace block at path with one or more blocks (sibling replace).
 */
export function replaceNodeWithBlocks(
	blocks: BlockNode[],
	path: number[],
	replacements: BlockNode[]
): BlockNode[] {
	if (path.length === 0) {
		return replacements;
	}
	if (path.length === 1) {
		const next = [...blocks];
		next.splice(path[0], 1, ...replacements);
		return next;
	}
	const [index, ...rest] = path;
	return blocks.map((block, i) => {
		if (i !== index) {
			return block;
		}
		return {
			...block,
			innerBlocks: replaceNodeWithBlocks(
				block.innerBlocks || [],
				rest,
				replacements
			),
		};
	});
}

/**
 * Insert blocks relative to a path.
 */
export function insertRelative(
	blocks: BlockNode[],
	path: number[],
	position: 'before' | 'after' | 'inside-end' | 'inside-start',
	insertBlocks: BlockNode[]
): BlockNode[] {
	if (position === 'inside-end' || position === 'inside-start') {
		const target = getAtPath(blocks, path);
		if (!target) {
			return blocks;
		}
		const inner =
			position === 'inside-end'
				? [...(target.innerBlocks || []), ...insertBlocks]
				: [...insertBlocks, ...(target.innerBlocks || [])];
		return replaceAtPath(blocks, path, { ...target, innerBlocks: inner });
	}

	if (path.length === 0) {
		return position === 'before'
			? [...insertBlocks, ...blocks]
			: [...blocks, ...insertBlocks];
	}

	const parentPath = path.slice(0, -1);
	const index = path[path.length - 1];
	const insertAt = position === 'before' ? index : index + 1;

	if (parentPath.length === 0) {
		const next = [...blocks];
		next.splice(insertAt, 0, ...insertBlocks);
		return next;
	}

	const parent = getAtPath(blocks, parentPath);
	if (!parent) {
		return blocks;
	}
	const siblings = [...(parent.innerBlocks || [])];
	siblings.splice(insertAt, 0, ...insertBlocks);
	return replaceAtPath(blocks, parentPath, {
		...parent,
		innerBlocks: siblings,
	});
}

export type WalkMatch = {
	block: BlockNode;
	path: number[];
};

/**
 * Depth-first pre-order walk. The visitor may return `false` to stop the
 * whole traversal early (any other return value continues).
 */
export function walkBlocks(
	blocks: BlockNode[],
	visitor: (block: BlockNode, path: number[]) => void | boolean,
	basePath: number[] = []
): boolean {
	for (let i = 0; i < blocks.length; i++) {
		const path = [...basePath, i];
		const block = blocks[i];
		if (visitor(block, path) === false) {
			return false;
		}
		if (block.innerBlocks?.length) {
			if (walkBlocks(block.innerBlocks, visitor, path) === false) {
				return false;
			}
		}
	}
	return true;
}

export function findByStamp(
	blocks: BlockNode[],
	predicate: (stamp: Stamp | null, block: BlockNode) => boolean
): WalkMatch | null {
	let found: WalkMatch | null = null;
	walkBlocks(blocks, (block, path) => {
		if (predicate(getStamp(block), block)) {
			found = { block, path };
			return false; // Stop at the first match.
		}
	});
	return found;
}

/** Attributes considered user styling (migrated across layout transplants). */
export const USER_ATTR_KEYS = [
	'style',
	'className',
	'backgroundColor',
	'textColor',
	'gradient',
	'fontSize',
	'fontFamily',
	'borderColor',
	'align',
	'textAlign',
] as const;

export function pickUserAttributes(
	attributes: Record<string, unknown> = {}
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of USER_ATTR_KEYS) {
		if (attributes[key] !== undefined) {
			out[key] = attributes[key];
		}
	}
	// Migrate Blockera extension attributes (blockera*).
	for (const key of Object.keys(attributes)) {
		if (key.startsWith('blockera') && out[key] === undefined) {
			out[key] = attributes[key];
		}
	}
	return out;
}

/** Blockera extension attrs only — safe to keep across design/layout swaps. */
export function pickBlockeraExtensionAttributes(
	attributes: Record<string, unknown> = {}
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(attributes)) {
		if (key.startsWith('blockera')) {
			out[key] = attributes[key];
		}
	}
	return out;
}

export function mergeUserAttributes(
	targetAttrs: Record<string, unknown> = {},
	sourceAttrs: Record<string, unknown> = {}
): Record<string, unknown> {
	const user = pickUserAttributes(sourceAttrs);
	const merged = { ...targetAttrs, ...user };
	// Merge metadata shallowly; the target's stamp string wins when present.
	const targetMeta =
		targetAttrs.metadata && typeof targetAttrs.metadata === 'object'
			? (targetAttrs.metadata as Record<string, unknown>)
			: {};
	const sourceMeta =
		sourceAttrs.metadata && typeof sourceAttrs.metadata === 'object'
			? (sourceAttrs.metadata as Record<string, unknown>)
			: {};
	merged.metadata = {
		...sourceMeta,
		...targetMeta,
	};
	return merged;
}
