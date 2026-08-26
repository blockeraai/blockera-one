/**
 * Sidebar-width broadcast: rewrite stamped layout columns.
 */

import { STAMP_IDS } from '../../stamp-ids';
import { findStampById } from '../../stamp-lookup';
import { replaceAtPath } from '../../tree';
import type { BlockNode, ControlValue } from '../../types';

const MIN_WIDTH = 10;
const MAX_WIDTH = 60;

/** UI / pattern default when `settings.sidebar_width` is unset. */
export const DEFAULT_SIDEBAR_WIDTH = 33.33;

export function parseSidebarWidth(value: ControlValue): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return clampWidth(value);
	}
	if (typeof value === 'string') {
		const n = Number.parseFloat(value.replace('%', ''));
		if (!Number.isFinite(n)) {
			return null;
		}
		return clampWidth(n);
	}
	return null;
}

export function formatStoredWidth(n: number): string {
	return String(Number(n.toFixed(2)));
}

export function formatPercentWidth(n: number): string {
	return `${formatStoredWidth(n)}%`;
}

function clampWidth(n: number): number {
	if (n < MIN_WIDTH) {
		return MIN_WIDTH;
	}
	if (n > MAX_WIDTH) {
		return MAX_WIDTH;
	}
	return Number(n.toFixed(2));
}

/**
 * Set sidebar-column width and the complement on content-column.
 * Returns null when the tree has no sidebar column (skip) or is unchanged.
 */
export function applySidebarWidth(
	blocks: BlockNode[],
	value: ControlValue
): BlockNode[] | null {
	const n = parseSidebarWidth(value);
	if (n === null) {
		return null;
	}
	const sidebar = findStampById(blocks, STAMP_IDS.sidebarColumn);
	if (!sidebar) {
		return null;
	}
	const content = findStampById(blocks, STAMP_IDS.contentColumn);
	const sidebarWidth = formatPercentWidth(n);
	const contentWidth = formatPercentWidth(100 - n);
	if (
		sidebar.block.attributes?.width === sidebarWidth &&
		(!content || content.block.attributes?.width === contentWidth)
	) {
		return null;
	}

	let next = replaceAtPath(blocks, sidebar.path, {
		...sidebar.block,
		attributes: {
			...(sidebar.block.attributes || {}),
			width: sidebarWidth,
		},
	});
	if (content) {
		next = replaceAtPath(next, content.path, {
			...content.block,
			attributes: {
				...(content.block.attributes || {}),
				width: contentWidth,
			},
		});
	}
	return next;
}
