/**
 * Apply a Blockera extension attribute the same way the block inspector does:
 * assign blockeraId, persist `blockera-block` class names (style-engine
 * selectors), write `{ value }`, then run `blockera.blockEdit.setAttributes`
 * for WP compatibility when the block supports it (e.g. group gap →
 * style.spacing.blockGap).
 */

import { getBlockType } from '@wordpress/blocks';
import { applyFilters } from '@wordpress/hooks';
import {
	getAttributesWithIds,
	withBlockeraBlockClassFromId,
	isBlockeraBlockModeBasic,
	normalizeBlockeraIds,
} from '@blockera/utils';

import type { BlockNode } from './types';

/**
 * Style-engine CSS targets `.blockera-block-{blockeraId}`. The inspector
 * adds this via BlockEdit; templates-builder writes must persist the same
 * token or generated styles never attach.
 */
function withBlockeraBlockClassName(
	attributes: Record<string, unknown>
): Record<string, unknown> {
	return withBlockeraBlockClassFromId(attributes) as Record<string, unknown>;
}

const BLOCKERA_ID_KEYS: Record<string, true> = {
	blockeraId: true,
	blockeraPropsId: true,
	blockeraCompatId: true,
	blockeraBlockMode: true,
};

function valuesEqual(left: unknown, right: unknown): boolean {
	if (left === right) {
		return true;
	}
	if (
		left === undefined ||
		right === undefined ||
		left === null ||
		right === null ||
		typeof left !== 'object' ||
		typeof right !== 'object'
	) {
		return false;
	}
	try {
		return JSON.stringify(left) === JSON.stringify(right);
	} catch (_err) {
		return false;
	}
}

function schemaDefault(blockName: string | undefined, key: string): unknown {
	if (!blockName || typeof getBlockType !== 'function') {
		return undefined;
	}
	const blockType = getBlockType(blockName);
	const attribute = (
		blockType?.attributes as
			Record<string, { default?: unknown }> | undefined
	)?.[key];
	if (!attribute || typeof attribute !== 'object') {
		return undefined;
	}
	return attribute.default;
}

/**
 * True when the block stores a real Blockera extension value (not just
 * stamp metadata, empty id keys, or Gutenberg-filled schema defaults).
 */
export function hasBlockeraExtensionAttributes(
	attributes: Record<string, unknown> | undefined,
	blockName?: string
): boolean {
	if (!attributes) {
		return false;
	}
	for (const key in attributes) {
		if (!key.startsWith('blockera') || BLOCKERA_ID_KEYS[key]) {
			continue;
		}
		const value = attributes[key];
		if (value === undefined || value === null || value === '') {
			continue;
		}
		const fallback = schemaDefault(blockName, key);
		if (fallback !== undefined && valuesEqual(value, fallback)) {
			continue;
		}
		return true;
	}
	return false;
}

function omitOrphanBlockeraIds(
	attributes: Record<string, unknown>
): Record<string, unknown> {
	if (
		attributes.blockeraId === undefined &&
		attributes.blockeraPropsId === undefined &&
		attributes.blockeraCompatId === undefined
	) {
		return attributes;
	}
	const next = { ...attributes };
	delete next.blockeraId;
	delete next.blockeraPropsId;
	delete next.blockeraCompatId;
	return next;
}

/**
 * Blockera style-engine selectors need `blockeraId`
 * plus `blockera-block` / `blockera-block-{id}` class tokens — but only when
 * the block actually has extension attributes. Inspector writes get this via
 * `applyBlockeraInspectorAttribute`; inserted builder blocks must too or
 * generated CSS never attaches. Stamps / WP layout alone must not persist ids.
 */
export function withBlockeraCompatibility(
	attributes: Record<string, unknown>,
	blockName?: string
): Record<string, unknown> {
	let next = normalizeBlockeraIds({ ...attributes });
	if (
		!hasBlockeraExtensionAttributes(next, blockName) ||
		isBlockeraBlockModeBasic(next)
	) {
		return omitOrphanBlockeraIds(next);
	}
	next = getAttributesWithIds(next, 'blockeraId') as Record<string, unknown>;
	return withBlockeraBlockClassName(next);
}

/**
 * Walk an inserted tree: stamp ids/classes on nodes with Blockera extension
 * attributes, and drop orphan id keys WordPress parse fills as empty defaults.
 */
export function prepareInsertedBlocks(blocks: BlockNode[]): BlockNode[] {
	return blocks.map((block) => ({
		...block,
		attributes: withBlockeraCompatibility(
			(block.attributes || {}) as Record<string, unknown>,
			block.name
		),
		innerBlocks: prepareInsertedBlocks(block.innerBlocks || []),
	}));
}

function inspectorAttributeId(attributePath: string): string | null {
	const [id] = attributePath.split('.');
	if (
		!id ||
		!id.startsWith('blockera') ||
		id === 'blockeraOne' ||
		id === 'blockeraId' ||
		id === 'blockeraPropsId' ||
		id === 'blockeraCompatId' ||
		id === 'blockeraBlockMode'
	) {
		return null;
	}
	return id;
}

/** First segment of a Blockera extension path (`blockeraFontColor.value` → `blockeraFontColor`). */
export function getBlockeraAttributeId(attributePath: string): string | null {
	return inspectorAttributeId(attributePath);
}

/**
 * Whether this nested path is a Blockera extension write that must go through
 * the inspector setAttributes pipeline (not a generic nested object set).
 */
export function isBlockeraExtensionPath(attributePath: string): boolean {
	return getBlockeraAttributeId(attributePath) !== null;
}

/**
 * Return attributes after an inspector-equivalent Blockera attribute change.
 */
export function applyBlockeraInspectorAttribute(
	attributes: Record<string, unknown>,
	attributePath: string,
	newValue: unknown,
	blockName: string
): Record<string, unknown> {
	const attributeId = inspectorAttributeId(attributePath);
	if (!attributeId) {
		return attributes;
	}

	// Write the extension value first so compatibility ids attach (ids are
	// only persisted when a real Blockera attribute is present).
	const next: Record<string, unknown> = withBlockeraCompatibility(
		{
			...attributes,
			[attributeId]: { value: newValue },
		},
		blockName
	);

	const blockType =
		typeof getBlockType === 'function'
			? getBlockType(blockName)
			: undefined;
	const blockAttributes =
		(blockType?.attributes as Record<string, unknown> | undefined) || {};

	const ref = { action: 'normal', reset: false };
	const blockDetail = {
		blockId: blockName,
		isNormalState: true,
		isMasterBlock: true,
		isBaseBreakpoint: true,
		isMasterNormalState: true,
		insideBlockInspector: true,
		currentBlock: 'master',
		currentState: 'normal',
		currentBreakpoint: 'desktop',
		currentInnerBlockState: 'normal',
		blockAttributes,
		blockVariations: [],
		activeBlockVariation: {},
		innerBlocks: {},
		getActiveBlockVariation: () => false,
	};

	const filtered = applyFilters(
		'blockera.blockEdit.setAttributes',
		next,
		attributeId,
		newValue,
		ref,
		() => next,
		blockDetail
	);

	const result =
		filtered && typeof filtered === 'object'
			? (filtered as Record<string, unknown>)
			: next;

	// Gutenberg useBlockProps calls style.marginTop.charAt() — objects/numbers crash.
	return sanitizeWpSpacingStyle(result);
}

const SPACING_SIDES = ['top', 'right', 'bottom', 'left'] as const;

/**
 * Coerce WP `style.spacing` margin/padding sides to CSS strings. A nested
 * box or ValueAddon leaked into `margin.top` becomes wrapperProps.style.marginTop
 * and Gutenberg's negative-margin check throws.
 */
function sanitizeWpSpacingStyle(
	attributes: Record<string, unknown>
): Record<string, unknown> {
	const style = attributes.style;
	if (!style || typeof style !== 'object' || Array.isArray(style)) {
		return attributes;
	}
	const spacing = (style as Record<string, unknown>).spacing;
	if (!spacing || typeof spacing !== 'object' || Array.isArray(spacing)) {
		return attributes;
	}

	let changed = false;
	const nextSpacing: Record<string, unknown> = {
		...(spacing as Record<string, unknown>),
	};
	for (const box of ['margin', 'padding'] as const) {
		const sides = nextSpacing[box];
		if (!sides || typeof sides !== 'object' || Array.isArray(sides)) {
			continue;
		}
		const nextSides: Record<string, unknown> = {
			...(sides as Record<string, unknown>),
		};
		let boxChanged = false;
		for (let i = 0; i < SPACING_SIDES.length; i++) {
			const side = SPACING_SIDES[i];
			const sanitized = toWpSpacingCss(nextSides[side]);
			if (sanitized !== nextSides[side]) {
				nextSides[side] = sanitized;
				boxChanged = true;
			}
		}
		if (boxChanged) {
			nextSpacing[box] = nextSides;
			changed = true;
		}
	}

	if (!changed) {
		return attributes;
	}
	return {
		...attributes,
		style: {
			...(style as Record<string, unknown>),
			spacing: nextSpacing,
		},
	};
}

function toWpSpacingCss(value: unknown): unknown {
	if (value === undefined || value === null || value === '') {
		return value === undefined ? undefined : '';
	}
	if (typeof value === 'number' && !Number.isNaN(value)) {
		return `${value}px`;
	}
	if (typeof value === 'string') {
		return value;
	}
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		const obj = value as Record<string, unknown>;
		if (typeof obj.var === 'string' && obj.var) {
			return obj.var.startsWith('var(') ? obj.var : `var(${obj.var})`;
		}
		if (typeof obj.value === 'string') {
			return obj.value;
		}
		if (typeof obj.value === 'number' && !Number.isNaN(obj.value)) {
			return `${obj.value}px`;
		}
		return '';
	}
	return '';
}
