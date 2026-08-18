/**
 * BorderRadiusControlRow wraps BaseControl so fieldProps land on
 * `.blockera-field` (GP BorderRadiusControl is control-only).
 */

jest.mock(
	'../controls/border-radius-control/border-radius-control.scss',
	() => ({})
);

jest.mock('@blockera/controls', () => {
	const { createElement } = require('@wordpress/element');
	function ControlContextProvider({ children }) {
		return children;
	}
	function BaseControl({
		children,
		label,
		columns,
		controlName,
		className,
		fieldProps = {},
	}) {
		return createElement(
			'div',
			{
				'data-test': fieldProps['data-test'],
				'data-label': label,
				'data-columns': columns,
				'data-control-name': controlName,
				className: [fieldProps.className, className]
					.filter(Boolean)
					.join(' '),
			},
			children
		);
	}
	function BorderRadiusControl({ label, defaultValue }) {
		return createElement('div', {
			'data-test': 'inner-border-radius',
			'data-label': label,
			'data-default-type': defaultValue?.type,
		});
	}
	return { BaseControl, BorderRadiusControl, ControlContextProvider };
});

import { createElement } from '@wordpress/element';
import { render } from '@testing-library/react';

import { CONTROL_COLUMNS } from '../controls/constants';
import BorderRadiusControlRow from '../controls/border-radius-control';

function renderRow(props = {}) {
	return render(
		createElement(BorderRadiusControlRow, {
			controlId: 'post-featured-image-border-radius',
			label: 'Border Radius',
			value: { type: 'all', all: '8px' },
			onChange: jest.fn(),
			...props,
		})
	);
}

function field(container) {
	return container.querySelector(
		'[data-test="blockera-templates-builder-border-radius"]'
	);
}

describe('BorderRadiusControlRow', () => {
	it('puts fieldProps on a BaseControl root, not the inner control', () => {
		const { container } = renderRow();
		const root = field(container);
		const inner = container.querySelector(
			'[data-test="inner-border-radius"]'
		);

		expect(root).toBeTruthy();
		expect(root.className).toContain(
			'blockera-templates-builder-border-radius'
		);
		expect(root.getAttribute('data-label')).toBe('Border Radius');
		expect(root.getAttribute('data-columns')).toBe(CONTROL_COLUMNS);
		expect(root.getAttribute('data-control-name')).toBe('border-radius');
		expect(inner.getAttribute('data-label')).toBe('');
		expect(inner.getAttribute('data-default-type')).toBe('all');
	});

	it('marks the field root disabled', () => {
		const { container } = renderRow({ disabled: true });

		expect(field(container).className).toContain('is-disabled');
	});
});
