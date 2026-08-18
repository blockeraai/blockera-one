/**
 * Templates purpose-nav → Header / Footer / Sidebar Design/Settings
 * builder + Area Hub on canvas.
 *
 * Category: templates (CI matrix via `*.templates.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	openTemplatesPurposeNav,
	assertTemplatesPartsNav,
	openTemplatesPartArea,
	assertTemplatesAreaHub,
	assertNavigatedToPatternsTemplatePartArea,
	enterSiteEditorCanvasEditFromPreview,
	clickSiteEditorOpenNavigation,
	ensureNoTemplatePart,
	restoreThemePart,
	setThemePartHidden,
} from '@blockera/dev-cypress/js/helpers';

const PART_SLUGS = ['header', 'footer', 'sidebar'];

describe('Blockera One → Templates parts Area Hub', () => {
	/** @type {Set<string>} */
	let hiddenParts = new Set();

	function trackHiddenPart(slug) {
		hiddenParts.add(slug);
	}

	function openFreshSiteEditor() {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
	}

	function restoreAllHiddenParts() {
		const slugs = [...hiddenParts];
		hiddenParts = new Set();
		slugs.forEach((slug) => {
			restoreThemePart(slug);
		});
		// Always ensure theme parts are visible after interrupted runs.
		PART_SLUGS.forEach((slug) => {
			setThemePartHidden(slug, false);
		});
	}

	before(() => {
		PART_SLUGS.forEach((slug) => {
			setThemePartHidden(slug, false);
		});
	});

	beforeEach(() => {
		hiddenParts = new Set();
	});

	afterEach(() => {
		openSiteEditorViewMode('/');
		restoreAllHiddenParts();
	});

	function assertPartsBuilder({ area, hubMode = 'preview' }) {
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should('not.exist');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesBuilderShell).should(
			'be.visible'
		);
		cy.getByDataTest('blockera-templates-builder-group-design')
			.should('be.visible')
			.and('contain', 'Design');
		cy.getByDataTest('blockera-templates-builder-group-settings')
			.should('be.visible')
			.and('contain', 'Settings');
		assertTemplatesAreaHub({ area, mode: hubMode });
	}

	describe('Nav presence', () => {
		it('shows Header, Footer, and Sidebar when theme parts exist', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();
			assertTemplatesPartsNav({ sidebarVisible: true });
		});

		it('hides Sidebar row when the sidebar part is unavailable', () => {
			ensureNoTemplatePart('sidebar');
			trackHiddenPart('sidebar');

			openFreshSiteEditor();
			openTemplatesPurposeNav();
			assertTemplatesPartsNav({ sidebarVisible: false });
		});
	});

	describe('Preview hub', () => {
		['header', 'footer', 'sidebar'].forEach((area) => {
			it(`opens ${area} Area Hub with live preview banner`, () => {
				openFreshSiteEditor();
				openTemplatesPurposeNav();
				openTemplatesPartArea(area);
				assertTemplatesAreaHub({ area, mode: 'preview' });
			});
		});
	});

	describe('Builder subpanel', () => {
		['header', 'footer', 'sidebar'].forEach((area) => {
			it(`opens ${area} Design and Settings from Templates purpose-nav`, () => {
				openFreshSiteEditor();
				openTemplatesPurposeNav();
				openTemplatesPartArea(area);

				assertPartsBuilder({ area });

				cy.getByDataTest(SITE_EDITOR_TEST_IDS.drillDownBack).click();
				cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should(
					'be.visible'
				);
				cy.getByDataTest(
					SITE_EDITOR_TEST_IDS.templatesBuilderShell
				).should('not.exist');
			});
		});
	});

	describe('Canvas edit', () => {
		it('hides banner and Manage when the Editor opens (canvas click)', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();
			openTemplatesPartArea('header');
			assertTemplatesAreaHub({ area: 'header', mode: 'preview' });

			enterSiteEditorCanvasEditFromPreview();
			assertTemplatesAreaHub({ area: 'header', mode: 'edit' });
		});

		it('Open Navigation returns to Templates Area Hub (not Patterns)', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();
			openTemplatesPartArea('header');
			assertTemplatesAreaHub({ area: 'header', mode: 'preview' });

			enterSiteEditorCanvasEditFromPreview();
			assertTemplatesAreaHub({ area: 'header', mode: 'edit' });

			clickSiteEditorOpenNavigation();

			cy.location('search', { timeout: 20000 }).should((search) => {
				const decoded = decodeURIComponent(String(search));
				expect(decoded).to.include('partsArea=header');
				expect(decoded).to.include('wp_template_part');
				expect(decoded).to.not.include('p=%2Fpattern');
				expect(decoded).to.not.include('/pattern');
			});
			assertTemplatesAreaHub({ area: 'header', mode: 'preview' });
		});
	});

	describe('Manage → Patterns', () => {
		['header', 'footer', 'sidebar'].forEach((area) => {
			it(`opens Patterns ${area} list from Manage (sibling categoryId, not nested in p)`, () => {
				openFreshSiteEditor();
				openTemplatesPurposeNav();
				openTemplatesPartArea(area);
				assertTemplatesAreaHub({ area, mode: 'preview' });

				cy.getByDataTest(
					SITE_EDITOR_TEST_IDS.templatesAreaHubManage
				).click();
				assertNavigatedToPatternsTemplatePartArea(area);
			});
		});
	});

	describe('Empty hub', () => {
		it('shows empty Header hub and Manage opens Patterns headers list', () => {
			ensureNoTemplatePart('header');
			trackHiddenPart('header');

			openFreshSiteEditor();
			openTemplatesPurposeNav();
			openTemplatesPartArea('header');
			assertPartsBuilder({ area: 'header', hubMode: 'empty' });

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesAreaHubManage
			).click();
			assertNavigatedToPatternsTemplatePartArea('header');
		});
	});

	describe('Navigation glue', () => {
		it('switches Header → Footer via Back to purpose-nav', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();
			openTemplatesPartArea('header');
			assertPartsBuilder({ area: 'header' });

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.drillDownBack).click();
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should(
				'be.visible'
			);

			openTemplatesPartArea('footer');
			assertPartsBuilder({ area: 'footer' });
		});

		it('All templates clears Area Hub / partsArea', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();
			openTemplatesPartArea('header');
			assertPartsBuilder({ area: 'header' });

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.drillDownBack).click();
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should(
				'be.visible'
			);

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavAll).click();
			cy.location('search')
				.should('include', 'p=%2Ftemplate')
				.and('not.include', 'wp_template_part')
				.and('not.include', 'partsArea=');
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesAreaHub).should(
				'not.exist'
			);
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should(
				'be.visible'
			);
		});
	});
});
