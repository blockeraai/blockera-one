/**
 * Blockera One → Site Editor Reset theme modal + section isolation.
 *
 * Category: reset (CI matrix via `*.reset.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	openResetThemeModal,
	setResetThemeOptions,
	setResetOption,
	checkResetThemeConsent,
	confirmResetThemeAndReload,
	resetOnlyThemeSection,
	seedAllResetCustomizations,
	cleanupResetCustomizations,
	assertUserGlobalStylesMarkerPresent,
	assertUserGlobalStylesMarkerCleared,
	assertCustomTemplateExists,
	assertCustomTemplateMissing,
	assertCustomTemplatePartExists,
	assertCustomTemplatePartMissing,
	assertHomepageSettingsCustomized,
	assertHomepageSettingsReset,
	RESET_TEMPLATE_SLUG,
	RESET_TEMPLATE_PART_SLUG,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → Reset theme', () => {
	describe('Modal UI states', () => {
		beforeEach(() => {
			openSiteEditorViewMode('/');
			assertSiteEditorChrome();
			assertSiteEditorMainNav();
		});

		it('opens Reset theme with four toggles on and Reset disabled until consent', () => {
			openResetThemeModal();

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.resetThemeOptions)
				.find('.components-form-toggle.is-checked')
				.should('have.length', 4);

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.resetThemeConfirm).should(
				'be.disabled'
			);

			checkResetThemeConsent();
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.resetThemeConfirm).should(
				'not.be.disabled'
			);
		});

		it('keeps Reset disabled when consent is checked but all toggles are off', () => {
			openResetThemeModal();
			setResetThemeOptions({
				styles: false,
				templates: false,
				templateParts: false,
				homepage: false,
			});
			checkResetThemeConsent();

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.resetThemeConfirm).should(
				'be.disabled'
			);
		});

		it('re-enables Reset after turning one toggle back on with consent checked', () => {
			openResetThemeModal();
			setResetThemeOptions({
				styles: false,
				templates: false,
				templateParts: false,
				homepage: false,
			});
			checkResetThemeConsent();
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.resetThemeConfirm).should(
				'be.disabled'
			);

			setResetOption(SITE_EDITOR_TEST_IDS.resetOptionStyles, true);
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.resetThemeConfirm).should(
				'not.be.disabled'
			);
		});

		it('closes the modal on Cancel without reloading', () => {
			openResetThemeModal();
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.resetThemeCancel).click();
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.resetThemeModal).should(
				'not.exist'
			);
			cy.getByDataTest(SITE_EDITOR_TEST_IDS.header).should('be.visible');
		});
	});

	describe('Isolated section reset', () => {
		/** Stable object mutated after seeding so queued asserts see page ids. */
		const seedState = {
			frontPageId: 0,
			postsPageId: 0,
			templateId: '',
			templatePartId: '',
		};

		beforeEach(() => {
			seedState.frontPageId = 0;
			seedState.postsPageId = 0;
			seedState.templateId = '';
			seedState.templatePartId = '';

			seedAllResetCustomizations().then((state) => {
				seedState.frontPageId = state.frontPageId;
				seedState.postsPageId = state.postsPageId;
				seedState.templateId = state.templateId;
				seedState.templatePartId = state.templatePartId;
			});

			// Re-open a clean editor after REST seeds so store matches DB.
			openSiteEditorViewMode('/');
			assertSiteEditorChrome();
			assertUserGlobalStylesMarkerPresent();
			assertCustomTemplateExists(RESET_TEMPLATE_SLUG);
			assertCustomTemplatePartExists(RESET_TEMPLATE_PART_SLUG);
			assertHomepageSettingsCustomized(seedState);
		});

		afterEach(() => {
			cleanupResetCustomizations({ ...seedState });
		});

		it('resets only styles and keeps templates, template-parts, and homepage', () => {
			resetOnlyThemeSection('styles');

			assertUserGlobalStylesMarkerCleared();
			assertCustomTemplateExists(RESET_TEMPLATE_SLUG);
			assertCustomTemplatePartExists(RESET_TEMPLATE_PART_SLUG);
			assertHomepageSettingsCustomized(seedState);
		});

		it('resets only templates and keeps styles, template-parts, and homepage', () => {
			resetOnlyThemeSection('templates');

			assertCustomTemplateMissing(RESET_TEMPLATE_SLUG);
			assertUserGlobalStylesMarkerPresent();
			assertCustomTemplatePartExists(RESET_TEMPLATE_PART_SLUG);
			assertHomepageSettingsCustomized(seedState);
		});

		it('resets only template-parts and keeps styles, templates, and homepage', () => {
			resetOnlyThemeSection('templateParts');

			assertCustomTemplatePartMissing(RESET_TEMPLATE_PART_SLUG);
			assertUserGlobalStylesMarkerPresent();
			assertCustomTemplateExists(RESET_TEMPLATE_SLUG);
			assertHomepageSettingsCustomized(seedState);
		});

		it('resets only homepage settings and keeps styles, templates, and template-parts', () => {
			resetOnlyThemeSection('homepage');

			assertHomepageSettingsReset();
			assertUserGlobalStylesMarkerPresent();
			assertCustomTemplateExists(RESET_TEMPLATE_SLUG);
			assertCustomTemplatePartExists(RESET_TEMPLATE_PART_SLUG);
		});

		it('resets all selected sections when every toggle stays on', () => {
			openResetThemeModal();
			checkResetThemeConsent();
			confirmResetThemeAndReload();

			assertUserGlobalStylesMarkerCleared();
			assertCustomTemplateMissing(RESET_TEMPLATE_SLUG);
			assertCustomTemplatePartMissing(RESET_TEMPLATE_PART_SLUG);
			assertHomepageSettingsReset();
		});
	});
});
