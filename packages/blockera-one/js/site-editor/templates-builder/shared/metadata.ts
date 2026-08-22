/**
 * Read / write `metadata.blockeraOne` on block nodes.
 *
 * The value is an object: `{ stamp, metaParts?, metaSeparator?, ... }`.
 * Stamp grammar (`role/id` / `role/id:variant`) lives in `stamp.ts`.
 */

import { formatStamp, parseStamp, type Stamp, type StampRole } from './stamp';
import { withBlockeraCompatibility } from './blockera-attribute';
import type { BlockNode } from './types';
import type { MetaSeparatorOption, ParkedParts } from './ops/meta/constants';

export type BlockeraOneMeta = {
	stamp?: string;
	metaParts?: ParkedParts;
	metaSeparator?: MetaSeparatorOption;
	[key: string]: unknown;
};

function metadataRecord(
	block: BlockNode | null | undefined
): Record<string, unknown> | null {
	const metadata = block?.attributes?.metadata;
	if (!metadata || typeof metadata !== 'object') {
		return null;
	}
	return metadata as Record<string, unknown>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isEmptyParked(parts: unknown): boolean {
	return !isPlainObject(parts) || Object.keys(parts).length === 0;
}

/** `metadata.blockeraOne` object, or null when missing / not an object. */
export function getBlockeraOneMeta(
	block: BlockNode | null | undefined
): BlockeraOneMeta | null {
	const raw = metadataRecord(block)?.blockeraOne;
	if (!isPlainObject(raw)) {
		return null;
	}
	return raw as BlockeraOneMeta;
}

function compactBlockeraOneMeta(
	meta: Record<string, unknown>
): BlockeraOneMeta {
	const next: BlockeraOneMeta = {};
	if (typeof meta.stamp === 'string') {
		next.stamp = meta.stamp;
	}
	for (const key of Object.keys(meta)) {
		if (key === 'stamp' || key === 'metaParts' || key === 'metaSeparator') {
			continue;
		}
		if (meta[key] !== undefined) {
			next[key] = meta[key];
		}
	}
	if (!isEmptyParked(meta.metaParts)) {
		next.metaParts = meta.metaParts as ParkedParts;
	}
	if (meta.metaSeparator !== undefined) {
		next.metaSeparator = meta.metaSeparator as MetaSeparatorOption;
	}
	return next;
}

/**
 * Shallow-merge a patch into `metadata.blockeraOne`.
 * `undefined` patch values delete that key. Empty `metaParts` is omitted.
 */
export function withBlockeraOneMeta(
	block: BlockNode,
	patch: BlockeraOneMeta
): BlockNode {
	const prevMeta = metadataRecord(block) || {};
	const prev = getBlockeraOneMeta(block) || {};
	const merged: Record<string, unknown> = { ...prev };
	for (const key of Object.keys(patch)) {
		if (patch[key] === undefined) {
			delete merged[key];
		} else {
			merged[key] = patch[key];
		}
	}

	return {
		...block,
		attributes: {
			...(block.attributes || {}),
			metadata: {
				...prevMeta,
				blockeraOne: compactBlockeraOneMeta(merged),
			},
		},
		innerBlocks: block.innerBlocks ? [...block.innerBlocks] : [],
	};
}

export function getStamp(block: BlockNode | null | undefined): Stamp | null {
	return parseStamp(getBlockeraOneMeta(block)?.stamp);
}

/** Gutenberg List View name (`metadata.name`) on a block, or empty. */
export function getMetaName(block: BlockNode | null | undefined): string {
	const name = metadataRecord(block)?.name;
	return typeof name === 'string' ? name.trim() : '';
}

/** Return a copy of the block re-stamped as `role/id` / `role/id:variant`. */
export function withStamp(
	block: BlockNode,
	role: StampRole,
	id: string,
	variant?: string | null
): BlockNode {
	const next = withBlockeraOneMeta(block, {
		stamp: formatStamp(role, id, variant),
	});
	return {
		...next,
		attributes: withBlockeraCompatibility({
			...(next.attributes || {}),
		}),
	};
}
