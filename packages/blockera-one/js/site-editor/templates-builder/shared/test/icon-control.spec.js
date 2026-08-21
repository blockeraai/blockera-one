/**
 * IconControlRow wraps IconControl so fieldProps land on the field.
 */

let lastDefault;

jest.mock('@blockera/controls', () => {
	const { createElement } = require('@wordpress/element');
	function ControlContextProvider({ children }) {
		return children;
	}
	function IconControl({ label, fieldProps = {}, defaultValue }) {
		lastDefault = defaultValue;
		return createElement('div', {
			'data-test': fieldProps['data-test'],
			'data-label': label,
			className: fieldProps.className,
		});
	}
	return { IconControl, ControlContextProvider };
});

import { createElement } from '@wordpress/element';
import { render } from '@testing-library/react';

import { EMPTY_ICON_VALUE } from '../ops/meta';
import IconControlRow from '../controls/icon-control';

function renderRow(props = {}) {
	return render(
		createElement(IconControlRow, {
			controlId: 'post-meta-author-name-icon',
			label: 'Icon',
			value: null,
			onChange: jest.fn(),
			...props,
		})
	);
}

describe('IconControlRow', () => {
	beforeEach(() => {
		lastDefault = undefined;
	});

	it('puts fieldProps on the control root', () => {
		const { container } = renderRow();
		const root = container.querySelector(
			'[data-test="blockera-templates-builder-icon"]'
		);

		expect(root).toBeTruthy();
		expect(root.className).toContain('blockera-templates-builder-icon');
		expect(root.getAttribute('data-label')).toBe('Icon');
	});

	it('marks the field root disabled', () => {
		const { container } = renderRow({ disabled: true });
		const root = container.querySelector(
			'[data-test="blockera-templates-builder-icon"]'
		);

		expect(root.className).toContain('is-disabled');
	});

	it('does not share EMPTY_ICON_VALUE with the control default', () => {
		renderRow({ value: '' });

		expect(lastDefault).toEqual(EMPTY_ICON_VALUE);
		expect(lastDefault).not.toBe(EMPTY_ICON_VALUE);
		lastDefault.icon = 'mutated';
		expect(EMPTY_ICON_VALUE.icon).toBe('');
	});
});
