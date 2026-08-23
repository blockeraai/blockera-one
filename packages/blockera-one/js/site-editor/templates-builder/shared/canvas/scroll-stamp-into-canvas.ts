/**
 * Templates Builder: find a stamp in the block list, then spotlight it.
 * Scroll and flash live in `@blockera/utils` `spotlightNode`.
 */

import { store as blockEditorStore } from '@wordpress/block-editor';
import { select, subscribe } from '@wordpress/data';
import {
	DEFAULT_INSET,
	DEFAULT_PAGE_TOP_MAX_PX,
	clearSpotlightNode,
	resolveSpotlightNodeTarget,
	resolveSpotlightScrollTop,
	scrollDeltaForTopOffset,
	scrollRoomNeeded,
	shouldScrollSpotlightNode,
	spotlightNode,
} from '@blockera/utils';

import { findStampById } from '../stamp-lookup';
import type { BlockNode } from '../types';

export const SCROLL_PAGE_TOP_MAX_PX = DEFAULT_PAGE_TOP_MAX_PX;
export const SKIP_MIN_TOP_PX = DEFAULT_INSET;
export const shouldScrollStamp = shouldScrollSpotlightNode;
export const resolveRevealNextTop = resolveSpotlightScrollTop;
export { scrollDeltaForTopOffset, scrollRoomNeeded };

const LOOKUP_TIMEOUT_MS = 8000;
const FLASH_PAD_PX = 15;
const OBSERVE_MS = 2000;

const TB_SPOTLIGHT = {
	padding: FLASH_PAD_PX,
	inset: SKIP_MIN_TOP_PX,
	pageTopMaxPx: SCROLL_PAGE_TOP_MAX_PX,
	observeMs: OBSERVE_MS,
	pad: true,
	scroll: true,
	flash: true,
};

function getSelectedClientId(): string | null {
	const editor = select(blockEditorStore) as unknown as {
		getSelectedBlockClientId?: () => string | null;
	};
	if (typeof editor.getSelectedBlockClientId !== 'function') {
		return null;
	}
	return editor.getSelectedBlockClientId() || null;
}

function findStampClientId(stampId: string): string | null {
	const getBlocks = (
		select(blockEditorStore) as unknown as {
			getBlocks?: () => BlockNode[];
		}
	).getBlocks;
	if (typeof getBlocks !== 'function') {
		return null;
	}
	const match = findStampById(getBlocks(), stampId, {
		selectedClientId: getSelectedClientId(),
	});
	return match?.block?.clientId || null;
}

let activeStop: (() => void) | null = null;

/** Cancel an in-flight reveal (e.g. a later toggle that must not scroll). */
export function cancelStampCanvasReveal(): void {
	if (activeStop) {
		activeStop();
		activeStop = null;
	}
}

/**
 * Resolve the stamp in the block tree, then spotlight it (scroll + flash).
 */
export function scrollStampIntoCanvas(stampId: string): () => void {
	if (!stampId) {
		return () => {};
	}

	cancelStampCanvasReveal();

	const started = Date.now();
	let stopped = false;
	let spotlightStop: (() => void) | null = null;

	const stop = () => {
		if (stopped) {
			return;
		}
		stopped = true;
		if (activeStop === stop) {
			activeStop = null;
		}
		if (spotlightStop) {
			spotlightStop();
			spotlightStop = null;
		} else {
			clearSpotlightNode();
		}
		unsubscribe();
	};

	const tick = () => {
		if (stopped) {
			return;
		}
		const clientId = findStampClientId(stampId);
		if (clientId && resolveSpotlightNodeTarget({ clientId })) {
			spotlightStop = spotlightNode({ clientId }, TB_SPOTLIGHT);
			unsubscribe();
			return;
		}
		if (Date.now() - started > LOOKUP_TIMEOUT_MS) {
			stop();
		}
	};

	const unsubscribe = subscribe(tick);
	activeStop = stop;
	tick();
	return stop;
}
