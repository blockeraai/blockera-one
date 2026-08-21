/**
 * Templates purpose-nav → Single Templates section.
 *
 * Category: templates (CI matrix via `*.templates.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	openTemplatesPurposeNav,
	assertTemplatesSingleSection,
	assertTemplatesBuilderShell,
	ensureSingularHidden,
	ensureSingularVisible,
	installAttachmentThemeTemplate,
	ensureNoAttachmentTemplate,
	installSingleTemplatesFixture,
	ensureNoThemeTemplate,
	activateMuPlugin,
	deactivateMuPlugin,
} from '@blockera/dev-cypress/js/helpers';

const FALLBACK_STATUS = 'Fallback';

const CPT_MU_PATH =
	'packages/blockera-one/js/test/fixtures/single-templates/register-bo-book-cpt.php';
const CPT_MU_NAME = 'blockera-test-single-templates-bo-book-cpt.php';

const INSTALLED_TEMPLATE_SLUGS = [
	'singular',
	'attachment',
	'single-post-e2e',
	'single-bo_book',
	'single-bo_book-e2e',
];

describe('Blockera One → Templates Single Templates purpose-nav', () => {
	let singularWasShown = false;
	let cptMuActive = false;
	/** @type {string[]} */
	let installedSlugs = [];

	function trackInstalled(slug) {
		if (!installedSlugs.includes(slug)) {
			installedSlugs.push(slug);
		}
	}

	function openFreshSiteEditor() {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
	}

	function cleanupInstalledTemplates() {
		const slugs = [
			...new Set([...installedSlugs, ...INSTALLED_TEMPLATE_SLUGS]),
		];
		installedSlugs = [];
		slugs.forEach((slug) => {
			ensureNoThemeTemplate(slug);
		});
	}

	function deactivateCptMu() {
		deactivateMuPlugin({
			pluginPath: CPT_MU_PATH,
			pluginName: CPT_MU_NAME,
		});
		cptMuActive = false;
	}

	before(() => {
		ensureSingularHidden();
		ensureNoAttachmentTemplate();
		INSTALLED_TEMPLATE_SLUGS.forEach((slug) => {
			ensureNoThemeTemplate(slug);
		});
		deactivateCptMu();
	});

	beforeEach(() => {
		singularWasShown = false;
		cptMuActive = false;
		installedSlugs = [];
	});

	afterEach(() => {
		openSiteEditorViewMode('/');

		cleanupInstalledTemplates();
		ensureNoAttachmentTemplate();

		if (singularWasShown) {
			ensureSingularHidden();
			singularWasShown = false;
		} else {
			ensureSingularHidden();
		}

		if (cptMuActive) {
			deactivateCptMu();
		} else {
			deactivateCptMu();
		}
	});

	describe('Default theme state', () => {
		it('hides Singular and Attachments; shows Post/Page; Page children only', () => {
			ensureSingularHidden();
			ensureNoAttachmentTemplate();
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: false,
				cptBookVisible: false,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavChildrenPage,
						count: 1,
					},
				],
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavChildrenSingle,
					SITE_EDITOR_TEST_IDS.templatesNavChildrenCptBook,
					SITE_EDITOR_TEST_IDS.templatesNavSingular,
					SITE_EDITOR_TEST_IDS.templatesNavAttachment,
					SITE_EDITOR_TEST_IDS.templatesNavCptBook,
				],
			});
		});
	});

	describe('Singular', () => {
		it('shows Fallback status and opens singular canvas', () => {
			ensureSingularVisible();
			singularWasShown = true;
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: true,
				singularStatus: FALLBACK_STATUS,
				attachmentVisible: false,
				cptBookVisible: false,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavChildrenPage,
						count: 1,
					},
				],
			});

			// Singular is the first row in the Single Templates section items list.
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav)
				.find('.blockera-site-editor-nav__section')
				.contains(
					'.blockera-site-editor-nav__section-title',
					'Single Templates'
				)
				.parents('.blockera-site-editor-nav__section')
				.find('.blockera-site-editor-nav__items [data-test]')
				.first()
				.should(
					'have.attr',
					'data-test',
					SITE_EDITOR_TEST_IDS.templatesNavSingular
				);

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavSingular).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('singular');
				expect(decoded).to.include('boFilter=singular');
			});
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should('exist');
		});

		it('hides Singular again when the theme template is unavailable', () => {
			ensureSingularVisible();
			singularWasShown = true;
			openFreshSiteEditor();
			openTemplatesPurposeNav();
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavSingular).should(
				'be.visible'
			);

			ensureSingularHidden();
			singularWasShown = false;
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: false,
				cptBookVisible: false,
			});
		});
	});

	describe('Single Post', () => {
		it('opens single template and shows Child templates when a child exists', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavSinglePost
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('boFilter=single');
			});

			installSingleTemplatesFixture('single-post-e2e');
			trackInstalled('single-post-e2e');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: false,
				cptBookVisible: false,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavChildrenSingle,
						count: 1,
					},
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavChildrenPage,
						count: 1,
					},
				],
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavChildrenSingle
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('boFilter=children:single');
			});
		});
	});

	describe('Single Page', () => {
		it('opens page template and Child templates browse', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavSinglePage
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('boFilter=page');
			});
			assertTemplatesBuilderShell();

			// Remount purpose-nav after builder preview (main Design nav is gone).
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavChildrenPage)
				.should('be.visible')
				.click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('boFilter=children:page');
			});
		});
	});

	describe('Attachments', () => {
		it('shows Attachments when installed and hides when removed', () => {
			installAttachmentThemeTemplate();
			trackInstalled('attachment');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: true,
				cptBookVisible: false,
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavAttachment
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('boFilter=attachment');
			});

			ensureNoAttachmentTemplate();
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: false,
				cptBookVisible: false,
			});
		});
	});

	describe('Custom post type', () => {
		it('hides empty CPT row; shows when templates exist; Child templates work', () => {
			activateMuPlugin({
				pluginPath: CPT_MU_PATH,
				pluginName: CPT_MU_NAME,
			});
			cptMuActive = true;

			// Registered CPT with no single-{cpt} templates → hidden.
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: false,
				cptBookVisible: false,
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavCptBook,
					SITE_EDITOR_TEST_IDS.templatesNavChildrenCptBook,
				],
			});

			installSingleTemplatesFixture('single-bo_book');
			trackInstalled('single-bo_book');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: false,
				cptBookVisible: true,
				cptBookLabelIncludes: 'Book',
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavChildrenCptBook,
				],
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavCptBook).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('boFilter=cpt-single:bo_book');
			});

			installSingleTemplatesFixture('single-bo_book-e2e');
			trackInstalled('single-bo_book-e2e');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: false,
				cptBookVisible: true,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavChildrenCptBook,
						count: 1,
					},
				],
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavChildrenCptBook
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include(
					'boFilter=children:cpt-single:bo_book'
				);
			});

			// Remove CPT templates while CPT stays registered → row hidden again.
			ensureNoThemeTemplate('single-bo_book');
			ensureNoThemeTemplate('single-bo_book-e2e');
			installedSlugs = installedSlugs.filter(
				(slug) =>
					slug !== 'single-bo_book' && slug !== 'single-bo_book-e2e'
			);
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: false,
				cptBookVisible: false,
			});

			deactivateCptMu();
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesSingleSection({
				singularVisible: false,
				attachmentVisible: false,
				cptBookVisible: false,
			});
		});
	});
});
