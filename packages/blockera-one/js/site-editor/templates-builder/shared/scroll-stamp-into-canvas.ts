/**
 * Scroll a stamped block into the Site Editor canvas viewport when a
 * Templates Builder nested panel is active. Scroll only — no select,
 * flash, or inspector switch.
 *
 * Visibility is the block **top** vs the canvas: skip when the top is
 * already in the viewport with more than SKIP_MIN_TOP_PX clearance. When
 * we do scroll, the top lands SCROLL_TOP_OFFSET_PX below the canvas top.
 */

import { store as blockEditorStore } from '@wordpress/block-editor';
import { select, subscribe } from '@wordpress/data';

import { findByStamp } from './tree';
import type { BlockNode } from './types';

const SCROLL_TIMEOUT_MS = 8000;
/** Watch after the first reveal so query-loop growth can be followed. */
const OBSERVE_SETTLE_MS = 2000;
const CONTENT_MOVE_PX = 40;
const CANVAS_IFRAME_SELECTOR =
	'iframe[name="editor-canvas"], iframe.block-editor-iframe__iframe';

/** Target gap from the canvas top to the block top after a scroll. */
export const SCROLL_TOP_OFFSET_PX = 100;
/**
 * If the block top is already in the viewport and more than this many px
 * below the canvas top, do not scroll.
 */
export const SKIP_MIN_TOP_PX = 10;
/** Subpixel leftover after a scroll counts as landed. */
export const SKIP_TOP_EPSILON_PX = 1;

function findStampClientId(stampId: string): string | null {
	const getBlocks = (
		select(blockEditorStore) as unknown as {
			getBlocks?: () => BlockNode[];
		}
	).getBlocks;
	if (typeof getBlocks !== 'function') {
		return null;
	}
	const match = findByStamp(getBlocks(), (stamp) => stamp?.id === stampId);
	return match?.block?.clientId || null;
}

function getEditorCanvasIframe(): HTMLIFrameElement | null {
	if (typeof document === 'undefined') {
		return null;
	}
	return document.querySelector(
		CANVAS_IFRAME_SELECTOR
	) as HTMLIFrameElement | null;
}

function findBlockElement(clientId: string): {
	el: Element;
	view: Window;
} | null {
	const iframe = getEditorCanvasIframe();
	const docs: Array<{ doc: Document; view: Window }> = [];
	if (typeof document !== 'undefined') {
		docs.push({ doc: document, view: window });
	}
	if (iframe?.contentDocument && iframe.contentWindow) {
		docs.push({
			doc: iframe.contentDocument,
			view: iframe.contentWindow,
		});
	}

	for (let i = 0; i < docs.length; i++) {
		const el = docs[i].doc.querySelector(`[data-block="${clientId}"]`);
		if (el) {
			return { el, view: docs[i].view };
		}
	}
	return null;
}

/**
 * Scroll only when the top is off-screen or tighter than SKIP_MIN_TOP_PX
 * to the canvas top. An in-viewport top with more than 10px clearance
 * is already visible — do not move the canvas.
 */
export function shouldScrollStampTop(
	blockTop: number,
	portTop: number,
	portBottom: number
): boolean {
	if (blockTop < portTop || blockTop > portBottom) {
		return true;
	}
	return blockTop - portTop <= SKIP_MIN_TOP_PX;
}

/**
 * Delta to apply to the scrollport so `blockTop` lands SCROLL_TOP_OFFSET_PX
 * below `portTop`.
 */
export function scrollDeltaForTopOffset(
	blockTop: number,
	portTop: number
): number {
	return blockTop - portTop - SCROLL_TOP_OFFSET_PX;
}

/**
 * Extra bottom padding needed so `delta` is not clamped by maxScroll.
 * Last stamps (footer/pagination) sit in a document that is barely taller
 * than the iframe; without this room they cannot reach the 100px offset.
 */
export function scrollRoomNeeded(delta: number, maxScroll: number): number {
	return Math.max(0, Math.ceil(delta - Math.max(0, maxScroll)));
}

const SCROLL_PAD_ATTR = 'data-blockera-one-scroll-pad';

function stampDocumentY(el: Element, view: Window): number {
	return (
		el.getBoundingClientRect().top + view.document.documentElement.scrollTop
	);
}

function ensureBottomScrollRoom(
	scroller: Element,
	view: Window,
	delta: number
): void {
	const maxScroll = Math.max(
		0,
		scroller.scrollHeight - scroller.clientHeight
	);
	const room = scrollRoomNeeded(delta, maxScroll);
	if (room <= 0) {
		return;
	}

	// Pad the iframe <html> (not a React tree). room is only the shortfall
	// beyond current maxScroll, so existing pad is not applied twice.
	const html = view.document.documentElement as HTMLElement;
	const prevPad = parseFloat(html.getAttribute(SCROLL_PAD_ATTR) || '0') || 0;
	const nextPad = prevPad + room;
	html.setAttribute(SCROLL_PAD_ATTR, String(nextPad));
	html.style.paddingBottom = `${nextPad}px`;
}

function isDocumentScroller(scroller: Element, view: Window): boolean {
	return (
		scroller === view.document.scrollingElement ||
		scroller === view.document.documentElement ||
		scroller === view.document.body
	);
}

function findScrollableAncestor(el: Element, view: Window): Element {
	let node: Element | null = el.parentElement;
	while (node && node !== el.ownerDocument.documentElement) {
		const style = view.getComputedStyle(node);
		const overflowY = style.overflowY;
		const canScroll =
			overflowY === 'auto' ||
			overflowY === 'scroll' ||
			overflowY === 'overlay';
		if (canScroll && node.scrollHeight > node.clientHeight) {
			return node;
		}
		node = node.parentElement;
	}
	return (
		el.ownerDocument.scrollingElement || el.ownerDocument.documentElement
	);
}

function scrollportTop(scroller: Element, view: Window): number {
	if (isDocumentScroller(scroller, view)) {
		return 0;
	}
	return scroller.getBoundingClientRect().top;
}

function revealStampTop(el: Element, view: Window): boolean {
	const scroller = findScrollableAncestor(el, view);
	const rect = el.getBoundingClientRect();
	const portTop = scrollportTop(scroller, view);
	const portBottom = isDocumentScroller(scroller, view)
		? view.innerHeight
		: scroller.getBoundingClientRect().bottom;

	const willScroll = shouldScrollStampTop(rect.top, portTop, portBottom);
	const delta = scrollDeltaForTopOffset(rect.top, portTop);
	if (!willScroll || Math.abs(delta) < SKIP_TOP_EPSILON_PX) {
		return false;
	}

	ensureBottomScrollRoom(scroller, view, delta);

	const nextTop = Math.max(0, scroller.scrollTop + delta);
	const reduceMotion =
		typeof view.matchMedia === 'function' &&
		view.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth';
	const html = view.document.documentElement;
	if (typeof (scroller as HTMLElement).scrollTo === 'function') {
		(scroller as HTMLElement).scrollTo({ top: nextTop, behavior });
	} else {
		(scroller as HTMLElement).scrollTop = nextTop;
	}
	if (html !== scroller && typeof html.scrollTo === 'function') {
		html.scrollTo({ top: nextTop, behavior });
	}
	return true;
}

/**
 * Scroll the stamped block into the canvas if its top is off-screen
 * or tighter than SKIP_MIN_TOP_PX to the canvas top.
 * Returns a cleanup that cancels the iframe/store retry.
 */
let activeRevealStop: (() => void) | null = null;

/** Cancel an in-flight reveal (e.g. a later toggle that must not scroll). */
export function cancelStampCanvasReveal(): void {
	if (activeRevealStop) {
		activeRevealStop();
		activeRevealStop = null;
	}
}

export function scrollStampIntoCanvas(stampId: string): () => void {
	if (!stampId) {
		return () => {};
	}

	if (activeRevealStop) {
		activeRevealStop();
		activeRevealStop = null;
	}

	const started = Date.now();
	let stopped = false;
	let inTick = false;
	let observing = false;
	let lastObserveKey = '';
	let lastDocY = Number.NaN;
	// Reuse the canvas node across store ticks; getBlocks()+findByStamp
	// on every wp.data notification is too expensive for a 2s observe.
	let cachedFound: { el: Element; view: Window } | null = null;
	let settleTimer = 0;

	const stop = () => {
		if (stopped) {
			return;
		}
		stopped = true;
		if (activeRevealStop === stop) {
			activeRevealStop = null;
		}
		cachedFound = null;
		if (settleTimer) {
			window.clearTimeout(settleTimer);
			settleTimer = 0;
		}
		unsubscribe();
	};

	const armSettle = () => {
		if (settleTimer) {
			window.clearTimeout(settleTimer);
		}
		settleTimer = window.setTimeout(stop, OBSERVE_SETTLE_MS);
	};

	const resolveFound = () => {
		if (cachedFound?.el.isConnected) {
			return cachedFound;
		}
		cachedFound = null;
		const clientId = findStampClientId(stampId);
		const found = clientId ? findBlockElement(clientId) : null;
		if (found) {
			cachedFound = found;
		}
		return found;
	};

	const tick = () => {
		if (stopped || inTick) {
			return;
		}
		inTick = true;
		try {
			const found = resolveFound();
			const timedOut = Date.now() - started > SCROLL_TIMEOUT_MS;

			if (found) {
				if (observing) {
					const rectTop = found.el.getBoundingClientRect().top;
					const docY = stampDocumentY(found.el, found.view);
					// Same skip rule as reveal: iframe viewport, portTop 0.
					const drifted = shouldScrollStampTop(
						rectTop,
						0,
						found.view.innerHeight
					);
					// Viewport motion during smooth scroll keeps docY stable.
					// Only follow when the stamp moved in the document
					// (query loop hydration pushing footer/pagination down).
					const contentMoved =
						!Number.isFinite(lastDocY) ||
						Math.abs(docY - lastDocY) > CONTENT_MOVE_PX;
					const key = `${Math.round(rectTop)}:${Math.round(docY)}`;
					if (drifted && contentMoved && key !== lastObserveKey) {
						lastObserveKey = key;
						revealStampTop(found.el, found.view);
						lastDocY = stampDocumentY(found.el, found.view);
						armSettle();
					}
					if (timedOut) {
						stop();
					}
					return;
				}
				const didScroll = revealStampTop(found.el, found.view);
				// Already in view: do not keep subscribe alive for 2s
				// (color/number/design picks fire often).
				if (!didScroll) {
					stop();
					return;
				}
				observing = true;
				lastDocY = stampDocumentY(found.el, found.view);
				armSettle();
				return;
			}

			if (observing || timedOut) {
				stop();
			}
		} finally {
			inTick = false;
		}
	};

	const unsubscribe = subscribe(tick);
	activeRevealStop = stop;
	tick();
	return stop;
}
