/**
 * Header-sticky broadcast: sticky position on the header part and chrome slot.
 */

import { findStampById } from '../../stamp-lookup';
import { replaceAtPath } from '../../tree';
import type { BlockNode, ControlValue } from '../../types';

const STICKY_IDS = ['site-header', 'header'] as const;
const STICKY_CLASS = 'is-position-sticky';

function isStickyOn(value: ControlValue): boolean {
	return value === true || value === 'true' || value === '1' || value === 1;
}

export function parseHeaderSticky(value: ControlValue): boolean | null {
	if (value === true || value === false) {
		return value;
	}
	if (value === 'true' || value === '1' || value === 1) {
		return true;
	}
	if (value === 'false' || value === '0' || value === 0 || value === '') {
		return false;
	}
	return null;
}

export function formatStoredSticky(value: ControlValue): string {
	return isStickyOn(value) ? '1' : '0';
}

function classList(className: unknown): string[] {
	return typeof className === 'string'
		? className.split(/\s+/).filter(Boolean)
		: [];
}

function withStickyClass(className: unknown, enabled: boolean): string {
	const next = classList(className).filter((token) => token !== STICKY_CLASS);
	if (enabled) {
		next.push(STICKY_CLASS);
	}
	return next.join(' ');
}

function applyStickyToBlock(block: BlockNode, enabled: boolean): BlockNode {
	const style = {
		...((block.attributes?.style as Record<string, unknown>) || {}),
	};
	const position = {
		...((style.position as Record<string, unknown>) || {}),
	};
	if (enabled) {
		position.type = 'sticky';
		if (position.top === undefined) {
			position.top = '0px';
		}
		style.position = position;
	} else {
		delete position.type;
		delete position.top;
		if (Object.keys(position).length) {
			style.position = position;
		} else {
			delete style.position;
		}
	}
	const className = withStickyClass(block.attributes?.className, enabled);
	const attributes = { ...(block.attributes || {}) };
	if (Object.keys(style).length) {
		attributes.style = style;
	} else {
		delete attributes.style;
	}
	if (className) {
		attributes.className = className;
	} else {
		delete attributes.className;
	}
	return { ...block, attributes };
}

/**
 * Set sticky positioning on the header part root and in-template chrome slot.
 * Returns null when the tree has no header stamp or is unchanged.
 */
export function applyHeaderSticky(
	blocks: BlockNode[],
	value: ControlValue
): BlockNode[] | null {
	const enabled = isStickyOn(value);
	let next = blocks;
	let changed = false;
	for (const id of STICKY_IDS) {
		const found = findStampById(next, id);
		if (!found) {
			continue;
		}
		const updated = applyStickyToBlock(found.block, enabled);
		if (updated === found.block) {
			continue;
		}
		const sameClass =
			(found.block.attributes?.className || '') ===
			(updated.attributes?.className || '');
		const sameStyle =
			JSON.stringify(found.block.attributes?.style || {}) ===
			JSON.stringify(updated.attributes?.style || {});
		if (sameClass && sameStyle) {
			continue;
		}
		next = replaceAtPath(next, found.path, updated);
		changed = true;
	}
	return changed ? next : null;
}
