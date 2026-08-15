/**
 * scroll-stamp-into-canvas.ts: top-of-block viewport check and scroll delta.
 */

jest.mock('@wordpress/block-editor', () => ({
	store: 'core/block-editor',
}));
jest.mock('@wordpress/data', () => ({
	select: () => ({}),
	subscribe: () => () => {},
}));

import {
	SCROLL_TOP_OFFSET_PX,
	scrollDeltaForTopOffset,
	scrollRoomNeeded,
	shouldScrollStampTop,
} from '../scroll-stamp-into-canvas';

const PORT_TOP = 0;
const PORT_BOTTOM = 800;

describe('shouldScrollStampTop', () => {
	it('scrolls when the top is below the fold', () => {
		expect(shouldScrollStampTop(820, PORT_TOP, PORT_BOTTOM)).toBe(true);
	});

	it('scrolls when the top is above the viewport', () => {
		expect(shouldScrollStampTop(-40, PORT_TOP, PORT_BOTTOM)).toBe(true);
	});

	it('scrolls when the top is in view but within 10px of the canvas top', () => {
		expect(shouldScrollStampTop(0, PORT_TOP, PORT_BOTTOM)).toBe(true);
		expect(shouldScrollStampTop(10, PORT_TOP, PORT_BOTTOM)).toBe(true);
	});

	it('does not scroll when the top is in the viewport and more than 10px from the canvas top', () => {
		expect(shouldScrollStampTop(11, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStampTop(50, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStampTop(150, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStampTop(650, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStampTop(790, PORT_TOP, PORT_BOTTOM)).toBe(false);
		expect(shouldScrollStampTop(990, PORT_TOP, 1265)).toBe(false);
	});
});

describe('scrollDeltaForTopOffset', () => {
	it('moves the block top to SCROLL_TOP_OFFSET_PX below the canvas top', () => {
		expect(SCROLL_TOP_OFFSET_PX).toBe(100);
		expect(scrollDeltaForTopOffset(820, 0)).toBe(720);
		expect(scrollDeltaForTopOffset(50, 0)).toBe(-50);
		expect(scrollDeltaForTopOffset(100, 0)).toBe(0);
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
