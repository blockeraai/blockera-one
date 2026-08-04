/**
 * Blockera One → Site Identity + Homepage Settings secondary panels.
 *
 * Category: site-editor (CI matrix via `*.site-editor.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	clickSiteEditorNav,
	assertEditedSiteRecord,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → Site Editor Identity & Homepage panels', () => {
	beforeEach(() => {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
	});

	it('opens Site Identity and edits title / tagline in root/site', () => {
		const title = `Blockera One Title ${Date.now()}`;
		const tagline = `Blockera One Tagline ${Date.now()}`;

		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navIdentity);

		cy.location('search').should('include', 'identity');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.identityPanel, {
			timeout: 20000,
		}).should('be.visible');
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

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.navIdentity).should(
			'have.attr',
			'aria-current',
			'page'
		);
	});

	it('opens Homepage Settings and toggles posts vs static homepage', () => {
		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navHomepage);

		cy.location('search').should('include', 'homepage');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.homepagePanel, {
			timeout: 20000,
		}).should('be.visible');

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
	});
});
