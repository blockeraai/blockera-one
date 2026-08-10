/**
 * Templates purpose-nav → Special Templates section.
 *
 * Category: templates-2 (CI matrix via `*.templates-2.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	openTemplatesPurposeNav,
	openTemplatesNavItem,
	assertTemplatesSpecialSection,
	assertTemplatesMissingBase,
	hideSpecialThemeTemplate,
	restoreSpecialThemeTemplate,
} from '@blockera/dev-cypress/js/helpers';

const SPECIAL_SLUGS = ['search', '404'];

describe('Blockera One → Templates Special Templates purpose-nav', () => {
	/** @type {string[]} */
	let hiddenSlugs = [];

	function trackHidden(slug) {
		if (!hiddenSlugs.includes(slug)) {
			hiddenSlugs.push(slug);
		}
	}

	function openFreshSiteEditor() {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
	}

	function restoreHiddenSpecialTemplates() {
		hiddenSlugs = [];
		// Always restore shipped Special templates after interrupted runs.
		SPECIAL_SLUGS.forEach((slug) => {
			restoreSpecialThemeTemplate(slug);
		});
	}

	before(() => {
		SPECIAL_SLUGS.forEach((slug) => {
			restoreSpecialThemeTemplate(slug);
		});
	});

	beforeEach(() => {
		hiddenSlugs = [];
	});

	afterEach(() => {
		openSiteEditorViewMode('/');
		restoreHiddenSpecialTemplates();
	});

	after(() => {
		SPECIAL_SLUGS.forEach((slug) => {
			restoreSpecialThemeTemplate(slug);
		});
	});

	describe('Default theme state', () => {
		it('shows Search + 404 in order; opens canvases; no children', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSpecialSection();

			// Search is the first row; 404 is the second.
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav)
				.find('.blockera-site-editor-templates-nav__section')
				.contains(
					'.blockera-site-editor-templates-nav__section-title',
					'Special Templates'
				)
				.parents('.blockera-site-editor-templates-nav__section')
				.find('.blockera-site-editor-templates-nav__items [data-test]')
				.then(($rows) => {
					const testIds = [...$rows].map((el) =>
						el.getAttribute('data-test')
					);
					expect(testIds[0]).to.eq(
						SITE_EDITOR_TEST_IDS.templatesNavSearch
					);
					expect(testIds[1]).to.eq(
						SITE_EDITOR_TEST_IDS.templatesNavNotFound
					);
				});

			openTemplatesNavItem(SITE_EDITOR_TEST_IDS.templatesNavSearch);

			// Remount purpose-nav after canvas preview.
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			openTemplatesNavItem(SITE_EDITOR_TEST_IDS.templatesNavNotFound);
		});
	});

	describe('Search', () => {
		it('missing state, Index fallback, and Add specific template', () => {
			hideSpecialThemeTemplate('search');
			trackHidden('search');

			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSpecialSection();

			openTemplatesNavItem(SITE_EDITOR_TEST_IDS.templatesNavSearch);

			assertTemplatesMissingBase({
				headingIncludes: 'Search Results',
				messageIncludes: 'Index',
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesMissingFallback
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('index');
				expect(decoded).to.include('boFilter=index');
			});
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should('exist');

			openFreshSiteEditor();
			openTemplatesPurposeNav();
			openTemplatesNavItem(SITE_EDITOR_TEST_IDS.templatesNavSearch);

			assertTemplatesMissingBase({
				headingIncludes: 'Search Results',
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesAddSpecific).click();
			cy.location('search', { timeout: 30000 }).should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('canvas=edit');
				expect(decoded).to.include('boFilter=search');
				expect(decoded).to.include('wp_template');
			});
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesMissing).should(
				'not.exist'
			);

			// Created DB template wins while theme file stays hidden — restore fully.
			restoreSpecialThemeTemplate('search');
			hiddenSlugs = hiddenSlugs.filter((slug) => slug !== 'search');

			openFreshSiteEditor();
			openTemplatesPurposeNav();
			assertTemplatesSpecialSection();

			openTemplatesNavItem(SITE_EDITOR_TEST_IDS.templatesNavSearch);
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.not.include('canvas=edit');
			});
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesMissing).should(
				'not.exist'
			);
		});
	});

	describe('404 Page', () => {
		it('missing state, Index fallback, and Add specific template', () => {
			hideSpecialThemeTemplate('404');
			trackHidden('404');

			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSpecialSection();

			openTemplatesNavItem(SITE_EDITOR_TEST_IDS.templatesNavNotFound);

			assertTemplatesMissingBase({
				headingIncludes: 'Page: 404',
				messageIncludes: 'Index',
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesMissingFallback
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('index');
				expect(decoded).to.include('boFilter=index');
			});
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should('exist');

			openFreshSiteEditor();
			openTemplatesPurposeNav();
			openTemplatesNavItem(SITE_EDITOR_TEST_IDS.templatesNavNotFound);

			assertTemplatesMissingBase({
				headingIncludes: 'Page: 404',
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesAddSpecific).click();
			cy.location('search', { timeout: 30000 }).should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('canvas=edit');
				expect(decoded).to.include('boFilter=404');
				expect(decoded).to.include('wp_template');
			});
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesMissing).should(
				'not.exist'
			);

			restoreSpecialThemeTemplate('404');
			hiddenSlugs = hiddenSlugs.filter((slug) => slug !== '404');

			openFreshSiteEditor();
			openTemplatesPurposeNav();
			assertTemplatesSpecialSection();

			openTemplatesNavItem(SITE_EDITOR_TEST_IDS.templatesNavNotFound);
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.not.include('canvas=edit');
			});
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesMissing).should(
				'not.exist'
			);
		});
	});
});
