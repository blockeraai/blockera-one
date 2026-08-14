/**
 * Apply a Blockera extension attribute the same way the block inspector does:
 * assign blockeraPropsId / blockeraCompatId, persist `blockera-block` class
 * names (style-engine selectors), write `{ value }`, then run
 * `blockera.blockEdit.setAttributes` for WP compatibility when the block
 * supports it (e.g. group gap → style.spacing.blockGap).
 */

import { getBlockType } from '@wordpress/blocks';
import { applyFilters } from '@wordpress/hooks';

/**
 * Same identifier scheme as `getAttributesWithIds` in
 * `@blockera/editor` `hooks/use-attributes`.
 */
function withBlockeraId(
	attributes: Record<string, unknown>,
	key: 'blockeraPropsId' | 'blockeraCompatId'
): Record<string, unknown> {
	if (attributes[key]) {
		return attributes;
	}
	const d = new Date();
	return {
		...attributes,
		[key]:
			'' +
			d.getMonth() +
			d.getDate() +
			d.getHours() +
			d.getMinutes() +
			d.getSeconds() +
			d.getMilliseconds(),
	};
}

/** Matches `@blockera/editor` `BLOCKERA_BLOCK_REGEX` unique class tokens. */
const BLOCKERA_UNIQUE_CLASS = /^blockera-block-[\w-]+$/i;

/**
 * Style-engine CSS targets `.blockera-block-{id}`. The inspector adds this
 * via BlockEdit; templates-builder writes must persist it on attributes or
 * generated styles never attach (WP also skips native blockGap on blocks
 * like `core/breadcrumbs`).
 */
function withBlockeraBlockClassName(
	attributes: Record<string, unknown>
): Record<string, unknown> {
	const id = String(
		attributes.blockeraCompatId || attributes.blockeraPropsId || ''
	);
	if (!id) {
		return attributes;
	}
	const unique = `blockera-block-${id}`;
	const current =
		typeof attributes.className === 'string' ? attributes.className : '';
	const tokens = current.split(/\s+/).filter(Boolean);
	if (tokens.indexOf('blockera-block') === -1) {
		tokens.push('blockera-block');
	}
	let hasUnique = false;
	for (let i = 0; i < tokens.length; i++) {
		if (
			BLOCKERA_UNIQUE_CLASS.test(tokens[i]) &&
			tokens[i] !== 'blockera-block'
		) {
			hasUnique = true;
			break;
		}
	}
	if (!hasUnique) {
		tokens.push(unique);
	}
	return {
		...attributes,
		className: tokens.join(' '),
	};
}

function inspectorAttributeId(attributePath: string): string | null {
	const [id] = attributePath.split('.');
	if (!id || !id.startsWith('blockera') || id === 'blockeraOne') {
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

	let next: Record<string, unknown> = { ...attributes };
	next = withBlockeraId(next, 'blockeraPropsId');
	next = withBlockeraId(next, 'blockeraCompatId');
	next = withBlockeraBlockClassName(next);

	// Inspector reducer: blockera* keys are stored as `{ value: newValue }`.
	next[attributeId] = { value: newValue };

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

	return filtered && typeof filtered === 'object'
		? (filtered as Record<string, unknown>)
		: next;
}
