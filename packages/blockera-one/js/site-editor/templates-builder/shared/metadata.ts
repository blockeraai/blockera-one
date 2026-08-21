/**
 * Read / write the `metadata.blockeraOne` stamp string on block nodes.
 */

import { formatStamp, parseStamp, type Stamp, type StampRole } from './stamp';
import { withBlockeraCompatibility } from './blockera-attribute';
import type { BlockNode } from './types';

export function getStamp(block: BlockNode | null | undefined): Stamp | null {
	const metadata = block?.attributes?.metadata;
	if (!metadata || typeof metadata !== 'object') {
		return null;
	}
	return parseStamp((metadata as { blockeraOne?: unknown }).blockeraOne);
}

/** Gutenberg List View name (`metadata.name`) on a block, or empty. */
export function getMetaName(block: BlockNode | null | undefined): string {
	const metadata = block?.attributes?.metadata;
	if (!metadata || typeof metadata !== 'object') {
		return '';
	}
	const name = (metadata as { name?: unknown }).name;
	return typeof name === 'string' ? name.trim() : '';
}

/** Return a copy of the block re-stamped as `role/id` / `role/id:variant`. */
export function withStamp(
	block: BlockNode,
	role: StampRole,
	id: string,
	variant?: string | null
): BlockNode {
	const prevMeta =
		block.attributes?.metadata &&
		typeof block.attributes.metadata === 'object'
			? (block.attributes.metadata as Record<string, unknown>)
			: {};

	return {
		...block,
		attributes: withBlockeraCompatibility({
			...(block.attributes || {}),
			metadata: {
				...prevMeta,
				blockeraOne: formatStamp(role, id, variant),
			},
		}),
		innerBlocks: block.innerBlocks ? [...block.innerBlocks] : [],
	};
}
