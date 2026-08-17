/**
 * GatewayCard: header navigates without a toggle (Posts Loop on All Archives).
 */

jest.mock('../gateway-card.scss', () => ({}));

import { createElement } from '@wordpress/element';
import { fireEvent, render } from '@testing-library/react';

import GatewayCard from '../gateway-card';

describe('GatewayCard', () => {
	it('makes a has-body header clickable without rendering a toggle', () => {
		const onOpen = jest.fn();
		const { container } = render(
			createElement(
				GatewayCard,
				{
					title: 'Posts Loop',
					enabled: true,
					onOpen,
					'data-test': 'blockera-templates-builder-group-page-layout',
				},
				createElement('div')
			)
		);
		const card = container.querySelector(
			'[data-test="blockera-templates-builder-group-page-layout"]'
		);
		const header = card.querySelector('.admin-ui-page__header');

		expect(card.className).toContain('is-navigable');
		expect(card.className).toContain('has-body');
		expect(
			card.querySelector('.blockera-site-editor-gateway-card__toggle')
		).toBeNull();
		expect(
			card.querySelector('.blockera-site-editor-gateway-card__chevron')
		).not.toBeNull();
		expect(header.getAttribute('role')).toBe('button');

		fireEvent.click(header);
		expect(onOpen).toHaveBeenCalledTimes(1);
	});
});
