/**
 * Cypress helpers for blockera-one companion plugin identity in the theme.
 */

import { goTo } from './site-navigation';

export const COMPANION_INSTALL_NOTICE = 'Install Companion Plugin to Unlock';

export const COMPANION_INSTALL_MODAL_SELECTOR =
	'.blockera-component-feature-wrapper-companion-modal';

export const COMPANION_NOTICE_TEXT_SELECTOR =
	'.blockera-component-feature-wrapper__notice__text';

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

/**
 * Open the Block Manager tab on Blockera settings.
 */
export function openBlockManagerSettingsPanel() {
	goTo('/wp-admin/admin.php?page=blockera-settings-block-manager');
	cy.get('.blockera-settings-active-panel').should('be.visible');
}

/**
 * Locate the companion FeatureWrapper for a block manager category section.
 *
 * @param {string} categorySlug Block category slug (e.g. text, media).
 */
export function getBlockManagerCategoryCompanionWrapper(categorySlug) {
	return cy
		.getByDataTest(`${categorySlug}-category=disable`)
		.parents('[data-test="feature-wrapper-companion"]')
		.first();
}

/**
 * Assert the companion install notice is visible within the current subject.
 */
export function assertCompanionInstallNoticeVisible() {
	cy.get(COMPANION_NOTICE_TEXT_SELECTOR)
		.should('be.visible')
		.and('contain.text', COMPANION_INSTALL_NOTICE);
}

/**
 * Click the companion install notice within the current subject.
 */
export function clickCompanionInstallNotice() {
	cy.get(COMPANION_NOTICE_TEXT_SELECTOR).click();
}

/**
 * Assert the companion install modal is open.
 */
export function assertCompanionInstallModalVisible() {
	cy.get(COMPANION_INSTALL_MODAL_SELECTOR)
		.should('be.visible')
		.and('contain.text', 'Blockera Site Builder');
}

/**
 * Close the companion install modal.
 */
export function closeCompanionInstallModal() {
	cy.get(COMPANION_INSTALL_MODAL_SELECTOR)
		.find('button[aria-label="Close"]')
		.click();

	cy.get(COMPANION_INSTALL_MODAL_SELECTOR).should('not.exist');
}
