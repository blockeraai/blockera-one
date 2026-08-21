/**
 * Bridge between @wordpress/blocks parse/serialize and our BlockNode ops.
 *
 * IMPORTANT: Do not strip parsed blocks down to {name,attributes,innerBlocks}.
 * Dropping originalContent / isValid causes serialize→parse round-trips to mark
 * blocks (e.g. core/paragraph) as invalid and show the recovery UI.
 */

import * as blocksPackage from '@wordpress/blocks';

import type { BlockNode } from './types';
import type { OpsContext } from './op-context';

const wpParse = blocksPackage.parse;
const wpSerialize = blocksPackage.serialize;

export function parseBlocks(html: string): BlockNode[] {
	// Keep the full parsed block objects (including originalContent / isValid).
	return wpParse(html) as BlockNode[];
}

export function serializeBlocks(blocks: BlockNode[]): string {
	return wpSerialize(blocks as never);
}

export function serializeAndClean(blocks: BlockNode[]): string {
	const clean = (
		blocksPackage as typeof blocksPackage & {
			__unstableSerializeAndClean?: (b: unknown) => string;
		}
	).__unstableSerializeAndClean;
	if (typeof clean === 'function') {
		return clean(blocks);
	}
	return serializeBlocks(blocks);
}

/**
 * Prepare entity edits: serialize then re-parse so the editor receives
 * freshly validated blocks with matching originalContent.
 */
export function toEntityEdits(blocks: BlockNode[]): {
	blocks: BlockNode[];
	content: string;
} {
	const content = serializeAndClean(blocks);
	const parsed = wpParse(content) as BlockNode[];
	return {
		blocks: parsed,
		content,
	};
}

export const defaultOpsContext: OpsContext = {
	parse: parseBlocks,
	serialize: serializeBlocks,
};
