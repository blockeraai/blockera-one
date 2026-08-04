/**
 * Blockera One → Site Editor main panel (view-mode hub, branding, nav).
 *
 * Category: site-editor (CI matrix via `*.site-editor.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	clickSiteEditorNav,
	getSiteEditorNav,
	getSiteEditorHeader,
	getSiteEditorHub,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → Site Editor main panel chrome', () => {
	beforeEach(() => {
		openSiteEditorViewMode('/');
	});

	it('shows Blockera hub + branding and hides core site hub', () => {
		assertSiteEditorChrome();
		assertSiteEditorMainNav();

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.hubDashboard)
			.should('have.attr', 'href')
			.and('include', 'wp-admin');

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.hubTitle)
			.should('have.attr', 'target', '_blank')
			.and('have.attr', 'href')
			.and('not.be.empty');
	});

	it('opens the command palette from the site hub search button', () => {
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.hubCommand).click();
		cy.get('.commands-command-menu, [class*="commands-command-menu"]', {
			timeout: 10000,
		}).should('exist');
	});

	it('keeps hub + branding when drilling into Pages (nav unmounts)', () => {
		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navPages);

		getSiteEditorHub().should('be.visible');
		getSiteEditorHeader().should('be.visible');
		getSiteEditorNav().should('not.exist');

		cy.location('search').should('include', 'page');
	});

	it('navigates Design → Styles via Blockera nav', () => {
		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navStyles);

		cy.location('search').should('include', 'styles');
		getSiteEditorNav().should('be.visible');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.navStyles).should(
			'have.attr',
			'aria-current',
			'page'
		);
	});

	it('exposes Resource links with site-editor UTM params', () => {
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.navCommunity)
			.should('have.attr', 'target', '_blank')
			.and('have.attr', 'href')
			.and('include', 'utm_source=blockera-one-site-editor');

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.navRoadmap)
			.should('have.attr', 'href')
			.and('include', 'utm_source=blockera-one-site-editor');

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.navFeatureRequests)
			.should('have.attr', 'href')
			.and('include', 'utm_source=blockera-one-site-editor');
	});

	it('opens the branding More menu with Reset styles', () => {
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.headerMore).click();
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.resetStyles).should('be.visible');
	});
});
