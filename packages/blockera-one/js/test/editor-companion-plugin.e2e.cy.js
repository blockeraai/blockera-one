/**
 * Blockera One + Blockera plugin installed and active.
 *
 * Category: companion-plugin (CI matrix via `*.companion-plugin.e2e.cy.js`)
 * wp-env: `.github/wp-env-configs/companion-plugin.json`
 *
 * Isolated from general `companion-plugin.e2e.cy.js` (theme-only, plugin absent).
 *
 * Current product behavior: the theme filter (priority 20) still reports
 * `isCompanionPlugin === false`, so companion-gated UI stays on. These specs
 * assert coexistence (both products loaded) plus that theme identity/gates.
 */

import {
	createPost,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	openParagraphBlockStylesView,
	openBackgroundClippingSection,
	getClippingCompanionWrapper,
	openCompanionInstallModalInEditor,
	closeCompanionInstallModal,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → companion plugin active', () => {
	describe('block editor', () => {
		beforeEach(() => {
			createPost();
		});

		it('loads both products and still reports theme companion identity', () => {
			assertBlockeraOneCompanionFilterRegistered();
			assertCompanionPluginFilter(false);

			cy.window().should((win) => {
				expect(
					win.wp?.hooks?.hasFilter(
						'blockera.products.isCompanionPlugin',
						'blockera/products.isCompanionPlugin'
					),
					'blockera plugin companion filter'
				).to.equal(true);
				expect(
					win.__blockeraOneSiteEditorMainPanelRegistered,
					'blockera-one site editor plugin'
				).to.equal(true);
			});
		});

		it('still gates background clipping behind the companion install notice', () => {
			openParagraphBlockStylesView();
			openBackgroundClippingSection();

			getClippingCompanionWrapper().within(() => {
				cy.get('button')
					.first()
					.should('have.css', 'pointer-events', 'none');
			});
		});

		it('opens the companion install modal from the clipping notice', () => {
			openCompanionInstallModalInEditor();
			closeCompanionInstallModal();
		});

		it('opens the companion install modal when adding a tab', () => {
			cy.tabsResetWorkspaceStorage();
			cy.tabsResetTabsRelatedStorage();
			cy.get('.blockera-tabs-bar', { timeout: 60000 }).should(
				'be.visible'
			);

			cy.tabsOpenAddTabWithoutCompanionStub();

			cy.tabsExpectCompanionLimitPrompt();
			cy.get('.commands-command-menu [cmdk-input]').should('not.exist');
		});
	});

	describe('site editor', () => {
		beforeEach(() => {
			openSiteEditorViewMode('/');
		});

		it('keeps blockera-one chrome while theme companion identity stays false', () => {
			assertBlockeraOneCompanionFilterRegistered();
			assertCompanionPluginFilter(false);
			assertSiteEditorChrome();
			assertSiteEditorMainNav();
			cy.tabsExpectNoCompanionLimitPrompt();
		});
	});
});
