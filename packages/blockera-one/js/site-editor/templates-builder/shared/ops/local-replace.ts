/**
 * Detect an in-place section swap so the editor can REPLACE_BLOCKS that
 * one clientId instead of resetting the whole canvas.
 */

import { resolveSectionState } from '../resolve/resolve-state';
import type { StampLookupOptions } from '../stamp-lookup';
import { getAtPath } from '../tree';
import type { BlockNode } from '../types';

export type LocalReplace = {
	clientId?: string;
	blocks: BlockNode[];
	/** Present when the stamp moved: insert into this parent instead of splicing in place. */
	destParentClientId?: string;
	destIndex?: number;
	/** Shuffle this parent's live innerBlocks to match `blocks` order. */
	reorderParentClientId?: string;
	/** Attribute-only writes; apply via updateBlockAttributes. */
	attributeUpdates?: Array<{
		clientId: string;
		attributes: Record<string, unknown>;
	}>;
	/** Nested inner/attr patches (meta separators, item design). */
	innerPatches?: Array<{
		clientId: string;
		innerBlocks?: BlockNode[];
		attributes?: Record<string, unknown>;
	}>;
};

function pathKey(path: number[]): string {
	return path.join('.');
}

function isStrictPrefix(prefix: number[], path: number[]): boolean {
	if (prefix.length >= path.length) {
		return false;
	}
	for (let i = 0; i < prefix.length; i++) {
		if (prefix[i] !== path[i]) {
			return false;
		}
	}
	return true;
}

/**
 * True when `next` only differs from `prev` at `replacePath` (ancestors may
 * be new objects with the same clientId; every other node is the same ref).
 */
export function isUnchangedOutsidePath(
	prev: BlockNode[],
	next: BlockNode[],
	replacePath: number[]
): boolean {
	const walk = (
		a: BlockNode[],
		b: BlockNode[],
		prefix: number[]
	): boolean => {
		if (a.length !== b.length) {
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			const path = [...prefix, i];
			if (pathKey(path) === pathKey(replacePath)) {
				continue;
			}
			if (isStrictPrefix(path, replacePath)) {
				const prevId = a[i].clientId;
				const nextId = b[i].clientId;
				if (prevId && nextId && prevId !== nextId) {
					return false;
				}
				if (
					!walk(a[i].innerBlocks || [], b[i].innerBlocks || [], path)
				) {
					return false;
				}
				continue;
			}
			if (a[i] !== b[i]) {
				return false;
			}
		}
		return true;
	};
	return walk(prev, next, []);
}

function isPrefixOrEqual(prefix: number[], path: number[]): boolean {
	if (prefix.length > path.length) {
		return false;
	}
	for (let i = 0; i < prefix.length; i++) {
		if (prefix[i] !== path[i]) {
			return false;
		}
	}
	return true;
}

/**
 * True when only one child was added or removed at `childPath`'s parent
 * and every other node is the same object reference.
 */
export function isUnchangedExceptChild(
	prev: BlockNode[],
	next: BlockNode[],
	childPath: number[],
	mode: 'remove' | 'insert'
): boolean {
	if (childPath.length === 0) {
		return false;
	}
	const parentPath = childPath.slice(0, -1);
	const skipIndex = childPath[childPath.length - 1];
	const walk = (
		a: BlockNode[],
		b: BlockNode[],
		prefix: number[]
	): boolean => {
		if (pathKey(prefix) === pathKey(parentPath)) {
			const skipA = mode === 'remove' ? skipIndex : undefined;
			const skipB = mode === 'insert' ? skipIndex : undefined;
			const keepA = a.filter((_, i) => i !== skipA);
			const keepB = b.filter((_, i) => i !== skipB);
			if (keepA.length !== keepB.length) {
				return false;
			}
			for (let i = 0; i < keepA.length; i++) {
				if (keepA[i] !== keepB[i]) {
					return false;
				}
			}
			return true;
		}
		if (a.length !== b.length) {
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			const path = [...prefix, i];
			if (
				isStrictPrefix(path, parentPath) ||
				pathKey(path) === pathKey(parentPath)
			) {
				const prevId = a[i].clientId;
				const nextId = b[i].clientId;
				if (prevId && nextId && prevId !== nextId) {
					return false;
				}
				if (
					!walk(a[i].innerBlocks || [], b[i].innerBlocks || [], path)
				) {
					return false;
				}
				continue;
			}
			if (a[i] !== b[i]) {
				return false;
			}
		}
		return true;
	};
	return walk(prev, next, []);
}

function sameRefPermutation(a: BlockNode[], b: BlockNode[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	const used = new Array(a.length).fill(false);
	for (let j = 0; j < b.length; j++) {
		let found = false;
		for (let i = 0; i < a.length; i++) {
			if (!used[i] && a[i] === b[j]) {
				used[i] = true;
				found = true;
				break;
			}
		}
		if (!found) {
			return false;
		}
	}
	return true;
}

/**
 * True when only the innerBlocks order of the node at `parentPath` changed
 * (same child refs, possibly permuted) and every other node is unchanged.
 */
export function isUnchangedExceptInnerOrder(
	prev: BlockNode[],
	next: BlockNode[],
	parentPath: number[]
): boolean {
	const walk = (
		a: BlockNode[],
		b: BlockNode[],
		prefix: number[]
	): boolean => {
		if (pathKey(prefix) === pathKey(parentPath)) {
			return sameRefPermutation(a, b);
		}
		if (a.length !== b.length) {
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			const path = [...prefix, i];
			if (
				isStrictPrefix(path, parentPath) ||
				pathKey(path) === pathKey(parentPath)
			) {
				const prevId = a[i].clientId;
				const nextId = b[i].clientId;
				if (prevId && nextId && prevId !== nextId) {
					return false;
				}
				if (
					!walk(a[i].innerBlocks || [], b[i].innerBlocks || [], path)
				) {
					return false;
				}
				continue;
			}
			if (a[i] !== b[i]) {
				return false;
			}
		}
		return true;
	};
	return walk(prev, next, []);
}

/**
 * Parent of the higher (shallower) placement when one path is an ancestor of
 * the other; otherwise the shared ancestor. Empty = root-level rewrite.
 */
export function relocateLcaPath(
	prevPath: number[],
	nextPath: number[]
): number[] {
	if (
		isPrefixOrEqual(prevPath, nextPath) &&
		prevPath.length < nextPath.length
	) {
		return prevPath.slice(0, -1);
	}
	if (
		isPrefixOrEqual(nextPath, prevPath) &&
		nextPath.length < prevPath.length
	) {
		return nextPath.slice(0, -1);
	}
	const n = Math.min(prevPath.length, nextPath.length);
	let i = 0;
	while (i < n && prevPath[i] === nextPath[i]) {
		i += 1;
	}
	return prevPath.slice(0, i);
}

function destParentClientIdFromNext(
	next: BlockNode[],
	nextPath: number[]
): string | undefined {
	if (nextPath.length === 0) {
		return undefined;
	}
	if (nextPath.length === 1) {
		return '';
	}
	const parent = getAtPath(next, nextPath.slice(0, -1));
	return typeof parent?.clientId === 'string' ? parent.clientId : undefined;
}

/**
 * When a stamp stays at the same path and nothing else in the tree moved,
 * return the live clientId plus the replacement subtree.
 */
export function localReplaceForSection(
	prev: BlockNode[],
	next: BlockNode[],
	sectionId: string,
	lookup?: StampLookupOptions
): LocalReplace | undefined {
	const prevState = resolveSectionState(prev, sectionId, [], lookup);
	const nextState = resolveSectionState(next, sectionId, [], lookup);
	if (!prevState.path || !nextState.path) {
		return undefined;
	}
	if (pathKey(prevState.path) !== pathKey(nextState.path)) {
		const oldMoved = getAtPath(prev, prevState.path);
		const newMoved = getAtPath(next, nextState.path);
		const lcaPath = relocateLcaPath(prevState.path, nextState.path);
		const destParentClientId = destParentClientIdFromNext(
			next,
			nextState.path
		);
		const destIndex = nextState.path[nextState.path.length - 1];
		if (
			oldMoved?.clientId &&
			newMoved &&
			lcaPath.length > 0 &&
			destParentClientId !== undefined &&
			typeof destIndex === 'number' &&
			isUnchangedOutsidePath(prev, next, lcaPath)
		) {
			return {
				clientId: oldMoved.clientId,
				blocks: [newMoved],
				destParentClientId,
				destIndex,
			};
		}
		return undefined;
	}
	const oldNode = getAtPath(prev, prevState.path);
	const newNode = getAtPath(next, nextState.path);
	if (!oldNode?.clientId || !newNode) {
		return undefined;
	}
	if (!isUnchangedOutsidePath(prev, next, prevState.path)) {
		return undefined;
	}
	return { clientId: oldNode.clientId, blocks: [newNode] };
}

/**
 * Toggle off = splice that clientId out. Toggle on = insert the new stamp
 * into the live parent at destIndex. Ancestors may be new objects.
 */
export function localToggleForSection(
	prev: BlockNode[],
	next: BlockNode[],
	sectionId: string,
	lookup?: StampLookupOptions
): LocalReplace | undefined {
	const prevState = resolveSectionState(prev, sectionId, [], lookup);
	const nextState = resolveSectionState(next, sectionId, [], lookup);
	if (!!prevState.path === !!nextState.path) {
		return undefined;
	}
	if (prevState.path && !nextState.path) {
		const ok = isUnchangedExceptChild(prev, next, prevState.path, 'remove');
		const oldNode = getAtPath(prev, prevState.path);
		if (!ok || !oldNode?.clientId) {
			return undefined;
		}
		return { clientId: oldNode.clientId, blocks: [] };
	}
	if (!prevState.path && nextState.path) {
		const ok = isUnchangedExceptChild(prev, next, nextState.path, 'insert');
		const newNode = getAtPath(next, nextState.path);
		const destParentClientId = destParentClientIdFromNext(
			next,
			nextState.path
		);
		const destIndex = nextState.path[nextState.path.length - 1];
		const parentNeedsId = nextState.path.length > 1;
		if (!ok || !newNode) {
			return undefined;
		}
		if (parentNeedsId && typeof destParentClientId !== 'string') {
			return undefined;
		}
		return {
			blocks: [newNode],
			destParentClientId,
			destIndex,
		};
	}
	return undefined;
}

/**
 * Same-parent inner shuffle: live children stay as-is, only order changes.
 */
export function localReorderForParent(
	prev: BlockNode[],
	next: BlockNode[],
	parentId: string,
	lookup?: StampLookupOptions
): LocalReplace | undefined {
	const prevParent = resolveSectionState(prev, parentId, [], lookup);
	const nextParent = resolveSectionState(next, parentId, [], lookup);
	if (!prevParent.path || !nextParent.path) {
		return undefined;
	}
	if (pathKey(prevParent.path) !== pathKey(nextParent.path)) {
		return undefined;
	}
	const ok = isUnchangedExceptInnerOrder(prev, next, prevParent.path);
	const parentNode = getAtPath(next, nextParent.path);
	const prevNode = getAtPath(prev, prevParent.path);
	const nextInner = parentNode?.innerBlocks || [];
	const prevInner = prevNode?.innerBlocks || [];
	const sameOrder =
		prevInner.length === nextInner.length &&
		prevInner.every((child, i) => child === nextInner[i]);
	if (!ok || !parentNode?.clientId || sameOrder) {
		return undefined;
	}
	return {
		blocks: nextInner,
		reorderParentClientId: parentNode.clientId,
	};
}

/**
 * Attribute-only edits: same tree shape and innerBlock refs, new attribute
 * objects on one or more nodes (setSectionAttribute / setBlockStyle).
 */
export function localAttributeUpdates(
	prev: BlockNode[],
	next: BlockNode[]
): LocalReplace | undefined {
	const updates: NonNullable<LocalReplace['attributeUpdates']> = [];
	const walk = (a: BlockNode[], b: BlockNode[]): boolean => {
		if (a.length !== b.length) {
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			if (a[i] === b[i]) {
				continue;
			}
			const prevId = a[i].clientId;
			const nextId = b[i].clientId;
			if (prevId && nextId && prevId !== nextId) {
				return false;
			}
			if (a[i].name !== b[i].name) {
				return false;
			}
			const innerA = a[i].innerBlocks || [];
			const innerB = b[i].innerBlocks || [];
			if (a[i].attributes !== b[i].attributes) {
				if (!nextId) {
					return false;
				}
				updates.push({
					clientId: nextId,
					attributes: {
						...((b[i].attributes || {}) as Record<string, unknown>),
					},
				});
			}
			if (innerA === innerB) {
				continue;
			}
			if (!walk(innerA, innerB)) {
				return false;
			}
		}
		return true;
	};
	const ok = walk(prev, next);
	if (!ok || !updates.length) {
		return undefined;
	}
	return { blocks: [], attributeUpdates: updates };
}

function copyAttributes(node: BlockNode): Record<string, unknown> {
	return { ...((node.attributes || {}) as Record<string, unknown>) };
}

/**
 * Nested inner/attribute patches when a row rebuilds children (separators)
 * or item wrappers gain/lose parts (Items Design) without moving the rest
 * of the template.
 */
export function localInnerPatches(
	prev: BlockNode[],
	next: BlockNode[]
): LocalReplace | undefined {
	const patches: NonNullable<LocalReplace['innerPatches']> = [];
	let failReason = '';
	const walkList = (a: BlockNode[], b: BlockNode[]): boolean => {
		if (a.length !== b.length) {
			failReason = `length:${a.length}->${b.length}`;
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			if (a[i] === b[i]) {
				continue;
			}
			const prevId = a[i].clientId;
			const nextId = b[i].clientId;
			const id = nextId || prevId;
			if (!id || (prevId && nextId && prevId !== nextId)) {
				failReason = 'clientId';
				return false;
			}
			if (a[i].name !== b[i].name) {
				failReason = 'name';
				return false;
			}
			const innerA = a[i].innerBlocks || [];
			const innerB = b[i].innerBlocks || [];
			const attrsChanged = a[i].attributes !== b[i].attributes;
			if (innerA.length !== innerB.length) {
				patches.push({
					clientId: id,
					innerBlocks: innerB,
					...(attrsChanged
						? { attributes: copyAttributes(b[i]) }
						: {}),
				});
				continue;
			}
			if (!walkList(innerA, innerB)) {
				if (failReason === 'clientId' || failReason === 'name') {
					patches.push({
						clientId: id,
						innerBlocks: innerB,
						...(attrsChanged
							? { attributes: copyAttributes(b[i]) }
							: {}),
					});
					failReason = '';
					continue;
				}
				return false;
			}
			if (attrsChanged) {
				patches.push({
					clientId: id,
					attributes: copyAttributes(b[i]),
				});
			}
		}
		return true;
	};
	const ok = walkList(prev, next);
	if (!ok || !patches.length) {
		return undefined;
	}
	return { blocks: [], innerPatches: patches };
}
