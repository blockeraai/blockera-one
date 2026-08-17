/**
 * GatewayRow: extra className lands on the row root (list separator).
 */

jest.mock('../gateway-card.scss', () => ({}));

import { createElement } from '@wordpress/element';
import { render } from '@testing-library/react';

import GatewayRow from '../gateway-row';

describe('GatewayRow', () => {
	it('merges className onto the row root', () => {
		const { container } = render(
			createElement(GatewayRow, {
				title: 'Design',
				enabled: true,
				className: 'has-separator-before',
				'data-test': 'blockera-templates-builder-gateway-design',
			})
		);
		const row = container.querySelector(
			'[data-test="blockera-templates-builder-gateway-design"]'
		);

		expect(row.className).toContain('blockera-site-editor-gateway-row');
		expect(row.className).toContain('has-separator-before');
	});
});
