/**
 * Icon / prefix / suffix parts on a Post Meta item wrapper.
 */

import {
	getBlockeraOneMeta,
	getStamp,
	withBlockeraOneMeta,
	withStamp,
} from '../../metadata';
import { findStampById, type StampLookupOptions } from '../../stamp-lookup';
import { findByStampWithin, replaceAtPath, type WalkMatch } from '../../tree';
import { withBlockeraCompatibility } from '../../blockera-attribute';
import type { BlockNode, ControlValue } from '../../types';
import {
	EMPTY_ICON_VALUE,
	META_ITEM_PART_IDS,
	META_SEPARATOR_ID,
	PART_ORDER,
	SPACE_FILLER_HTML,
	SPACE_FILLER_TEXT,
	type MetaItemPart,
	type ParkedParts,
} from './constants';
import { isMetaRowId, isSpaceFillerId } from './ids';
import {
	getMetaItemListName,
	META_PART_LIST_NAMES,
	SPACE_FILLER_LIST_NAME,
} from './names';

export function ensureSpaceFiller(
	blocks: BlockNode[],
	sectionId: string,
	lookup?: StampLookupOptions
): BlockNode[] {
	if (!isSpaceFillerId(sectionId)) {
		return blocks;
	}
	const match = findStampById(blocks, sectionId, lookup);
	if (!match) {
		return blocks;
	}
	const attrs: Record<string, unknown> = withBlockeraCompatibility({
		...(match.block.attributes || {}),
		blockeraFlexChildSizing: { value: 'grow' },
		blockeraWidth: { value: 'stretch' },
		content: SPACE_FILLER_TEXT,
		metadata: {
			...(metadataRecord(match.block) || {}),
			name: SPACE_FILLER_LIST_NAME,
		},
	});
	return replaceWrapper(blocks, match, {
		...match.block,
		attributes: attrs,
		originalContent: SPACE_FILLER_HTML,
	} as BlockNode);
}

export function findWithin(
	blocks: BlockNode[],
	ancestor: WalkMatch,
	id: string
): WalkMatch | null {
	return findByStampWithin(
		blocks,
		ancestor.path,
		(stamp) => stamp?.id === id
	);
}

function metadataRecord(
	block: BlockNode | null | undefined
): Record<string, unknown> | null {
	const metadata = block?.attributes?.metadata;
	if (!metadata || typeof metadata !== 'object') {
		return null;
	}
	return metadata as Record<string, unknown>;
}

export function getParked(block: BlockNode): ParkedParts {
	const parked = getBlockeraOneMeta(block)?.metaParts;
	if (!parked || typeof parked !== 'object' || Array.isArray(parked)) {
		return {};
	}
	return parked as ParkedParts;
}

export function withParked(block: BlockNode, parked: ParkedParts): BlockNode {
	const empty = Object.keys(parked).length === 0;
	return withBlockeraOneMeta(block, {
		metaParts: empty ? undefined : parked,
	});
}

export function paragraphContent(block: BlockNode | null | undefined): string {
	const raw = block?.attributes?.content;
	if (typeof raw === 'string') {
		return raw;
	}
	// WP 7.0 paragraph `content` is rich-text (object with `.text`), not a string.
	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		const text = (raw as { text?: unknown }).text;
		if (typeof text === 'string') {
			return text;
		}
		const html = (raw as { toHTMLString?: () => unknown }).toHTMLString;
		if (typeof html === 'function') {
			const out = html.call(raw);
			if (typeof out === 'string') {
				return out;
			}
		}
	}
	return '';
}

export function isEmptyIconValue(value: unknown): boolean {
	if (value === null || value === undefined || value === '') {
		return true;
	}
	if (typeof value !== 'object' || Array.isArray(value)) {
		return true;
	}
	const rec = value as Record<string, unknown>;
	const icon = typeof rec.icon === 'string' ? rec.icon : '';
	const svg = typeof rec.svgString === 'string' ? rec.svgString : '';
	const upload = rec.uploadSVG;
	const hasUpload =
		typeof upload === 'string'
			? upload !== ''
			: !!upload && typeof upload === 'object';
	return !icon && !svg && !hasUpload;
}

export function readIconValue(
	block: BlockNode | null | undefined
): Record<string, unknown> | null {
	const raw = block?.attributes?.blockeraIcon;
	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		const inner = (raw as { value?: unknown }).value;
		if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
			return inner as Record<string, unknown>;
		}
	}
	return null;
}

function escapeParagraphText(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

export function createParagraph(
	part: 'prefix' | 'suffix' | 'separator',
	text: string
): BlockNode {
	const id =
		part === 'separator' ? META_SEPARATOR_ID : META_ITEM_PART_IDS[part];
	const originalContent = `<p>${escapeParagraphText(text)}</p>`;
	// Gutenberg serialize only calls save() when `isValid` or innerBlocks
	// exist. Hand-built nodes have neither, so originalContent is the
	// `<p>…</p>` inner HTML parse expects (same shape as the PHP patterns).
	return withStamp(
		{
			name: 'core/paragraph',
			attributes: {
				content: text,
				metadata: { name: META_PART_LIST_NAMES[part] },
			},
			innerBlocks: [],
			originalContent,
		} as BlockNode,
		'container',
		id,
		'default'
	);
}

function createIconBlock(iconValue: Record<string, unknown>): BlockNode {
	const library =
		typeof iconValue.library === 'string' ? iconValue.library : '';
	const icon = typeof iconValue.icon === 'string' ? iconValue.icon : '';
	const attributes: Record<string, unknown> = {
		blockeraIcon: {
			value: {
				...EMPTY_ICON_VALUE,
				...iconValue,
			},
		},
		className: 'wp-block-icon-blockera',
		style: {
			dimensions: { width: '1em' },
		},
		metadata: { name: META_PART_LIST_NAMES.icon },
	};
	if (library === 'wp' && icon) {
		attributes.icon = icon.startsWith('core/') ? icon : `core/${icon}`;
	}
	return withStamp(
		{
			name: 'core/icon',
			attributes,
			innerBlocks: [],
		},
		'container',
		META_ITEM_PART_IDS.icon,
		'default'
	);
}

function canonicalInnerBlocks(children: BlockNode[]): BlockNode[] {
	const byPart: Partial<Record<(typeof PART_ORDER)[number], BlockNode>> = {};
	const rest: BlockNode[] = [];
	for (let i = 0; i < children.length; i++) {
		const id = getStamp(children[i])?.id;
		if (id === META_ITEM_PART_IDS.icon) {
			byPart.icon = children[i];
		} else if (id === META_ITEM_PART_IDS.prefix) {
			byPart.prefix = children[i];
		} else if (id === META_ITEM_PART_IDS.block) {
			byPart.block = children[i];
		} else if (id === META_ITEM_PART_IDS.suffix) {
			byPart.suffix = children[i];
		} else {
			rest.push(children[i]);
		}
	}
	const ordered: BlockNode[] = [];
	for (let i = 0; i < PART_ORDER.length; i++) {
		const part = byPart[PART_ORDER[i]];
		if (part) {
			ordered.push(part);
		}
	}
	return [...ordered, ...rest];
}

export function replaceWrapper(
	blocks: BlockNode[],
	wrapper: WalkMatch,
	next: BlockNode
): BlockNode[] {
	return replaceAtPath(blocks, wrapper.path, next);
}

function hasMetaItemBlock(block: BlockNode): boolean {
	const inner = block.innerBlocks || [];
	for (let i = 0; i < inner.length; i++) {
		if (getStamp(inner[i])?.id === META_ITEM_PART_IDS.block) {
			return true;
		}
	}
	return false;
}

function stripListName(block: BlockNode): BlockNode {
	const prevMeta = metadataRecord(block);
	if (!prevMeta || !('name' in prevMeta)) {
		return block;
	}
	const rest = { ...prevMeta };
	delete rest.name;
	return {
		...block,
		attributes: {
			...(block.attributes || {}),
			metadata: rest,
		},
		innerBlocks: block.innerBlocks ? [...block.innerBlocks] : [],
	};
}

function withItemListName(block: BlockNode, sectionId: string): BlockNode {
	const name = getMetaItemListName(sectionId);
	if (!name) {
		return block;
	}
	return {
		...block,
		attributes: {
			...(block.attributes || {}),
			metadata: {
				...(metadataRecord(block) || {}),
				name,
			},
		},
		innerBlocks: block.innerBlocks ? [...block.innerBlocks] : [],
	};
}

/**
 * Listing patterns still stamp `section/post-meta-*` on the void meta block
 * itself. Prefix/icon/suffix must live on a Row wrapper — serialize drops
 * innerBlocks of `core/post-date`.
 */
function ensureMetaItemWrapper(block: BlockNode, sectionId: string): BlockNode {
	if (block.name === 'core/group' && hasMetaItemBlock(block)) {
		return withItemListName(block, sectionId);
	}
	if (block.name === 'core/group') {
		const inner = [...(block.innerBlocks || [])];
		if (
			inner.length === 1 &&
			getStamp(inner[0])?.id !== META_ITEM_PART_IDS.block
		) {
			inner[0] = stripListName(
				withStamp(
					inner[0],
					'container',
					META_ITEM_PART_IDS.block,
					'default'
				)
			);
			return withItemListName(
				{ ...block, innerBlocks: inner },
				sectionId
			);
		}
		return withItemListName(block, sectionId);
	}
	const stamp = getStamp(block);
	const inner = stripListName(
		withStamp(
			block,
			'container',
			META_ITEM_PART_IDS.block,
			stamp?.variant || 'default'
		)
	);
	return withStamp(
		{
			name: 'core/group',
			attributes: {
				layout: {
					type: 'flex',
					flexWrap: 'nowrap',
					verticalAlignment: 'center',
				},
				style: { spacing: { blockGap: '0.35em' } },
				metadata: { name: getMetaItemListName(sectionId) },
			},
			innerBlocks: [inner],
		},
		'section',
		sectionId,
		stamp?.variant || 'default'
	);
}

export function setPartOnWrapper(
	wrapperBlock: BlockNode,
	part: MetaItemPart,
	value: ControlValue
): BlockNode {
	const sectionId = getStamp(wrapperBlock)?.id || '';
	if (sectionId && !isSpaceFillerId(sectionId) && !isMetaRowId(sectionId)) {
		wrapperBlock = ensureMetaItemWrapper(wrapperBlock, sectionId);
	}
	const children = [...(wrapperBlock.innerBlocks || [])];
	const partId = META_ITEM_PART_IDS[part];
	const nextChildren = children.filter(
		(child) => getStamp(child)?.id !== partId
	);
	const parked = { ...getParked(wrapperBlock) };
	const empty =
		part === 'icon'
			? isEmptyIconValue(value)
			: typeof value !== 'string' || value.trim() === '';

	if (empty) {
		const live = children.find((child) => getStamp(child)?.id === partId);
		if (live) {
			if (part === 'icon') {
				const icon = readIconValue(live);
				if (icon && !isEmptyIconValue(icon)) {
					parked.icon = icon;
				}
			} else {
				const text = paragraphContent(live);
				if (text) {
					parked[part] = text;
				}
			}
		}
		return withParked(
			{
				...wrapperBlock,
				innerBlocks: canonicalInnerBlocks(nextChildren),
			},
			parked
		);
	}

	let partBlock: BlockNode;
	if (part === 'icon') {
		const iconValue =
			value && typeof value === 'object' && !Array.isArray(value)
				? (value as Record<string, unknown>)
				: EMPTY_ICON_VALUE;
		partBlock = createIconBlock(iconValue);
		parked.icon = iconValue;
	} else {
		const text = String(value);
		partBlock = createParagraph(part, text);
		parked[part] = text;
	}
	nextChildren.push(partBlock);
	return withParked(
		{
			...wrapperBlock,
			innerBlocks: canonicalInnerBlocks(nextChildren),
		},
		parked
	);
}

export function setMetaItemPart(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		part: MetaItemPart;
		value: ControlValue;
		lookup?: StampLookupOptions;
	}
): BlockNode[] {
	const wrapper = findStampById(blocks, params.sectionId, params.lookup);
	if (!wrapper) {
		return blocks;
	}
	return replaceWrapper(
		blocks,
		wrapper,
		setPartOnWrapper(wrapper.block, params.part, params.value)
	);
}

export function readMetaItemPart(
	blocks: BlockNode[],
	sectionId: string,
	part: MetaItemPart,
	lookup?: StampLookupOptions
): ControlValue {
	const wrapper = findStampById(blocks, sectionId, lookup);
	if (!wrapper) {
		return part === 'icon' ? { ...EMPTY_ICON_VALUE } : '';
	}
	const match = findWithin(blocks, wrapper, META_ITEM_PART_IDS[part]);
	if (!match) {
		return part === 'icon' ? { ...EMPTY_ICON_VALUE } : '';
	}
	if (part === 'icon') {
		return readIconValue(match.block) || { ...EMPTY_ICON_VALUE };
	}
	return paragraphContent(match.block);
}
