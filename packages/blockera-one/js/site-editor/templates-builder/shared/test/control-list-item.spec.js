/**
 * asControlListItem: no extra list wrapper; key + separator class land
 * on the control root (through ControlContextProvider when present).
 */

jest.mock('../template-options-panel.scss', () => ({}));
jest.mock('../controls/shared/_controls.scss', () => ({}));

jest.mock('../../../nested-panels', () => ({
	GatewayCard: () => null,
	GatewayRow: () => null,
}));

jest.mock('../use-template-options', () => ({
	__esModule: true,
	default: () => ({}),
}));

jest.mock('../group-header-edit', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('../sortable-element-list', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('../controls/block-style-select', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/border-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/border-radius-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/aspect-ratio-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/resolution-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/font-family-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/text-align-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/color-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/input-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/layout-matrix-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/layout-picker', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/stepper-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/toggle-control', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../controls/toggle-select', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('@blockera/controls', () => {
	const { createElement } = require('@wordpress/element');
	function ControlContextProvider({ children }) {
		return children;
	}
	return {
		ControlContextProvider,
		Flex: ({ children }) => createElement('div', null, children),
	};
});

import { createElement } from '@wordpress/element';
import { render } from '@testing-library/react';

import { ControlContextProvider } from '@blockera/controls';

import { asControlListItem } from '../template-options-panel';

function Field({ className, children }) {
	return createElement('div', { className, 'data-test': 'field' }, children);
}

function renderItem(node, id, separatorBefore) {
	return render(
		createElement('div', null, asControlListItem(node, id, separatorBefore))
	);
}

describe('asControlListItem', () => {
	it('does not wrap the control in blockera-templates-builder-control', () => {
		const { container } = renderItem(
			createElement(Field, { className: 'blockera-field' }, 'n'),
			'posts-per-page'
		);

		expect(
			container.querySelector('.blockera-templates-builder-control')
		).toBeNull();
		expect(container.querySelector('[data-test="field"]')).toBeTruthy();
	});

	it('puts has-separator-before on the control root', () => {
		const { container } = renderItem(
			createElement(
				Field,
				{ className: 'blockera-templates-builder-toggle' },
				'n'
			),
			'toggle',
			true
		);
		const field = container.querySelector('[data-test="field"]');

		expect(field.className).toContain('blockera-templates-builder-toggle');
		expect(field.className).toContain('has-separator-before');
	});

	it('walks through ControlContextProvider onto the inner control', () => {
		const { container } = renderItem(
			createElement(
				ControlContextProvider,
				{ value: { name: 'templates-builder-posts-per-page' } },
				createElement(
					Field,
					{ className: 'blockera-templates-builder-stepper' },
					'n'
				)
			),
			'posts-per-page',
			true
		);
		const field = container.querySelector('[data-test="field"]');

		expect(field.className).toContain('blockera-templates-builder-stepper');
		expect(field.className).toContain('has-separator-before');
		expect(
			container.querySelector('.blockera-templates-builder-control')
		).toBeNull();
	});

	it('leaves className unchanged when there is no separator', () => {
		const { container } = renderItem(
			createElement(
				ControlContextProvider,
				{ value: { name: 'templates-builder-gap' } },
				createElement(
					Field,
					{ className: 'blockera-templates-builder-input' },
					'n'
				)
			),
			'gap'
		);
		const field = container.querySelector('[data-test="field"]');

		expect(field.className).toBe('blockera-templates-builder-input');
	});
});
