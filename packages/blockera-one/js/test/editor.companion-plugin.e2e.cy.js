/**
 * Blockera One + Blockera plugin installed and active.
 *
 * Category: companion-plugin (CI matrix via `*.companion-plugin.e2e.cy.js`)
 * wp-env: `.github/wp-env-configs/companion-plugin.json`
 *
 * Isolated from general `companion-plugin.e2e.cy.js` (theme-only, plugin absent).
 */

import {
	createPost,
	goTo,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	openParagraphBlockStylesView,
	openBackgroundClippingSection,
	COMPANION_EDITOR_WRAPPER_SELECTOR,
	COMPANION_INSTALL_MODAL_SELECTOR,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → companion plugin active', () => {
	describe('WordPress runtime', () => {
		it('has Blockera One theme and Blockera plugin active', () => {
			goTo('/wp-admin/themes.php', true);
			cy.get('.theme.active').should('contain.text', 'Blockera One');

			goTo('/wp-admin/plugins.php', true);
			cy.contains('#the-list tr.active', 'Blockera Site Builder').should(
				'exist'
			);
		});
	});

	describe('block editor', () => {
		beforeEach(() => {
			createPost();
		});

		it('loads blockera-one assets and reports the companion plugin as active', () => {
			assertBlockeraOneCompanionFilterRegistered();
			assertCompanionPluginFilter(true);

			cy.window().should((win) => {
				expect(
					win.__blockeraOneSiteEditorMainPanelRegistered,
					'blockera-one site editor plugin'
				).to.equal(true);
			});
		});

		it('does not gate editor features behind the companion install notice', () => {
			openParagraphBlockStylesView();
			openBackgroundClippingSection();

			cy.get(COMPANION_EDITOR_WRAPPER_SELECTOR).should('not.exist');
			cy.getParentContainer('Clipping').should('be.visible');
			cy.get(COMPANION_INSTALL_MODAL_SELECTOR).should('not.exist');
		});

		it('opens the add-tab command palette instead of the companion install modal', () => {
			cy.tabsResetWorkspaceStorage();
			cy.tabsResetTabsRelatedStorage();
			cy.get('.blockera-tabs-bar', { timeout: 60000 }).should(
				'be.visible'
			);

			cy.tabsOpenAddTabWithoutCompanionStub();

			cy.get('.commands-command-menu [cmdk-input]', {
				timeout: 20000,
			}).should('be.visible');
			cy.tabsExpectNoCompanionLimitPrompt();
			cy.get(COMPANION_INSTALL_MODAL_SELECTOR).should('not.exist');
		});
	});

	describe('site editor', () => {
		beforeEach(() => {
			openSiteEditorViewMode('/');
		});

		it('keeps blockera-one chrome with the companion plugin active', () => {
			assertBlockeraOneCompanionFilterRegistered();
			assertCompanionPluginFilter(true);
			assertSiteEditorChrome();
			assertSiteEditorMainNav();
			cy.tabsExpectNoCompanionLimitPrompt();
		});
	});
});
