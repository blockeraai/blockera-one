/**
 * scroll-stamp-into-canvas.ts: viewport skip and minimal reveal delta.
 */

jest.mock('@wordpress/blocks', () => ({
	getBlockType: () => undefined,
	createBlock: () => ({}),
	parse: () => [],
	serialize: () => '',
}));
jest.mock('@wordpress/block-editor', () => ({
	store: 'core/block-editor',
}));
jest.mock('@wordpress/data', () => ({
	select: () => ({}),
	subscribe: () => () => {},
}));

import {
	SCROLL_PAGE_TOP_MAX_PX,
	SKIP_MIN_TOP_PX,
	resolveRevealNextTop,
	scrollDeltaForTopOffset,
	scrollRoomNeeded,
	shouldScrollStamp,
} from '../canvas/scroll-stamp-into-canvas';

const PORT_TOP = 0;
const PORT_BOTTOM = 800;

describe('shouldScrollStamp', () => {
	it('scrolls when the stamp is below the fold', () => {
		expect(shouldScrollStamp(820, 850, PORT_TOP, PORT_BOTTOM)).toBe(true);
	});

	it('scrolls when the stamp is above the viewport', () => {
		expect(shouldScrollStamp(-40, -10, PORT_TOP, PORT_BOTTOM)).toBe(true);
	});

	it('scrolls when the top is in view but the bottom is clipped', () => {
		expect(shouldScrollStamp(780, 830, PORT_TOP, PORT_BOTTOM)).toBe(true);
	});

	it('does not scroll when the whole stamp is inside the canvas', () => {
		expect(shouldScrollStamp(0, 30, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStamp(11, 40, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStamp(50, 80, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStamp(650, 680, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStamp(770, 800, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStamp(990, 1020, 0, 1265)).toBe(false);
	});
});

describe('resolveRevealNextTop', () => {
	it('goes to page top when the stamp lives in the first 300px of the document', () => {
		expect(SCROLL_PAGE_TOP_MAX_PX).toBe(300);
		expect(resolveRevealNextTop(-6387, -6350, 0, 800, 6562.5, 174.9)).toBe(
			0
		);
		expect(resolveRevealNextTop(5, 40, 0, 800, 170, 175)).toBe(0);
		expect(resolveRevealNextTop(820, 850, 0, 800, 0, 299)).toBe(0);
	});

	it('scrolls only enough to bring a below-the-fold stamp in with the canvas inset', () => {
		// Top 100px below the fold, stamp 30px tall → 100 + height + inset.
		expect(resolveRevealNextTop(900, 930, 0, 800, 0, 900)).toBe(
			130 + SKIP_MIN_TOP_PX
		);
		expect(resolveRevealNextTop(820, 850, 0, 800, 200, 1020)).toBe(
			250 + SKIP_MIN_TOP_PX
		);
	});

	it('scrolls only enough to bring an above-the-fold stamp in with the canvas inset', () => {
		expect(resolveRevealNextTop(-40, -10, 0, 800, 500, 460)).toBe(
			460 - SKIP_MIN_TOP_PX
		);
	});

	it('does not move when the whole stamp is already in the canvas', () => {
		expect(resolveRevealNextTop(50, 80, 0, 800, 200, 350)).toBe(200);
	});

	it('pins a stamp taller than the canvas at the canvas inset from the top', () => {
		expect(resolveRevealNextTop(900, 2000, 0, 800, 0, 900)).toBe(
			900 - SKIP_MIN_TOP_PX
		);
	});
});

describe('scrollDeltaForTopOffset', () => {
	it('moves the block top to the given offset below the canvas top', () => {
		expect(scrollDeltaForTopOffset(820, 0)).toBe(820 - SKIP_MIN_TOP_PX);
		expect(scrollDeltaForTopOffset(50, 0)).toBe(50 - SKIP_MIN_TOP_PX);
		expect(scrollDeltaForTopOffset(SKIP_MIN_TOP_PX, 0)).toBe(0);
		expect(scrollDeltaForTopOffset(-40, 0, 0)).toBe(-40);
		expect(scrollDeltaForTopOffset(820, 0, 100)).toBe(720);
	});
});

describe('scrollRoomNeeded', () => {
	it('returns 0 when the document can already absorb the delta', () => {
		expect(scrollRoomNeeded(200, 400)).toBe(0);
		expect(scrollRoomNeeded(25, 25)).toBe(0);
	});

	it('returns the shortfall when maxScroll is smaller than delta', () => {
		expect(scrollRoomNeeded(890, 25)).toBe(865);
		expect(scrollRoomNeeded(100, 0)).toBe(100);
	});
});
