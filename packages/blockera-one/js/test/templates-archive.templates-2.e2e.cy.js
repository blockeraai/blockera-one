/**
 * Templates purpose-nav → Archive Templates section.
 *
 * Category: templates (CI matrix via `*.templates.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	openTemplatesPurposeNav,
	assertTemplatesArchiveSection,
	assertStatusTooltip,
	installArchiveTemplatesFixture,
	ensureNoThemeTemplate,
	setThemeTemplateHidden,
	activateMuPlugin,
	deactivateMuPlugin,
} from '@blockera/dev-cypress/js/helpers';

const FALLBACK_STATUS = 'Fallback';

const CPT_MU_PATH =
	'packages/blockera-one/js/test/fixtures/archive-templates/register-bo-book-archive-cpt.php';
const CPT_MU_NAME = 'blockera-test-archive-templates-bo-book-cpt.php';

const INSTALLED_TEMPLATE_SLUGS = [
	'category',
	'category-e2e',
	'tag',
	'tag-e2e',
	'author',
	'author-e2e',
	'date',
	'taxonomy',
	'taxonomy-e2e',
	'archive-bo_book',
];

const DEFAULT_ABSENT_ROWS = [
	SITE_EDITOR_TEST_IDS.templatesNavTag,
	SITE_EDITOR_TEST_IDS.templatesNavAuthor,
	SITE_EDITOR_TEST_IDS.templatesNavDate,
	SITE_EDITOR_TEST_IDS.templatesNavTaxonomy,
	SITE_EDITOR_TEST_IDS.templatesNavCptArchiveBook,
	SITE_EDITOR_TEST_IDS.templatesNavChildrenCategory,
	SITE_EDITOR_TEST_IDS.templatesNavChildrenTag,
	SITE_EDITOR_TEST_IDS.templatesNavChildrenAuthor,
	SITE_EDITOR_TEST_IDS.templatesNavChildrenTaxonomy,
];

describe('Blockera One → Templates Archive Templates purpose-nav', () => {
	let cptMuActive = false;
	let archiveWasHidden = false;
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
		// Only tracked installs — full INSTALLED sweeps each afterEach thrash
		// wp-env (`wpTemplateDeleteBySlug`) and hit Cypress task timeouts.
		const slugs = [...installedSlugs];
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

	function restoreThemeArchive() {
		setThemeTemplateHidden('archive', false);
		archiveWasHidden = false;
	}

	before(() => {
		INSTALLED_TEMPLATE_SLUGS.forEach((slug) => {
			ensureNoThemeTemplate(slug);
		});
		deactivateCptMu();
		setThemeTemplateHidden('archive', false);
	});

	beforeEach(() => {
		cptMuActive = false;
		archiveWasHidden = false;
		installedSlugs = [];
	});

	afterEach(() => {
		cleanupInstalledTemplates();
		restoreThemeArchive();

		if (cptMuActive) {
			deactivateCptMu();
		}
	});

	after(() => {
		INSTALLED_TEMPLATE_SLUGS.forEach((slug) => {
			ensureNoThemeTemplate(slug);
		});
		deactivateCptMu();
		setThemeTemplateHidden('archive', false);
	});

	describe('Default theme state', () => {
		it('shows All Archives + Categories; hides empty archive rows', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				archiveStatus: FALLBACK_STATUS,
				tagVisible: false,
				authorVisible: false,
				dateVisible: false,
				taxonomyVisible: false,
				cptBookArchiveVisible: false,
				absentChildTestIds: DEFAULT_ABSENT_ROWS,
			});
		});
	});

	describe('All Archives', () => {
		it('shows Fallback status, tooltip, opens archive canvas, stays when theme file hidden', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				archiveStatus: FALLBACK_STATUS,
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavArchiveStatus)
				.scrollIntoView({ block: 'center', ensureScrollable: false })
				.should('be.visible');

			// All Archives is the first row in the Archive Templates section.
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav)
				.find('.blockera-site-editor-nav__section')
				.contains(
					'.blockera-site-editor-nav__section-title',
					'Archive Templates'
				)
				.parents('.blockera-site-editor-nav__section')
				.find('.blockera-site-editor-nav__items [data-test]')
				.first()
				.should(
					'have.attr',
					'data-test',
					SITE_EDITOR_TEST_IDS.templatesNavArchive
				);

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavArchive).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('archive');
				expect(decoded).to.include('blockera-builder=archive');
			});
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesBuilderShell).should(
				'exist'
			);

			// Always shown even when theme archive.html is temporarily hidden.
			setThemeTemplateHidden('archive', true);
			archiveWasHidden = true;
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				archiveStatus: FALLBACK_STATUS,
			});

			setThemeTemplateHidden('archive', false);
			archiveWasHidden = false;
		});
	});

	describe('Categories', () => {
		it('stays visible when empty; opens category; Child templates browse', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavChildrenCategory,
				],
			});

			installArchiveTemplatesFixture('category');
			trackInstalled('category');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavCategory).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('blockera-builder=category');
			});

			installArchiveTemplatesFixture('category-e2e');
			trackInstalled('category-e2e');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavChildrenCategory,
						count: 1,
					},
				],
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavChildrenCategory
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include(
					'blockera-builder=children:category'
				);
			});
		});
	});

	describe('Tags', () => {
		it('hides when empty; shows base + Child templates', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				tagVisible: false,
				absentChildTestIds: [SITE_EDITOR_TEST_IDS.templatesNavTag],
			});

			installArchiveTemplatesFixture('tag');
			trackInstalled('tag');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				tagVisible: true,
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavChildrenTag,
				],
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavTag).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('blockera-builder=tag');
			});

			installArchiveTemplatesFixture('tag-e2e');
			trackInstalled('tag-e2e');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				tagVisible: true,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavChildrenTag,
						count: 1,
					},
				],
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavChildrenTag
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('blockera-builder=children:tag');
			});

			ensureNoThemeTemplate('tag');
			ensureNoThemeTemplate('tag-e2e');
			installedSlugs = installedSlugs.filter(
				(slug) => slug !== 'tag' && slug !== 'tag-e2e'
			);
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				tagVisible: false,
			});
		});
	});

	describe('Authors', () => {
		it('hides when empty; shows base + Child templates', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				authorVisible: false,
			});

			installArchiveTemplatesFixture('author');
			trackInstalled('author');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				authorVisible: true,
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavChildrenAuthor,
				],
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavAuthor).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('blockera-builder=author');
			});

			installArchiveTemplatesFixture('author-e2e');
			trackInstalled('author-e2e');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				authorVisible: true,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavChildrenAuthor,
						count: 1,
					},
				],
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavChildrenAuthor
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('blockera-builder=children:author');
			});

			ensureNoThemeTemplate('author');
			ensureNoThemeTemplate('author-e2e');
			installedSlugs = installedSlugs.filter(
				(slug) => slug !== 'author' && slug !== 'author-e2e'
			);
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				authorVisible: false,
			});
		});
	});

	describe('Date', () => {
		it('shows when installed and hides when removed; no children row', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				dateVisible: false,
			});

			installArchiveTemplatesFixture('date');
			trackInstalled('date');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				dateVisible: true,
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavDate).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('blockera-builder=date');
			});

			ensureNoThemeTemplate('date');
			installedSlugs = installedSlugs.filter((slug) => slug !== 'date');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				dateVisible: false,
			});
		});
	});

	describe('Taxonomy', () => {
		it('hides when empty; shows base + Child templates', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				taxonomyVisible: false,
			});

			installArchiveTemplatesFixture('taxonomy');
			trackInstalled('taxonomy');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				taxonomyVisible: true,
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavChildrenTaxonomy,
				],
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavTaxonomy).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include('blockera-builder=taxonomy');
			});

			installArchiveTemplatesFixture('taxonomy-e2e');
			trackInstalled('taxonomy-e2e');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				taxonomyVisible: true,
				children: [
					{
						testId: SITE_EDITOR_TEST_IDS.templatesNavChildrenTaxonomy,
						count: 1,
					},
				],
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavChildrenTaxonomy
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include(
					'blockera-builder=children:taxonomy'
				);
			});

			ensureNoThemeTemplate('taxonomy');
			ensureNoThemeTemplate('taxonomy-e2e');
			installedSlugs = installedSlugs.filter(
				(slug) => slug !== 'taxonomy' && slug !== 'taxonomy-e2e'
			);
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				taxonomyVisible: false,
			});
		});
	});

	describe('Custom post type archive', () => {
		it('hides empty CPT archive row; shows when archive-{cpt} exists', () => {
			activateMuPlugin({
				pluginPath: CPT_MU_PATH,
				pluginName: CPT_MU_NAME,
			});
			cptMuActive = true;

			// Registered CPT with has_archive but no archive-{cpt} → hidden.
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				cptBookArchiveVisible: false,
				absentChildTestIds: [
					SITE_EDITOR_TEST_IDS.templatesNavCptArchiveBook,
				],
			});

			installArchiveTemplatesFixture('archive-bo_book');
			trackInstalled('archive-bo_book');
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				cptBookArchiveVisible: true,
				cptBookLabelIncludes: 'Book',
			});

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavCptArchiveBook
			).click();
			cy.location('search').should((search) => {
				const decoded = decodeURIComponent(search);
				expect(decoded).to.include(
					'blockera-builder=cpt-archive:bo_book'
				);
			});

			ensureNoThemeTemplate('archive-bo_book');
			installedSlugs = installedSlugs.filter(
				(slug) => slug !== 'archive-bo_book'
			);
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				cptBookArchiveVisible: false,
			});

			deactivateCptMu();
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesArchiveSection({
				cptBookArchiveVisible: false,
			});
		});
	});
});
