/**
 * NavItem: trailing chevron wrapper (hover motion target) and external class.
 */

jest.mock('../nav-item.scss', () => ({}));

jest.mock('@blockera/controls', () => {
	const { createElement } = require('@wordpress/element');
	return {
		Flex: ({ children, className }) =>
			createElement('div', { className }, children),
	};
});

jest.mock('@blockera/icons', () => {
	const { createElement } = require('@wordpress/element');
	return {
		Icon: ({ library, icon }) =>
			createElement('span', {
				'data-test': 'nav-item-icon',
				'data-library': library,
				'data-icon': icon,
			}),
	};
});

import { createElement } from '@wordpress/element';
import { fireEvent, render } from '@testing-library/react';

import NavItem from '../nav-item';

const ICON = { library: 'wp', icon: 'layout' };

function renderItem(props = {}) {
	return render(
		createElement(NavItem, {
			label: 'Styles',
			icon: ICON,
			'data-test': 'blockera-site-editor-nav-styles',
			...props,
		})
	);
}

describe('NavItem', () => {
	it('wraps the trailing chevron for parent-hover motion', () => {
		const { container } = renderItem();
		const item = container.querySelector(
			'[data-test="blockera-site-editor-nav-styles"]'
		);
		const chevron = item.querySelector(
			'.blockera-site-editor-nav__item-chevron'
		);
		const glyph = chevron.querySelector('[data-test="nav-item-icon"]');

		expect(item.className).not.toContain('is-external');
		expect(chevron.getAttribute('aria-hidden')).toBe('true');
		expect(glyph.getAttribute('data-library')).toBe('wp');
		expect(glyph.getAttribute('data-icon')).toBe('chevron-right');
	});

	it('omits the chevron when showChevron is false', () => {
		const { container } = renderItem({ showChevron: false });
		const item = container.querySelector(
			'[data-test="blockera-site-editor-nav-styles"]'
		);

		expect(
			item.querySelector('.blockera-site-editor-nav__item-chevron')
		).toBeNull();
	});

	it('marks external links and wraps the new-tab glyph in the same motion target', () => {
		const onClick = jest.fn();
		const { container } = renderItem({
			href: 'https://blockera.ai',
			onClick,
		});
		const item = container.querySelector(
			'[data-test="blockera-site-editor-nav-styles"]'
		);
		const chevron = item.querySelector(
			'.blockera-site-editor-nav__item-chevron'
		);
		const glyph = chevron.querySelector('[data-test="nav-item-icon"]');

		expect(item.className).toContain('is-external');
		expect(item.getAttribute('href')).toBe('https://blockera.ai');
		expect(item.getAttribute('target')).toBe('_blank');
		expect(glyph.getAttribute('data-library')).toBe('ui');
		expect(glyph.getAttribute('data-icon')).toBe('arrow-new-tab');

		fireEvent.click(item);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('keeps the chevron on an active row', () => {
		const { container } = renderItem({ isActive: true });
		const item = container.querySelector(
			'[data-test="blockera-site-editor-nav-styles"]'
		);

		expect(item.className).toContain('is-active');
		expect(
			item.querySelector('.blockera-site-editor-nav__item-chevron')
		).not.toBeNull();
	});
});
