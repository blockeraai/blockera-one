/**
 * block-style.ts: Gutenberg-compatible is-style-* className helpers.
 */

import {
	getActiveBlockStyleName,
	replaceBlockStyleClassName,
} from '../block-style';

describe('getActiveBlockStyleName', () => {
	it('returns default when className is empty', () => {
		expect(getActiveBlockStyleName()).toBe('default');
		expect(getActiveBlockStyleName('')).toBe('default');
		expect(getActiveBlockStyleName('blockera-block')).toBe('default');
	});

	it('reads the is-style token', () => {
		expect(
			getActiveBlockStyleName(
				'blockera-block blockera-block-z3jf1t12 is-style-underline'
			)
		).toBe('underline');
	});
});

describe('replaceBlockStyleClassName', () => {
	it('appends is-style-default without dropping other classes', () => {
		expect(
			replaceBlockStyleClassName(
				'blockera-block blockera-block-z3jf1t12',
				'default'
			)
		).toBe('blockera-block blockera-block-z3jf1t12 is-style-default');
	});

	it('swaps an existing is-style token', () => {
		expect(
			replaceBlockStyleClassName(
				'blockera-block is-style-underline extra',
				'dots'
			)
		).toBe('blockera-block extra is-style-dots');
	});

	it('treats an empty style name as default', () => {
		expect(replaceBlockStyleClassName('is-style-underline', '')).toBe(
			'is-style-default'
		);
	});
});
