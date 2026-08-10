/**
 * Blockera One → Site Editor main panel (view-mode branding, nav).
 *
 * Category: site-editor (CI matrix via `*.site-editor.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	assertSiteEditorDrillDown,
	assertSiteEditorTemplatesNav,
	clickSiteEditorNav,
	clickSiteEditorDrillDownBack,
	getSiteEditorNav,
	getSiteEditorHeader,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → Site Editor main panel chrome', () => {
	beforeEach(() => {
		openSiteEditorViewMode('/');
	});

	it('shows Blockera branding under core site hub', () => {
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
	});

	it('keeps branding when drilling into Pages (nav unmounts)', () => {
		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navPages);

		getSiteEditorHeader().should('be.visible');
		getSiteEditorNav().should('not.exist');

		cy.location('search').should('include', 'page');
	});

	it('opens Templates purpose-nav drill-down then Back restores main nav', () => {
		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navTemplates);

		cy.location('search').should('include', 'template');
		/* Expands Homepage then restores All browse (preview has no DataViews). */
		assertSiteEditorTemplatesNav();
		/* Core PageTemplates DataViews on All browse (not a Blockera custom list). */
		cy.get(
			'.edit-site-page-templates, .dataviews-wrapper, .dataviews-view-grid, .dataviews-view-table',
			{ timeout: 20000 }
		).should('exist');

		/* Header/Footer/Sidebar Area Hub coverage: templates-parts.templates.e2e.cy.js */
		clickSiteEditorDrillDownBack('template');
	});

	it('opens Styles as sidebar drill-down then Back restores main nav', () => {
		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navStyles);

		cy.location('search').should('include', 'styles');
		assertSiteEditorDrillDown();
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.stylesPanel, {
			timeout: 20000,
		}).should('be.visible');
		cy.get('.edit-site-layout__area').should('not.exist');
		/* Duplicate Page title is hidden; Style Book lives on drill-down row. */
		cy.get(
			'.blockera-site-editor-styles-panel .admin-ui-page__header'
		).should('not.be.visible');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.stylesActions, {
			timeout: 20000,
		})
			.find(
				'.admin-ui-page__header-actions, .edit-site-styles__header-actions'
			)
			.should('exist');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.stylesActions)
			.find('button[aria-label="Style Book"]')
			.should('be.visible');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.stylesActions)
			.find('.components-dropdown-menu')
			.should('not.be.visible');

		clickSiteEditorDrillDownBack('styles');
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
});
