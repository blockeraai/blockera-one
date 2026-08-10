/**
 * Blockera One → Site Identity + Homepage Settings sidebar drill-down panels.
 *
 * Category: site-editor (CI matrix via `*.site-editor.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorDrillDown,
	assertSiteEditorMainNav,
	clickSiteEditorNav,
	clickSiteEditorDrillDownBack,
	assertEditedSiteRecord,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → Site Editor Identity & Homepage panels', () => {
	beforeEach(() => {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
	});

	it('opens Site Identity as sidebar drill-down, edits title / tagline, then Back restores main nav', () => {
		const title = `Blockera One Title ${Date.now()}`;
		const tagline = `Blockera One Tagline ${Date.now()}`;

		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navIdentity);

		cy.location('search').should('include', 'identity');
		assertSiteEditorDrillDown();
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.identityPanel).should(
			'be.visible'
		);
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.identityLogoChoose).should(
			'be.visible'
		);

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.identityTitle)
			.find('input')
			.clear({ force: true })
			.type(title, { delay: 0 });

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.identityTagline)
			.find('input')
			.clear({ force: true })
			.type(tagline, { delay: 0 });

		assertEditedSiteRecord((site) => {
			expect(site.title).to.equal(title);
			expect(site.description).to.equal(tagline);
		});

		clickSiteEditorDrillDownBack('identity');
	});

	it('opens Homepage Settings as sidebar drill-down, toggles posts vs static, then Back restores main nav', () => {
		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navHomepage);

		cy.location('search').should('include', 'homepage');
		assertSiteEditorDrillDown();
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.homepagePanel).should(
			'be.visible'
		);

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.homepageStatic).check({
			force: true,
		});

		assertEditedSiteRecord((site) => {
			expect(site.show_on_front).to.equal('page');
		});

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.homepagePage)
			.find('select')
			.should('not.be.disabled');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.homepagePostsPage)
			.find('select')
			.should('not.be.disabled');

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.homepagePosts).check({
			force: true,
		});

		assertEditedSiteRecord((site) => {
			expect(site.show_on_front).to.equal('posts');
		});

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.homepagePage)
			.find('select')
			.should('be.disabled');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.homepagePostsPage)
			.find('select')
			.should('be.disabled');

		clickSiteEditorDrillDownBack('homepage');
	});
});
