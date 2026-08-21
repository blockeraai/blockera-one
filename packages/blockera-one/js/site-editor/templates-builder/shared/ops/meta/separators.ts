/**
 * Separator paragraphs between Post Meta row items.
 */

import { getStamp } from '../../metadata';
import { findStampById, type StampLookupOptions } from '../../stamp-lookup';
import type { BlockNode } from '../../types';
import {
	META_SEPARATOR_ID,
	META_SEPARATOR_OPTIONS,
	SEPARATOR_META_KEY,
	type MetaSeparatorOption,
} from './constants';
import { isSpaceFillerId } from './ids';
import {
	createParagraph,
	findWithin,
	paragraphContent,
	replaceWrapper,
} from './parts';

export function rowItemChildren(row: BlockNode): BlockNode[] {
	const inner = row.innerBlocks || [];
	const items: BlockNode[] = [];
	for (let i = 0; i < inner.length; i++) {
		const stamp = getStamp(inner[i]);
		if (!stamp || stamp.id === META_SEPARATOR_ID) {
			continue;
		}
		if (stamp.role === 'section') {
			items.push(inner[i]);
		}
	}
	return items;
}

function isSeparatorOption(value: unknown): value is MetaSeparatorOption {
	return (
		value === 'none' ||
		value === 'slash' ||
		value === 'dash' ||
		value === 'bullet'
	);
}

function optionFromChar(text: string): MetaSeparatorOption | null {
	if (!text) {
		return 'none';
	}
	const options = Object.keys(
		META_SEPARATOR_OPTIONS
	) as MetaSeparatorOption[];
	for (let i = 0; i < options.length; i++) {
		if (META_SEPARATOR_OPTIONS[options[i]] === text) {
			return options[i];
		}
	}
	return null;
}

function readStoredSeparator(row: BlockNode): MetaSeparatorOption | null {
	const metadata = row.attributes?.metadata;
	if (!metadata || typeof metadata !== 'object') {
		return null;
	}
	const stored = (metadata as Record<string, unknown>)[SEPARATOR_META_KEY];
	return isSeparatorOption(stored) ? stored : null;
}

function withStoredSeparator(
	row: BlockNode,
	option: MetaSeparatorOption
): BlockNode {
	const prevMeta =
		row.attributes?.metadata && typeof row.attributes.metadata === 'object'
			? (row.attributes.metadata as Record<string, unknown>)
			: {};
	return {
		...row,
		attributes: {
			...(row.attributes || {}),
			metadata: {
				...prevMeta,
				[SEPARATOR_META_KEY]: option,
			},
		},
		innerBlocks: row.innerBlocks ? [...row.innerBlocks] : [],
	};
}

export function readMetaSeparatorOption(
	blocks: BlockNode[],
	rowId: string,
	lookup?: StampLookupOptions
): MetaSeparatorOption | null {
	const row = findStampById(blocks, rowId, lookup);
	const stored = row ? readStoredSeparator(row.block) : null;
	if (stored !== null) {
		return stored;
	}
	return optionFromChar(readMetaSeparatorChar(blocks, rowId, lookup));
}

export function readMetaSeparatorChar(
	blocks: BlockNode[],
	rowId: string,
	lookup?: StampLookupOptions
): string {
	const row = findStampById(blocks, rowId, lookup);
	if (!row) {
		return '';
	}
	const sep = findWithin(blocks, row, META_SEPARATOR_ID);
	if (!sep) {
		return '';
	}
	return paragraphContent(sep.block).trim();
}

export function syncMetaSeparators(
	blocks: BlockNode[],
	rowId: string,
	separator?: MetaSeparatorOption | null,
	lookup?: StampLookupOptions
): BlockNode[] {
	const row = findStampById(blocks, rowId, lookup);
	if (!row) {
		return blocks;
	}
	let preferred: MetaSeparatorOption | null | undefined = separator;
	if (preferred === undefined) {
		preferred = readStoredSeparator(row.block);
	}
	let char = '';
	if (preferred && preferred !== 'none') {
		char = META_SEPARATOR_OPTIONS[preferred] || '';
	} else if (preferred === undefined || preferred === null) {
		char = readMetaSeparatorChar(blocks, rowId, lookup);
		preferred = optionFromChar(char);
	}
	const items = rowItemChildren(row.block);
	let nextRow = row.block;
	if (isSeparatorOption(preferred)) {
		nextRow = withStoredSeparator(nextRow, preferred);
	}
	if (!char || items.length < 2) {
		return replaceWrapper(blocks, row, {
			...nextRow,
			innerBlocks: items,
		});
	}

	const nextInner: BlockNode[] = [];
	for (let i = 0; i < items.length; i++) {
		if (i > 0) {
			const prevId = getStamp(items[i - 1])?.id || '';
			const currId = getStamp(items[i])?.id || '';
			if (!isSpaceFillerId(prevId) && !isSpaceFillerId(currId)) {
				nextInner.push(createParagraph('separator', char));
			}
		}
		nextInner.push(items[i]);
	}
	return replaceWrapper(blocks, row, {
		...nextRow,
		innerBlocks: nextInner,
	});
}
