/**
 * scroll-stamp-into-canvas.ts: top-of-block viewport check and scroll delta.
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
	SCROLL_TOP_OFFSET_PX,
	resolveRevealNextTop,
	scrollDeltaForTopOffset,
	scrollRoomNeeded,
	shouldScrollStampTop,
} from '../canvas/scroll-stamp-into-canvas';

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

describe('resolveRevealNextTop', () => {
	it('goes to page top when the stamp lives in the first 300px of the document', () => {
		expect(SCROLL_PAGE_TOP_MAX_PX).toBe(300);
		expect(resolveRevealNextTop(-6387, 0, 6562.5, 174.9)).toBe(0);
		expect(resolveRevealNextTop(5, 0, 170, 175)).toBe(0);
		expect(resolveRevealNextTop(820, 0, 0, 299)).toBe(0);
	});

	it('lands 100px below the canvas top when the stamp is 300px or further down the page', () => {
		expect(resolveRevealNextTop(820, 0, 0, 300)).toBe(720);
		expect(resolveRevealNextTop(820, 0, 0, 820)).toBe(720);
	});
});

describe('scrollDeltaForTopOffset', () => {
	it('moves the block top to the given offset below the canvas top', () => {
		expect(scrollDeltaForTopOffset(820, 0)).toBe(720);
		expect(scrollDeltaForTopOffset(50, 0)).toBe(-50);
		expect(scrollDeltaForTopOffset(100, 0)).toBe(0);
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
