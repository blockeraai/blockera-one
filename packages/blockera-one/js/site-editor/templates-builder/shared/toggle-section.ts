/**
 * Toggle a section off (remove) or on (insert the default variant).
 * Removal is destructive by design — no parked backup is kept.
 */

import { getStamp, withStamp } from './metadata';
import { insertAtPlacement, type OpsContext } from './op-context';
import { resolveSectionState } from './resolve/resolve-state';
import type { StampLookupOptions } from './stamp-lookup';
import { findByStamp, getAtPath, insertRelative, removeAtPath } from './tree';
import type { BlockNode, InsertRule, VariantDef } from './types';
import { prepareInsertedBlocks } from './blockera-attribute';

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
	const state = resolveSectionState(blocks, params.sectionId, [], ctx.lookup);

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

	restoreBlocks = prepareInsertedBlocks([
		withStamp(
			restoreBlocks[0],
			'section',
			params.sectionId,
			params.defaultVariant.id ||
				getStamp(restoreBlocks[0])?.variant ||
				'default'
		),
		...restoreBlocks.slice(1),
	]);

	// Variant placement wins; the control-level insert rule is the fallback.
	const insertRule = params.defaultVariant.placement || params.insert;
	if (insertRule) {
		restoreBlocks = alignInsertedWithParent(
			blocks,
			insertRule.relativeTo,
			restoreBlocks,
			ctx.lookup
		);
		const placed = insertAtPlacement(
			blocks,
			insertRule,
			restoreBlocks,
			ctx.lookup
		);
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
 * Banner page-header children are centered; copy that onto inserted blocks
 * so a toggled-back title matches the active design.
 */
function alignInsertedWithParent(
	blocks: BlockNode[],
	parentId: string,
	insertBlocks: BlockNode[],
	lookup?: StampLookupOptions
): BlockNode[] {
	const parent = resolveSectionState(blocks, parentId, [], lookup);
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
