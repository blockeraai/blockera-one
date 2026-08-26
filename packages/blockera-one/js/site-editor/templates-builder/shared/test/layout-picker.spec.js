/**
 * Layout picker: per-design captions, no hover tooltip, unlabeled
 * BaseControl (empty label + no 2-col grid).
 */

jest.mock('../controls/layout-picker/layout-picker.scss', () => ({}));

jest.mock('@blockera/controls', () => {
	const { createElement } = require('@wordpress/element');
	return {
		BaseControl: ({ children, label, columns, fieldProps = {} }) =>
			createElement(
				'div',
				{
					'data-label': label,
					'data-columns': columns,
					...fieldProps,
				},
				children
			),
		ChangeIndicator: ({
			isChanged,
			isAnimated,
			className,
			primaryColor,
			outlineSize,
			size,
			...props
		}) =>
			isChanged
				? createElement('span', {
						className,
						'data-animated': isAnimated ? 'true' : 'false',
						'data-size': size,
						...props,
					})
				: null,
		Tooltip: ({ text, children }) =>
			createElement(
				'span',
				{
					'data-test': 'layout-picker-edits-tooltip',
					'data-tooltip': text,
				},
				children
			),
	};
});

import { createElement } from '@wordpress/element';
import { fireEvent, render } from '@testing-library/react';

import LayoutPicker from '../controls/layout-picker';

const VARIANTS = [
	{ id: 'simple', label: 'Simple', thumbnail: 'simple.png' },
	{ id: 'banner', label: 'Banner', disabled: true, badge: 'Soon' },
];

function renderPicker(props = {}) {
	return render(
		createElement(LayoutPicker, {
			value: 'simple',
			variants: VARIANTS,
			onChange: jest.fn(),
			...props,
		})
	);
}

function byTest(container, id) {
	return container.querySelector(`[data-test="${id}"]`);
}

describe('LayoutPicker', () => {
	it('renders a centered caption per design and no tooltip', () => {
		const { container, getByText, queryByRole } = renderPicker();

		expect(
			getByText('Simple').className.includes(
				'blockera-templates-builder-layout-picker__caption'
			)
		).toBe(true);
		expect(getByText('Banner')).toBeTruthy();
		expect(queryByRole('tooltip')).toBeNull();
		expect(
			container.querySelector('[data-wp-component="Tooltip"]')
		).toBeNull();
	});

	it('drops the control label and 2-col grid when label is omitted', () => {
		const { container } = renderPicker();
		const base = byTest(
			container,
			'blockera-templates-builder-layout-picker'
		);

		expect(base.getAttribute('data-label')).toBe('');
		expect(base.getAttribute('data-columns')).toBe('');
		expect(base.className).toContain(
			'blockera-templates-builder-layout-picker'
		);
	});

	it('merges an extra className onto the BaseControl root', () => {
		const { container } = renderPicker({
			className: 'has-separator-before',
		});
		const base = byTest(
			container,
			'blockera-templates-builder-layout-picker'
		);

		expect(base.className).toContain(
			'blockera-templates-builder-layout-picker'
		);
		expect(base.className).toContain('has-separator-before');
		expect(
			container.querySelector('.blockera-templates-builder-control')
		).toBeNull();
	});

	it('keeps the stacked grid when a control label is set', () => {
		const { container } = renderPicker({ label: 'Header Design' });
		const base = byTest(
			container,
			'blockera-templates-builder-layout-picker'
		);

		expect(base.getAttribute('data-label')).toBe('Header Design');
		expect(base.getAttribute('data-columns')).toBe('columns-1');
	});

	it('selects an enabled design and ignores a disabled tile', () => {
		const onChange = jest.fn();
		const { container } = renderPicker({
			value: null,
			onChange,
		});

		fireEvent.click(
			byTest(container, 'blockera-templates-builder-layout-simple')
		);
		expect(onChange).toHaveBeenCalledWith('simple');

		onChange.mockClear();
		fireEvent.click(
			byTest(container, 'blockera-templates-builder-layout-banner')
		);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('does not re-emit the already selected design', () => {
		const onChange = jest.fn();
		const { container } = renderPicker({
			value: 'simple',
			onChange,
			variants: [
				{ id: 'simple', label: 'Simple', thumbnail: 'simple.png' },
				{ id: 'banner', label: 'Banner', thumbnail: 'banner.png' },
			],
		});

		fireEvent.click(
			byTest(container, 'blockera-templates-builder-layout-simple')
		);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('shows a static change indicator on selected and other edited tiles', () => {
		const { container } = renderPicker({
			value: 'simple',
			editedVariantIds: ['simple', 'banner'],
			variants: [
				{ id: 'simple', label: 'Simple', thumbnail: 'simple.png' },
				{ id: 'banner', label: 'Banner', thumbnail: 'banner.png' },
			],
		});

		const selected = byTest(
			container,
			'blockera-templates-builder-layout-edits-simple'
		);
		const other = byTest(
			container,
			'blockera-templates-builder-layout-edits-banner'
		);

		expect(selected).toBeTruthy();
		expect(other).toBeTruthy();
		expect(selected.getAttribute('data-animated')).toBe('false');
		expect(other.getAttribute('data-animated')).toBe('false');
		expect(
			byTest(
				container,
				'blockera-templates-builder-layout-simple'
			).getAttribute('data-session-edits')
		).toBe('true');
		expect(
			byTest(
				container,
				'blockera-templates-builder-layout-banner'
			).getAttribute('data-session-edits')
		).toBe('true');
		expect(
			container.querySelectorAll(
				'[data-test="layout-picker-edits-tooltip"]'
			)
		).toHaveLength(2);
		expect(
			byTest(container, 'layout-picker-edits-tooltip').getAttribute(
				'data-tooltip'
			)
		).toBe('You edited this design during current session.');
	});
});
