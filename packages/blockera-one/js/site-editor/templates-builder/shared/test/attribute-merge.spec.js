/**
 * Nested-key merge helpers for Blockera object attributes.
 */

import {
	mergeAttributeKeys,
	pickMergedAttributeValue,
} from '../attribute-merge';

describe('mergeAttributeKeys', () => {
	it('patches nested keys and preserves siblings', () => {
		const current = {
			padding: {
				top: '10px',
				right: '20px',
				bottom: '10px',
				left: '20px',
			},
			margin: { top: '', right: '', bottom: '40px', left: '' },
		};

		expect(
			mergeAttributeKeys(
				current,
				['padding.top', 'padding.bottom'],
				'30px'
			)
		).toEqual({
			padding: {
				top: '30px',
				right: '20px',
				bottom: '30px',
				left: '20px',
			},
			margin: { top: '', right: '', bottom: '40px', left: '' },
		});
	});

	it('creates missing intermediate objects from an empty current', () => {
		expect(mergeAttributeKeys(null, ['margin.bottom'], '12px')).toEqual({
			margin: { bottom: '12px' },
		});
	});
});

describe('pickMergedAttributeValue', () => {
	it('returns the first non-empty merge key', () => {
		expect(
			pickMergedAttributeValue({ padding: { top: '', bottom: '16px' } }, [
				'padding.top',
				'padding.bottom',
			])
		).toBe('16px');
	});

	it('returns an empty string when every key is empty', () => {
		expect(pickMergedAttributeValue({}, ['margin.bottom'])).toBe('');
	});
});
