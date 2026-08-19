/**
 * FontFamilyControlRow wraps FontFamilyControl so fieldProps land on the field.
 */

jest.mock('@blockera/controls', () => {
	const { createElement } = require('@wordpress/element');
	function ControlContextProvider({ children }) {
		return children;
	}
	function FontFamilyControl({ label, fieldProps = {}, disabled }) {
		return createElement('div', {
			'data-test': fieldProps['data-test'],
			'data-label': label,
			className: fieldProps.className,
			'data-disabled': disabled ? 'true' : 'false',
		});
	}
	return { FontFamilyControl, ControlContextProvider };
});

import { createElement } from '@wordpress/element';
import { render } from '@testing-library/react';

import FontFamilyControlRow from '../controls/font-family-control';

function renderRow(props = {}) {
	return render(
		createElement(FontFamilyControlRow, {
			controlId: 'post-title-font-family',
			label: 'Font Family',
			value: 'cardo',
			onChange: jest.fn(),
			...props,
		})
	);
}

describe('FontFamilyControlRow', () => {
	it('puts fieldProps on the control root', () => {
		const { container } = renderRow();
		const root = container.querySelector(
			'[data-test="blockera-templates-builder-font-family"]'
		);

		expect(root).toBeTruthy();
		expect(root.className).toContain(
			'blockera-templates-builder-font-family'
		);
		expect(root.getAttribute('data-label')).toBe('Font Family');
	});

	it('marks the field root disabled', () => {
		const { container } = renderRow({ disabled: true });
		const root = container.querySelector(
			'[data-test="blockera-templates-builder-font-family"]'
		);

		expect(root.className).toContain('is-disabled');
	});
});
