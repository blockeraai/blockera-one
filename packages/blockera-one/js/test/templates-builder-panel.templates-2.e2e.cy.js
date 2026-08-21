/**
 * Templates Builder panel smoke: open Archive, toggle pagination via the
 * gateway-card toggle data-test hook, assert canvas + dirty state.
 *
 * Category: templates-2 (CI matrix via `*.templates-2.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	openTemplatesPurposeNav,
	openTemplatesPartArea,
	assertTemplatesBuilderShell,
} from '@blockera/dev-cypress/js/helpers';

const PANEL_TEST_ID = 'blockera-templates-builder-panel';
const PAGINATION_TOGGLE_TEST_ID =
	'blockera-templates-builder-group-pagination-toggle';
const CANVAS_IFRAME =
	'iframe[name="editor-canvas"], iframe.block-editor-iframe__iframe';

/**
 * Scroll a builder row/card into the drill-down scroller (Save Hub covers
 * lower rows; fixed sidebar clips overflowed ancestors).
 *
 * @param {string} testId
 * @return {Cypress.Chainable}
 */
function scrollBuilderItemIntoView(testId) {
	return cy.getByDataTest(testId).then(($el) => {
		const el = $el[0];
		const scroller = el.closest(
			'.blockera-site-editor-drill-down__content'
		);
		if (scroller) {
			const sRect = scroller.getBoundingClientRect();
			const eRect = el.getBoundingClientRect();
			scroller.scrollTop +=
				eRect.top - sRect.top - sRect.height / 2 + eRect.height / 2;
		}
	});
}

function openArchiveTemplate() {
	openSiteEditorViewMode('/');
	assertSiteEditorChrome();
	assertSiteEditorMainNav();
	openTemplatesPurposeNav();
	cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavArchive).click();
	cy.location('search').should((search) => {
		const decoded = decodeURIComponent(search);
		expect(decoded).to.include('boFilter=archive');
	});
	assertTemplatesBuilderShell();
}

function canvasBody() {
	return cy
		.get(CANVAS_IFRAME, { timeout: 30000 })
		.its('0.contentDocument.body')
		.should('not.be.empty')
		.then(cy.wrap);
}

describe('Blockera One → Templates Builder panel smoke', () => {
	it('opens Archive, toggles pagination, and marks the panel dirty', () => {
		openArchiveTemplate();

		cy.getByDataTest(PANEL_TEST_ID, { timeout: 20000 }).should(
			'be.visible'
		);

		canvasBody().find('.wp-block-query-pagination').should('exist');

		scrollBuilderItemIntoView(PAGINATION_TOGGLE_TEST_ID);
		cy.getByDataTest(PAGINATION_TOGGLE_TEST_ID)
			.find('input[type="checkbox"]')
			.should('be.checked')
			.click({ force: true });

		cy.getByDataTest(PANEL_TEST_ID).should(
			'have.attr',
			'data-dirty',
			'true'
		);

		canvasBody().find('.wp-block-query-pagination').should('not.exist');

		cy.getByDataTest(PAGINATION_TOGGLE_TEST_ID)
			.find('input[type="checkbox"]')
			.should('not.be.checked')
			.click({ force: true });

		canvasBody().find('.wp-block-query-pagination').should('exist');
	});

	it('opens Single and shows the seven builder groups', () => {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
		openTemplatesPurposeNav();
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavSinglePost).click();
		cy.location('search').should((search) => {
			expect(decodeURIComponent(search)).to.include('boFilter=single');
		});
		assertTemplatesBuilderShell();
		cy.getByDataTest(PANEL_TEST_ID, { timeout: 20000 }).should(
			'be.visible'
		);
		[
			'site-header',
			'page-header',
			'article',
			'post-navigation',
			'post-comments',
			'sidebar',
			'site-footer',
		].forEach((groupId) => {
			scrollBuilderItemIntoView(
				`blockera-templates-builder-group-${groupId}`
			);
			cy.getByDataTest(
				`blockera-templates-builder-group-${groupId}`
			).should('exist');
		});
	});

	it('opens Page Content with blocks before Styles & Blocks', () => {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
		openTemplatesPurposeNav();
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavSinglePage).click();
		cy.location('search').should((search) => {
			expect(decodeURIComponent(search)).to.include('boFilter=page');
		});
		assertTemplatesBuilderShell();
		cy.getByDataTest(PANEL_TEST_ID, { timeout: 20000 }).should(
			'be.visible'
		);
		scrollBuilderItemIntoView('blockera-templates-builder-group-article');
		cy.getByDataTest('blockera-templates-builder-group-article').should(
			'exist'
		);
		cy.getByDataTest(
			'blockera-templates-builder-control-article-design'
		).should('not.exist');
		cy.getByDataTest('blockera-templates-builder-sortable-article').should(
			'exist'
		);
		cy.getByDataTest(
			'blockera-templates-builder-gateway-post-content'
		).should('exist');
		cy.getByDataTest('blockera-templates-builder-gateway-article').should(
			'exist'
		);
	});

	it('opens 404 and shows the Template group', () => {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
		openTemplatesPurposeNav();
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavNotFound).click();
		cy.location('search').should((search) => {
			expect(decodeURIComponent(search)).to.include('boFilter=404');
		});
		assertTemplatesBuilderShell();
		cy.getByDataTest(PANEL_TEST_ID, { timeout: 20000 }).should(
			'be.visible'
		);
		cy.getByDataTest('blockera-templates-builder-group-not-found').should(
			'be.visible'
		);
		cy.getByDataTest('blockera-templates-builder-group-page-layout').should(
			'not.exist'
		);
	});

	it('opens the Sidebar part and shows widget element toggles', () => {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
		openTemplatesPurposeNav();
		openTemplatesPartArea('sidebar');
		assertTemplatesBuilderShell();
		cy.getByDataTest(PANEL_TEST_ID, { timeout: 20000 }).should(
			'be.visible'
		);
		scrollBuilderItemIntoView(
			'blockera-templates-builder-group-sidebar-elements'
		);
		cy.getByDataTest(
			'blockera-templates-builder-group-sidebar-elements'
		).should('exist');
		cy.getByDataTest(
			'blockera-templates-builder-gateway-sidebar-search'
		).should('exist');
	});
});
