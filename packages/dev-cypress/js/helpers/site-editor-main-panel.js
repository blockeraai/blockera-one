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
	navPerformance: 'blockera-site-editor-nav-performance',
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
	performancePanel: 'blockera-site-editor-performance-panel',
	performanceDisableEmojis: 'blockera-site-editor-performance-disable-emojis',
	stylesPanel: 'blockera-site-editor-styles-panel',
	stylesActions: 'blockera-site-editor-styles-actions',
	templatesPanel: 'blockera-site-editor-templates-panel',
	templatesNav: 'blockera-site-editor-templates-nav',
	templatesNavAll: 'blockera-site-editor-templates-nav-all',
	templatesNavHomepage: 'blockera-site-editor-templates-nav-homepage-root',
	templatesNavHomepageStatus:
		'blockera-site-editor-templates-nav-homepage-root-status',
	templatesNavBlogPosts:
		'blockera-site-editor-templates-nav-homepage-blog-posts',
	templatesNavBlogPostsStatus:
		'blockera-site-editor-templates-nav-homepage-blog-posts-status',
	templatesNavHomepageFrontPage:
		'blockera-site-editor-templates-nav-homepage-fallback:front-page',
	templatesNavHomepageFrontPageStatus:
		'blockera-site-editor-templates-nav-homepage-fallback:front-page-status',
	templatesNavHomepageHome:
		'blockera-site-editor-templates-nav-homepage-fallback:home',
	templatesNavHomepageHomeStatus:
		'blockera-site-editor-templates-nav-homepage-fallback:home-status',
	templatesNavHomepageIndex:
		'blockera-site-editor-templates-nav-homepage-fallback:index',
	templatesNavHomepageIndexStatus:
		'blockera-site-editor-templates-nav-homepage-fallback:index-status',
	templatesNavHeader: 'blockera-site-editor-templates-nav-parts-header',
	templatesParts: 'blockera-site-editor-templates-parts',
	drillDown: 'blockera-site-editor-drill-down',
	drillDownBack: 'blockera-site-editor-drill-down-back',
};

export const DISABLE_EMOJIS_SETTING = 'blockera_one_disable_emojis';

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
 * Assert Styles / Identity / Homepage / Performance / Templates drill-down chrome:
 * hub + branding stay, main nav collapses, back control present.
 */
export function assertSiteEditorDrillDown() {
	assertSiteEditorChrome();
	getSiteEditorNav().should('not.exist');
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.drillDown, {
		timeout: 20000,
	}).should('be.visible');
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.drillDownBack).should('be.visible');
}

/**
 * Assert Templates purpose-nav drill-down is mounted.
 */
export function assertSiteEditorTemplatesNav() {
	assertSiteEditorDrillDown();
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesPanel, {
		timeout: 20000,
	}).should('be.visible');
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should('be.visible');
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavAll).should('be.visible');
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavHomepage).should(
		'be.visible'
	);
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavHomepageFrontPage).should(
		'not.exist'
	);
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavHomepage).click();
	/* Active homepage winner is hidden; other available layers (e.g. Index) show. */
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavHomepageIndex).should(
		'be.visible'
	);
}

/**
 * Click drill-down Back and assert Design-root main nav is restored.
 *
 * @param {string} [routeFragment] Optional `p` path fragment that must leave the URL (e.g. `identity`).
 */
export function clickSiteEditorDrillDownBack(routeFragment) {
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.drillDownBack)
		.should('be.visible')
		.click();
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.drillDown).should('not.exist');
	if (routeFragment) {
		cy.location('search').should('not.include', routeFragment);
	}
	assertSiteEditorChrome();
	assertSiteEditorMainNav();
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
		SITE_EDITOR_TEST_IDS.navPerformance,
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

/**
 * Persist dirty `root/site` edits (Save Hub equivalent for site settings).
 * Note: `saveSiteEditorDirtyEntities` intentionally skips `root/site`.
 *
 * @return {Cypress.Chainable}
 */
export function saveEditedSiteRecord() {
	return cy.window().then((win) => {
		return win.wp.data
			.dispatch('core')
			.saveEditedEntityRecord('root', 'site');
	});
}

/**
 * Authenticated REST helper using `wpApiSettings.nonce` + `rest_route`.
 *
 * @param {string} route Route after `/wp/v2/` (e.g. `settings`, `pages`).
 * @param {Object} [options] Cypress request options (`method`, `body`, …).
 * @return {Cypress.Chainable}
 */
export function siteEditorRestRequest(route, options = {}) {
	const testURL = (Cypress.env('testURL') || '').replace(/\/$/, '');
	const path = String(route || '').replace(/^\//, '');
	const url = `${testURL}/?rest_route=/wp/v2/${path}`;

	return cy.window().then((win) => {
		const nonce = win.wpApiSettings?.nonce;
		expect(nonce, 'wpApiSettings.nonce').to.be.a('string').and.not.be.empty;

		return cy.request({
			url,
			headers: {
				'X-WP-Nonce': nonce,
				...(options.headers || {}),
			},
			...options,
		});
	});
}

/**
 * Update a Site Editor settings field via authenticated REST `/wp/v2/settings`.
 *
 * @param {Object} body Settings payload.
 * @return {Cypress.Chainable}
 */
export function updateSiteSettingsViaRest(body) {
	return siteEditorRestRequest('settings', {
		method: 'POST',
		body,
	});
}

/**
 * Set Reading settings used by Templates Homepage purpose-nav.
 *
 * @param {{
 *   showOnFront: 'posts' | 'page',
 *   pageOnFront?: number | null,
 *   pageForPosts?: number | null,
 * }} options
 * @return {Cypress.Chainable}
 */
export function setReadingSettings({
	showOnFront,
	pageOnFront = null,
	pageForPosts = null,
}) {
	const body = {
		show_on_front: showOnFront,
	};

	if (showOnFront === 'page') {
		body.page_on_front = pageOnFront || 0;
		body.page_for_posts = pageForPosts || 0;
	} else {
		body.page_on_front = 0;
		body.page_for_posts = 0;
	}

	return updateSiteSettingsViaRest(body);
}

/**
 * Create a published page via REST.
 *
 * @param {{ title?: string, content?: string }} [options]
 * @return {Cypress.Chainable<number>} Resolves to the page id.
 */
export function createSiteEditorPage({
	title = `E2E Page ${Date.now()}`,
	content = '<!-- wp:paragraph --><p>E2E page</p><!-- /wp:paragraph -->',
} = {}) {
	return siteEditorRestRequest('pages', {
		method: 'POST',
		body: {
			title,
			content,
			status: 'publish',
		},
	}).then((response) => {
		expect(response.status).to.be.oneOf([200, 201]);
		const id = response.body?.id;
		expect(id, 'created page id').to.be.a('number');
		return id;
	});
}

/**
 * Delete a page via REST (force).
 *
 * @param {number|string} pageId
 * @return {Cypress.Chainable}
 */
export function deleteSiteEditorPage(pageId) {
	if (!pageId) {
		return cy.wrap(null);
	}

	return siteEditorRestRequest(`pages/${pageId}?force=true`, {
		method: 'DELETE',
		failOnStatusCode: false,
	});
}

/**
 * Create a custom `wp_template` via REST (e.g. slug `front-page`).
 *
 * @param {{ slug: string, title?: string, content?: string }} options
 * @return {Cypress.Chainable<{ id: string|number, slug: string }>}
 */
export function createWpTemplate({
	slug,
	title,
	content = '<!-- wp:paragraph --><p>E2E template</p><!-- /wp:paragraph -->',
}) {
	expect(slug, 'template slug').to.be.a('string').and.not.be.empty;

	return siteEditorRestRequest('templates', {
		method: 'POST',
		body: {
			slug,
			title: title || slug,
			content,
			status: 'publish',
		},
	}).then((response) => {
		expect(response.status).to.be.oneOf([200, 201]);
		const id = response.body?.id;
		expect(id, 'created template id').to.exist;
		return { id, slug: response.body?.slug || slug };
	});
}

/**
 * Delete a `wp_template` via REST / data store (force).
 *
 * @param {string|number} templateId Theme-style id (`theme//slug`) or numeric.
 * @return {Cypress.Chainable}
 */
export function deleteWpTemplate(templateId) {
	if (!templateId) {
		return cy.wrap(null);
	}

	const id = String(templateId);

	return cy.window().then((win) => {
		const deleteRecord = win.wp?.data?.dispatch('core')?.deleteEntityRecord;

		if (typeof deleteRecord === 'function') {
			return deleteRecord('postType', 'wp_template', id, {
				force: true,
			}).catch(() => null);
		}

		// Encode the full id so `theme//slug` does not collapse in rest_route.
		const encoded = encodeURIComponent(id);
		return siteEditorRestRequest(`templates/${encoded}?force=true`, {
			method: 'DELETE',
			failOnStatusCode: false,
		});
	});
}

export function setDisableEmojisToggle(enabled) {
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.performanceDisableEmojis)
		.find('.components-form-toggle input[type="checkbox"]')
		.then(($input) => {
			const isChecked = $input.prop('checked');
			if (isChecked !== enabled) {
				cy.wrap($input).click({ force: true });
			}
		});
}

/**
 * Assert WP emoji detection script / styles on the front end.
 *
 * @param {{ present: boolean }} options
 */
export function assertFrontEndEmojiAssets({ present }) {
	const testURL = Cypress.env('testURL') || '';
	const frontUrl = testURL.replace(/\/$/, '') + '/';

	cy.visit(frontUrl, { failOnStatusCode: false });

	cy.document().then((doc) => {
		const html = doc.documentElement ? doc.documentElement.innerHTML : '';
		const hasAssets =
			html.includes('wp-emoji-release') ||
			html.includes('wp-emoji-loader') ||
			html.includes('wp-emoji-styles') ||
			html.includes('wp-emoji-settings') ||
			!!doc.querySelector(
				'script[src*="wp-emoji"], #wp-emoji-styles-inline-css, #wp-emoji-styles-css'
			);

		expect(
			hasAssets,
			present
				? 'expected WP emoji assets on the front end'
				: 'expected WP emoji assets to be removed from the front end'
		).to.equal(present);
	});
}
