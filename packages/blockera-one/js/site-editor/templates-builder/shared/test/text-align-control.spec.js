/**
 * TextAlignControlRow wraps TextAlignControl so fieldProps land on the field.
 */

jest.mock('@blockera/controls', () => {
	const { createElement } = require('@wordpress/element');
	function ControlContextProvider({ children }) {
		return children;
	}
	function TextAlignControl({ label, fieldProps = {} }) {
		return createElement('div', {
			'data-test': fieldProps['data-test'],
			'data-label': label,
			className: fieldProps.className,
		});
	}
	return { TextAlignControl, ControlContextProvider };
});

import { createElement } from '@wordpress/element';
import { render } from '@testing-library/react';

import TextAlignControlRow from '../controls/text-align-control';

function renderRow(props = {}) {
	return render(
		createElement(TextAlignControlRow, {
			controlId: 'post-title-text-align',
			label: 'Text Align',
			value: 'center',
			onChange: jest.fn(),
			...props,
		})
	);
}

describe('TextAlignControlRow', () => {
	it('puts fieldProps on the control root', () => {
		const { container } = renderRow();
		const root = container.querySelector(
			'[data-test="blockera-templates-builder-text-align"]'
		);

		expect(root).toBeTruthy();
		expect(root.className).toContain(
			'blockera-templates-builder-text-align'
		);
		expect(root.getAttribute('data-label')).toBe('Text Align');
	});

	it('marks the field root disabled', () => {
		const { container } = renderRow({ disabled: true });
		const root = container.querySelector(
			'[data-test="blockera-templates-builder-text-align"]'
		);

		expect(root.className).toContain('is-disabled');
	});
});
