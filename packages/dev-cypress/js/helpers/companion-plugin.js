/**
 * Cypress helpers for blockera-one companion plugin identity in the theme.
 */

/**
 * Assert the blockera.products.isCompanionPlugin filter value.
 *
 * @param {boolean} expected Expected filter result.
 */
export function assertCompanionPluginFilter(expected = false) {
	cy.window().should((win) => {
		expect(win.wp?.hooks?.applyFilters, 'wp.hooks.applyFilters').to.be.a(
			'function'
		);

		expect(
			win.wp.hooks.applyFilters(
				'blockera.products.isCompanionPlugin',
				false
			),
			'blockera.products.isCompanionPlugin'
		).to.equal(expected);
	});
}

/**
 * Assert blockera-one registered its companion plugin filter callback.
 */
export function assertBlockeraOneCompanionFilterRegistered() {
	cy.window().should((win) => {
		expect(
			win.wp.hooks.hasFilter(
				'blockera.products.isCompanionPlugin',
				'blockera-one/products.isCompanionPlugin'
			),
			'blockera-one/products.isCompanionPlugin filter'
		).to.equal(true);
	});
}

/**
 * Open the block editor styles panel for a new default paragraph block.
 */
export function openParagraphBlockStylesView() {
	cy.getBlock('default').type('Blockera One e2e', { delay: 0 });
	cy.getByAriaControls('styles-view').click();
}

/**
 * Scroll the Background → Clipping control into view in the styles panel.
 */
export function openBackgroundClippingSection() {
	cy.getParentContainer('Clipping').scrollIntoView();
}
