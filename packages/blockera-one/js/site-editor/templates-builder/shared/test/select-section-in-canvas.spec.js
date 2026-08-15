/**
 * select-section-in-canvas.ts: pure helpers for when Customize-in-editor
 * should enter Gutenberg pattern edit on the target itself.
 */

jest.mock('../../../nested-panels', () => ({
	readPanelStack: () => [],
}));

import { shouldEnterPatternEditOnTarget } from '../select-section-in-canvas';

describe('shouldEnterPatternEditOnTarget', () => {
	it('enters edit for an unsynced pattern (patternName)', () => {
		expect(
			shouldEnterPatternEditOnTarget({
				blockName: 'core/group',
				patternName: 'blockera-one/builder-archive-page-title-simple',
			})
		).toBe(true);
	});

	it('enters edit for a contentOnly-locked section', () => {
		expect(
			shouldEnterPatternEditOnTarget({
				blockName: 'core/group',
				templateLock: 'contentOnly',
			})
		).toBe(true);
	});

	it('skips synced patterns and template parts (isolated Edit original)', () => {
		expect(
			shouldEnterPatternEditOnTarget({
				blockName: 'core/block',
				patternName: 'blockera-one/builder-archive-page-title-simple',
			})
		).toBe(false);
		expect(
			shouldEnterPatternEditOnTarget({
				blockName: 'core/template-part',
				templateLock: 'contentOnly',
			})
		).toBe(false);
	});

	it('skips a plain stamped group with no pattern metadata', () => {
		expect(
			shouldEnterPatternEditOnTarget({
				blockName: 'core/group',
			})
		).toBe(false);
	});
});
