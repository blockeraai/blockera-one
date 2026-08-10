/**
 * Templates purpose-nav → Homepage section + inline fallbacks.
 *
 * Category: templates (CI matrix via `*.templates.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	openTemplatesPurposeNav,
	assertTemplatesHomepageSection,
	assertStatusTooltip,
	setReadingSettings,
	createSiteEditorPage,
	deleteSiteEditorPage,
	setThemeTemplateHidden,
	ensureNoFrontPageTemplate,
	installFrontPageThemeTemplate,
} from '@blockera/dev-cypress/js/helpers';

const STATIC_STATUS = 'Static page';
const FALLBACK_STATUS = 'Fallback';

describe('Blockera One → Templates Homepage purpose-nav', () => {
	/** @type {number[]} */
	let createdPageIds = [];
	let homeTemplateHidden = false;
	let frontPageInstalled = false;

	function trackPage(id) {
		createdPageIds.push(id);
		return id;
	}

	function hideHomeTemplate() {
		setThemeTemplateHidden('home', true).then((result) => {
			expect(result?.ok, result?.message || 'hide home').to.eq(true);
			homeTemplateHidden = true;
		});
	}

	function showFrontPageTemplate() {
		installFrontPageThemeTemplate().then(() => {
			frontPageInstalled = true;
		});
	}

	function openFreshSiteEditor() {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
	}

	function resetReadingToPosts() {
		return setReadingSettings({ showOnFront: 'posts' });
	}

	before(() => {
		// Recover if a previous interrupted run left templates renamed/installed.
		setThemeTemplateHidden('home', false);
		ensureNoFrontPageTemplate();
	});

	beforeEach(() => {
		createdPageIds = [];
		homeTemplateHidden = false;
		frontPageInstalled = false;
	});

	afterEach(() => {
		openSiteEditorViewMode('/');

		resetReadingToPosts();

		createdPageIds.forEach((id) => {
			deleteSiteEditorPage(id);
		});

		if (frontPageInstalled) {
			ensureNoFrontPageTemplate();
			frontPageInstalled = false;
		} else {
			ensureNoFrontPageTemplate();
		}

		if (homeTemplateHidden) {
			setThemeTemplateHidden('home', false);
			homeTemplateHidden = false;
		}
	});

	describe('Latest posts (show_on_front = posts)', () => {
		it('default home + index: Index Fallback child; Homepage opens home', () => {
			ensureNoFrontPageTemplate();
			openFreshSiteEditor();
			resetReadingToPosts();
			openFreshSiteEditor();

			openTemplatesPurposeNav();
			assertTemplatesHomepageSection({
				homepageStatus: null,
				blogHomeVisible: false,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavHomepageIndex,
						statusTestId:
							SITE_EDITOR_TEST_IDS.templatesNavHomepageIndexStatus,
						statusLabel: FALLBACK_STATUS,
					},
				],
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavHomepageFrontPage,
					SITE_EDITOR_TEST_IDS.templatesNavHomepageHome,
				],
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavHomepage).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('boFilter=home');
			});
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should('exist');
		});

		it('front-page + home + index: Blog Home and Index Fallback children', () => {
			showFrontPageTemplate();
			openFreshSiteEditor();
			resetReadingToPosts();
			openFreshSiteEditor();

			openTemplatesPurposeNav();
			assertTemplatesHomepageSection({
				homepageStatus: null,
				blogHomeVisible: false,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavHomepageHome,
						statusTestId:
							SITE_EDITOR_TEST_IDS.templatesNavHomepageHomeStatus,
						statusLabel: FALLBACK_STATUS,
					},
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavHomepageIndex,
						statusTestId:
							SITE_EDITOR_TEST_IDS.templatesNavHomepageIndexStatus,
						statusLabel: FALLBACK_STATUS,
					},
				],
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavHomepageFrontPage,
				],
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavHomepage).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('front-page');
				expect(decoded).to.include('boFilter=front-page');
			});
		});

		it('front-page + index (home hidden): Index Fallback only', () => {
			hideHomeTemplate();
			showFrontPageTemplate();
			openFreshSiteEditor();
			resetReadingToPosts();
			openFreshSiteEditor();

			openTemplatesPurposeNav();
			assertTemplatesHomepageSection({
				homepageStatus: null,
				blogHomeVisible: false,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavHomepageIndex,
						statusTestId:
							SITE_EDITOR_TEST_IDS.templatesNavHomepageIndexStatus,
						statusLabel: FALLBACK_STATUS,
					},
				],
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavHomepageFrontPage,
					SITE_EDITOR_TEST_IDS.templatesNavHomepageHome,
				],
			});
		});

		it('index only (home hidden): no inline children; Homepage opens index', () => {
			hideHomeTemplate();
			ensureNoFrontPageTemplate();
			openFreshSiteEditor();
			resetReadingToPosts();
			openFreshSiteEditor();

			openTemplatesPurposeNav();
			assertTemplatesHomepageSection({
				homepageStatus: null,
				blogHomeVisible: false,
				children: [],
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavHomepageFrontPage,
					SITE_EDITOR_TEST_IDS.templatesNavHomepageHome,
					SITE_EDITOR_TEST_IDS.templatesNavHomepageIndex,
				],
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavHomepage).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('index');
				expect(decoded).to.include('boFilter=index');
			});
		});
	});

	describe('Static page (show_on_front = page)', () => {
		it('no front-page: Static badges, Index Fallback, page entity paths', () => {
			ensureNoFrontPageTemplate();
			openFreshSiteEditor();

			createSiteEditorPage({ title: `Homepage ${Date.now()}` })
				.then((homeId) => {
					trackPage(homeId);
					return createSiteEditorPage({
						title: `Posts ${Date.now()}`,
					}).then((postsId) => {
						trackPage(postsId);
						return setReadingSettings({
							showOnFront: 'page',
							pageOnFront: homeId,
							pageForPosts: postsId,
						}).then(() => ({ homeId, postsId }));
					});
				})
				.then(({ homeId, postsId }) => {
					openFreshSiteEditor();
					openTemplatesPurposeNav();

					assertTemplatesHomepageSection({
						homepageStatus: STATIC_STATUS,
						blogHomeVisible: true,
						blogHomeStatus: STATIC_STATUS,
						children: [
							{
								testId: SITE_EDITOR_TEST_IDS.templatesNavHomepageIndex,
								statusTestId:
									SITE_EDITOR_TEST_IDS.templatesNavHomepageIndexStatus,
								statusLabel: FALLBACK_STATUS,
							},
						],
						absentChildTestIds: [
							SITE_EDITOR_TEST_IDS.templatesNavHomepageFrontPage,
							SITE_EDITOR_TEST_IDS.templatesNavHomepageHome,
						],
					});

					cy.getByDataTest(
						SITE_EDITOR_TEST_IDS.templatesNavHomepage
					).click();
					cy.location('search').should((search) => {
						const decoded = decodeURIComponent(search);
						expect(decoded).to.include(`/page/${homeId}`);
						expect(decoded).to.include('boFilter=homepage-root');
					});
					cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should(
						'exist'
					);

					cy.getByDataTest(
						SITE_EDITOR_TEST_IDS.templatesNavBlogPosts
					).click();
					cy.location('search').should((search) => {
						const decoded = decodeURIComponent(search);
						expect(decoded).to.include(`/page/${postsId}`);
						expect(decoded).to.include('boFilter=blog-posts');
					});
					cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should(
						'exist'
					);
				});
		});

		it('with front-page: Homepage opens front-page template; Index Fallback', () => {
			showFrontPageTemplate();
			openFreshSiteEditor();

			createSiteEditorPage({ title: `Homepage ${Date.now()}` })
				.then((homeId) => {
					trackPage(homeId);
					return createSiteEditorPage({
						title: `Posts ${Date.now()}`,
					}).then((postsId) => {
						trackPage(postsId);
						return setReadingSettings({
							showOnFront: 'page',
							pageOnFront: homeId,
							pageForPosts: postsId,
						}).then(() => ({ homeId, postsId }));
					});
				})
				.then(({ postsId }) => {
					openFreshSiteEditor();
					openTemplatesPurposeNav();

					assertTemplatesHomepageSection({
						homepageStatus: STATIC_STATUS,
						blogHomeVisible: true,
						blogHomeStatus: STATIC_STATUS,
						children: [
							{
								testId: SITE_EDITOR_TEST_IDS.templatesNavHomepageIndex,
								statusTestId:
									SITE_EDITOR_TEST_IDS.templatesNavHomepageIndexStatus,
								statusLabel: FALLBACK_STATUS,
							},
						],
						absentChildTestIds: [
							SITE_EDITOR_TEST_IDS.templatesNavHomepageFrontPage,
							SITE_EDITOR_TEST_IDS.templatesNavHomepageHome,
						],
					});

					cy.getByDataTest(
						SITE_EDITOR_TEST_IDS.templatesNavHomepage
					).click();
					cy.location('search').should((search) => {
						const decoded = decodeURIComponent(search);
						expect(decoded).to.include('front-page');
						expect(decoded).to.include('boFilter=front-page');
						expect(decoded).to.not.match(/\/page\/\d+/);
					});

					cy.getByDataTest(
						SITE_EDITOR_TEST_IDS.templatesNavBlogPosts
					).click();
					cy.location('search').should((search) => {
						const decoded = decodeURIComponent(search);
						expect(decoded).to.include(`/page/${postsId}`);
					});
				});
		});

		it('homepage page only: Blog Home section absent; Index Fallback', () => {
			ensureNoFrontPageTemplate();
			openFreshSiteEditor();

			createSiteEditorPage({ title: `Homepage ${Date.now()}` }).then(
				(homeId) => {
					trackPage(homeId);
					return setReadingSettings({
						showOnFront: 'page',
						pageOnFront: homeId,
						pageForPosts: null,
					});
				}
			);

			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesHomepageSection({
				homepageStatus: STATIC_STATUS,
				blogHomeVisible: false,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavHomepageIndex,
						statusTestId:
							SITE_EDITOR_TEST_IDS.templatesNavHomepageIndexStatus,
						statusLabel: FALLBACK_STATUS,
					},
				],
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavHomepageFrontPage,
					SITE_EDITOR_TEST_IDS.templatesNavHomepageHome,
					SITE_EDITOR_TEST_IDS.templatesNavBlogPosts,
				],
			});
		});

		it('status tooltips: Index Fallback and Static page headings', () => {
			ensureNoFrontPageTemplate();
			openFreshSiteEditor();

			createSiteEditorPage({ title: `Homepage ${Date.now()}` }).then(
				(homeId) => {
					trackPage(homeId);
					return createSiteEditorPage({
						title: `Posts ${Date.now()}`,
					}).then((postsId) => {
						trackPage(postsId);
						return setReadingSettings({
							showOnFront: 'page',
							pageOnFront: homeId,
							pageForPosts: postsId,
						});
					});
				}
			);

			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesHomepageSection({
				homepageStatus: STATIC_STATUS,
				blogHomeVisible: true,
				blogHomeStatus: STATIC_STATUS,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavHomepageIndex,
						statusTestId:
							SITE_EDITOR_TEST_IDS.templatesNavHomepageIndexStatus,
						statusLabel: FALLBACK_STATUS,
					},
				],
			});

			assertStatusTooltip(
				SITE_EDITOR_TEST_IDS.templatesNavHomepageStatus,
				{
					heading: 'Static page',
					bodyIncludes: 'Reading settings',
				}
			);

			assertStatusTooltip(
				SITE_EDITOR_TEST_IDS.templatesNavHomepageIndexStatus,
				{
					heading: 'index.html template',
					bodyIncludes: 'Final fallback for all templates',
				}
			);
		});
	});
});
