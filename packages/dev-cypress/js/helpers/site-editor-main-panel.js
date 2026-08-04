/**
 * Cypress helpers for Blockera One Site Editor main panel (view-mode chrome).
 */

import { closeWelcomeGuide } from './editor';
import { goTo } from './site-navigation';

export const SITE_EDITOR_TEST_IDS = {
	hub: 'blockera-site-editor-site-hub',
	hubDashboard: 'blockera-site-editor-site-hub-dashboard',
	hubTitle: 'blockera-site-editor-site-hub-title',
	hubCommand: 'blockera-site-editor-site-hub-command',
	header: 'blockera-site-editor-main-panel-header',
	headerTitle: 'blockera-site-editor-main-panel-header-title',
	headerMore: 'blockera-site-editor-main-panel-header-more',
	resetStyles: 'blockera-site-editor-reset-styles',
	nav: 'blockera-site-editor-main-navigation',
	navStyles: 'blockera-site-editor-nav-styles',
	navNavigation: 'blockera-site-editor-nav-navigation',
	navPages: 'blockera-site-editor-nav-pages',
	navTemplates: 'blockera-site-editor-nav-templates',
	navPatterns: 'blockera-site-editor-nav-patterns',
	navIdentity: 'blockera-site-editor-nav-identity',
	navHomepage: 'blockera-site-editor-nav-homepage',
	navCommunity: 'blockera-site-editor-nav-community',
	navRoadmap: 'blockera-site-editor-nav-roadmap',
	navFeatureRequests: 'blockera-site-editor-nav-feature-requests',
	identityPanel: 'blockera-site-editor-identity-panel',
	identityTitle: 'blockera-site-editor-identity-title',
	identityTagline: 'blockera-site-editor-identity-tagline',
	identityLogoChoose: 'blockera-site-editor-identity-logo-choose',
	homepagePanel: 'blockera-site-editor-homepage-panel',
	homepagePosts: 'blockera-site-editor-homepage-posts',
	homepageStatic: 'blockera-site-editor-homepage-static',
	homepagePage: 'blockera-site-editor-homepage-page',
	homepagePostsPage: 'blockera-site-editor-homepage-posts-page',
};

/**
 * Open Site Editor in view mode (sidebar chrome visible).
 * Unlike `openSiteEditor()`, this does not force `canvas=edit`.
 */
export function openSiteEditorViewMode(path = '/') {
	const encodedPath = encodeURIComponent(path);
	goTo(`/wp-admin/site-editor.php?p=${encodedPath}`).then(() => {
		// eslint-disable-next-line cypress/no-unnecessary-waiting
		cy.wait(2000);
		closeWelcomeGuide();
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.hub, { timeout: 60000 }).should(
			'be.visible'
		);
	});
}

export function getSiteEditorHub() {
	return cy.getByDataTest(SITE_EDITOR_TEST_IDS.hub);
}

export function getSiteEditorHeader() {
	return cy.getByDataTest(SITE_EDITOR_TEST_IDS.header);
}

export function getSiteEditorNav() {
	return cy.getByDataTest(SITE_EDITOR_TEST_IDS.nav);
}

export function clickSiteEditorNav(testId) {
	return cy.getByDataTest(testId).should('be.visible').click();
}

/**
 * Assert Blockera Site Editor chrome is mounted (hub + branding).
 */
export function assertSiteEditorChrome() {
	cy.get('body').should('have.class', 'has-blockera-site-editor-main-panel');
	getSiteEditorHub().should('be.visible');
	getSiteEditorHeader().should('be.visible');
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.headerTitle).should(
		'contain.text',
		'Blockera One'
	);
	// Core hub stays in DOM but is CSS-hidden; Blockera hub is the visible one.
	cy.get('.edit-site-layout__sidebar > .edit-site-site-hub').should(
		'not.be.visible'
	);
}

/**
 * Assert Design-root nav categories are present.
 */
export function assertSiteEditorMainNav() {
	getSiteEditorNav().should('be.visible');
	[
		SITE_EDITOR_TEST_IDS.navStyles,
		SITE_EDITOR_TEST_IDS.navNavigation,
		SITE_EDITOR_TEST_IDS.navPages,
		SITE_EDITOR_TEST_IDS.navTemplates,
		SITE_EDITOR_TEST_IDS.navPatterns,
		SITE_EDITOR_TEST_IDS.navIdentity,
		SITE_EDITOR_TEST_IDS.navHomepage,
		SITE_EDITOR_TEST_IDS.navCommunity,
		SITE_EDITOR_TEST_IDS.navRoadmap,
		SITE_EDITOR_TEST_IDS.navFeatureRequests,
	].forEach((id) => {
		cy.getByDataTest(id).should('exist');
	});
}

/**
 * Read `root/site` edited entity from the editor data store.
 *
 * @param {(site: Object) => void} assertFn Assertion callback.
 */
export function assertEditedSiteRecord(assertFn) {
	cy.window().then((win) => {
		const site = win.wp.data
			.select('core')
			.getEditedEntityRecord('root', 'site');
		assertFn(site || {});
	});
}
