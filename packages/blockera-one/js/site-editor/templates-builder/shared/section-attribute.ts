/**
 * Nested attribute and Gutenberg `is-style-*` writes on a detected section.
 */

import { resolveSectionState } from './resolve/resolve-state';
import type { StampLookupOptions } from './stamp-lookup';
import { getAtPath, replaceAtPath } from './tree';
import type { BlockNode } from './types';
import {
	applyBlockeraInspectorAttribute,
	isBlockeraExtensionPath,
} from './blockera-attribute';
import { replaceBlockStyleClassName } from './block-style';

/**
 * Set a nested attribute on a detected section block.
 */
export function setSectionAttribute(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		attributePath: string;
		value: unknown;
		lookup?: StampLookupOptions;
	}
): BlockNode[] {
	const state = resolveSectionState(
		blocks,
		params.sectionId,
		[],
		params.lookup
	);
	if (!state.path) {
		return blocks;
	}
	const node = getAtPath(blocks, state.path);
	if (!node) {
		return blocks;
	}

	const attrs = { ...(node.attributes || {}) } as Record<string, unknown>;
	let nextAttrs = attrs;

	if (isBlockeraExtensionPath(params.attributePath)) {
		nextAttrs = applyBlockeraInspectorAttribute(
			attrs,
			params.attributePath,
			params.value,
			node.name
		);
	} else {
		const parts = params.attributePath.split('.');
		let cursor: Record<string, unknown> = nextAttrs;
		for (let i = 0; i < parts.length - 1; i++) {
			const key = parts[i];
			const nextVal =
				cursor[key] && typeof cursor[key] === 'object'
					? { ...(cursor[key] as Record<string, unknown>) }
					: {};
			cursor[key] = nextVal;
			cursor = nextVal;
		}
		cursor[parts[parts.length - 1]] = params.value;
	}

	return replaceAtPath(blocks, state.path, {
		...node,
		attributes: nextAttrs,
	});
}

/**
 * Swap the Gutenberg `is-style-*` class on a detected section. Preserves
 * other className tokens (including Blockera generated ids).
 */
export function setSectionBlockStyle(
	blocks: BlockNode[],
	params: {
		sectionId: string;
		styleName: string;
		lookup?: StampLookupOptions;
	}
): BlockNode[] {
	const state = resolveSectionState(
		blocks,
		params.sectionId,
		[],
		params.lookup
	);
	if (!state.path) {
		return blocks;
	}
	const node = getAtPath(blocks, state.path);
	if (!node) {
		return blocks;
	}

	const className = replaceBlockStyleClassName(
		typeof node.attributes?.className === 'string'
			? node.attributes.className
			: '',
		params.styleName
	);

	return replaceAtPath(blocks, state.path, {
		...node,
		attributes: {
			...(node.attributes || {}),
			className,
		},
	});
}

/**
 * Core's editor paints `label` as PlainText — empty means an invisible
 * placeholder. PHP already falls back to these strings. Write them when
 * Previous/Next exist but have no label so the canvas matches Settings.
 */
const PAGINATION_NAV_DEFAULT_LABELS: Array<{
	sectionId: string;
	label: string;
}> = [
	{ sectionId: 'pagination-previous', label: 'Previous Page' },
	{ sectionId: 'pagination-next', label: 'Next Page' },
];

export function ensurePaginationNavLabels(blocks: BlockNode[]): BlockNode[] {
	let next = blocks;
	for (let i = 0; i < PAGINATION_NAV_DEFAULT_LABELS.length; i++) {
		const item = PAGINATION_NAV_DEFAULT_LABELS[i];
		const state = resolveSectionState(next, item.sectionId);
		if (!state.path) {
			continue;
		}
		const node = getAtPath(next, state.path);
		const current = node?.attributes?.label;
		if (typeof current === 'string' && current !== '') {
			continue;
		}
		next = setSectionAttribute(next, {
			sectionId: item.sectionId,
			attributePath: 'label',
			value: item.label,
		});
	}
	return next;
}
