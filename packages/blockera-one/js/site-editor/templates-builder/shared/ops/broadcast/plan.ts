/**
 * Exhaustive broadcast handlers + pure planner.
 */

import { parseBlocks } from '../../blocks-adapter';
import type { BlockNode, BroadcastId, ControlValue } from '../../types';
import { applyHeaderSticky } from './header-sticky';
import { applySidebarWidth } from './sidebar-width';

export type BroadcastHandler = (
	blocks: BlockNode[],
	value: ControlValue
) => BlockNode[] | null;

export const BROADCAST_HANDLERS = {
	'sidebar-width': applySidebarWidth,
	'header-sticky': applyHeaderSticky,
} satisfies Record<BroadcastId, BroadcastHandler>;

export type BroadcastRecord = {
	id?: string | number;
	content?: { raw?: string } | string;
	blocks?: BlockNode[];
};

export type BroadcastEdit = {
	id: string | number;
	blocks: BlockNode[];
};

function getContentRaw(record: BroadcastRecord): string {
	if (typeof record.content === 'string') {
		return record.content;
	}
	return record.content?.raw || '';
}

function getBlocksFromRecord(
	record: BroadcastRecord,
	parse: (html: string) => BlockNode[]
): BlockNode[] {
	if (Array.isArray(record.blocks) && record.blocks.length > 0) {
		return record.blocks as BlockNode[];
	}
	const raw = getContentRaw(record);
	return raw ? parse(raw) : [];
}

/**
 * Map template records to the trees a broadcast handler would rewrite.
 * Pure: no core-data. Records without a matching stamp are skipped.
 */
export function planBroadcastEdits(
	records: BroadcastRecord[],
	broadcastId: BroadcastId,
	value: ControlValue,
	parse: (html: string) => BlockNode[] = parseBlocks
): BroadcastEdit[] {
	const handler = BROADCAST_HANDLERS[broadcastId];
	if (!handler) {
		return [];
	}
	const edits: BroadcastEdit[] = [];
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		if (record.id === undefined || record.id === null || record.id === '') {
			continue;
		}
		const blocks = getBlocksFromRecord(record, parse);
		const next = handler(blocks, value);
		if (!next) {
			continue;
		}
		edits.push({ id: record.id, blocks: next });
	}
	return edits;
}
