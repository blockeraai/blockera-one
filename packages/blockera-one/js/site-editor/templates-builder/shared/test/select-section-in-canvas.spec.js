/**
 * select-section-in-canvas.ts: pure helpers for when Customize-in-editor
 * should enter Gutenberg pattern edit (Blockera customize mode) instead of
 * remaining in content-only pattern lock.
 */

jest.mock('../../../nested-panels', () => ({
	readPanelStack: () => [],
}));

import {
	resolveContentOnlySectionToEdit,
	shouldEnterPatternEditOnTarget,
} from '../canvas/select-section-in-canvas';

describe('shouldEnterPatternEditOnTarget', () => {
	it('enters edit for an unsynced pattern (patternName)', () => {
		expect(
			shouldEnterPatternEditOnTarget({
				blockName: 'core/group',
				patternName: 'blockera-one/builder-archive-page-header-simple',
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
				patternName: 'blockera-one/builder-archive-page-header-simple',
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

describe('resolveContentOnlySectionToEdit', () => {
	it('unlocks the parent listing pattern for an inner Posts Loop block', () => {
		expect(
			resolveContentOnlySectionToEdit({
				targetClientId: 'post-title',
				targetIsUnsyncedPattern: false,
				parentSectionClientId: 'posts-listing',
			})
		).toBe('posts-listing');
	});

	it('prefers the parent even when a restore-inserted inner block has patternName', () => {
		expect(
			resolveContentOnlySectionToEdit({
				targetClientId: 'post-title',
				targetIsUnsyncedPattern: true,
				parentSectionClientId: 'posts-listing',
			})
		).toBe('posts-listing');
	});

	it('edits the listing pattern itself', () => {
		expect(
			resolveContentOnlySectionToEdit({
				targetClientId: 'posts-listing',
				targetIsUnsyncedPattern: true,
				parentSectionClientId: null,
			})
		).toBe('posts-listing');
	});

	it('skips a plain stamped block with no pattern ancestor', () => {
		expect(
			resolveContentOnlySectionToEdit({
				targetClientId: 'plain',
				targetIsUnsyncedPattern: false,
				parentSectionClientId: null,
			})
		).toBeNull();
	});
});
