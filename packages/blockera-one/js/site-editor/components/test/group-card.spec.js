jest.mock('../../admin-ui-card.scss', () => ({}));

import { createElement } from '@wordpress/element';
import { render } from '@testing-library/react';

import GroupCard from '../group-card';

describe('GroupCard', () => {
	it('renders title and padded content', () => {
		const { container } = render(
			createElement(
				GroupCard,
				{
					title: 'General',
					'data-test': 'blockera-group-card',
				},
				'Body'
			)
		);

		expect(
			container.querySelector('[data-test="blockera-group-card"]')
		).not.toBeNull();
		expect(
			container.querySelector('.admin-ui-page__header-title')?.textContent
		).toBe('General');
		expect(
			container.querySelector('.admin-ui-page__content.has-padding')
				?.textContent
		).toBe('Body');
		expect(
			container.querySelector('[data-test="blockera-group-card"]')
				?.className
		).not.toContain('is-header-collapsed');
	});

	it('marks header collapsed when there is no body', () => {
		const { container } = render(
			createElement(GroupCard, {
				title: 'Empty',
				'data-test': 'blockera-group-card-empty',
			})
		);

		expect(
			container.querySelector('[data-test="blockera-group-card-empty"]')
				?.className
		).toContain('is-header-collapsed');
		expect(container.querySelector('.admin-ui-page__content')).toBeNull();
	});

	it('respects explicit isHeaderCollapsed when body is present', () => {
		const { container } = render(
			createElement(
				GroupCard,
				{
					title: 'Collapsed',
					isHeaderCollapsed: true,
					'data-test': 'blockera-group-card-collapsed',
				},
				'Body'
			)
		);

		expect(
			container.querySelector(
				'[data-test="blockera-group-card-collapsed"]'
			)?.className
		).toContain('is-header-collapsed');
	});

	it('forwards header props and actions', () => {
		const onClick = jest.fn();
		const { container } = render(
			createElement(GroupCard, {
				title: 'Gateway',
				headerProps: { onClick, role: 'button' },
				headerActions: createElement(
					'span',
					{ className: 'header-actions-slot' },
					'Action'
				),
			})
		);

		const header = container.querySelector('.admin-ui-page__header');
		header?.click();
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(
			container.querySelector('.header-actions-slot')?.textContent
		).toBe('Action');
	});
});
