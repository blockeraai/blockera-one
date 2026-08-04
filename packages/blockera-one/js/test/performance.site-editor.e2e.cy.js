/**
 * Blockera One → Features → Performance (Disable Emojis Script).
 *
 * Category: site-editor (CI matrix via `*.site-editor.e2e.cy.js`)
 */

import {
	SITE_EDITOR_TEST_IDS,
	DISABLE_EMOJIS_SETTING,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	clickSiteEditorNav,
	assertEditedSiteRecord,
	saveEditedSiteRecord,
	setDisableEmojisToggle,
	assertFrontEndEmojiAssets,
	updateSiteSettingsViaRest,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → Site Editor Performance (Disable Emojis)', () => {
	it('defaults ON, removes emoji assets, and restores them when disabled', () => {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();

		// Known starting state via REST (avoids flaky wp-env CLI in hooks).
		updateSiteSettingsViaRest({ [DISABLE_EMOJIS_SETTING]: true }).then(
			(res) => {
				expect(res.status).to.eq(200);
				expect(res.body[DISABLE_EMOJIS_SETTING]).to.eq(true);
			}
		);

		clickSiteEditorNav(SITE_EDITOR_TEST_IDS.navPerformance);

		cy.location('search').should('include', 'performance');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.performancePanel, {
			timeout: 20000,
		}).should('be.visible');

		// Reload panel route so root/site picks up REST value.
		openSiteEditorViewMode('/performance');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.performancePanel, {
			timeout: 20000,
		}).should('be.visible');

		cy.getByDataTest(SITE_EDITOR_TEST_IDS.performanceDisableEmojis)
			.find('.components-form-toggle input[type="checkbox"]')
			.should('be.checked');

		assertFrontEndEmojiAssets({ present: false });

		openSiteEditorViewMode('/performance');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.performancePanel, {
			timeout: 20000,
		}).should('be.visible');

		setDisableEmojisToggle(false);
		assertEditedSiteRecord((site) => {
			expect(site[DISABLE_EMOJIS_SETTING]).to.equal(false);
		});
		saveEditedSiteRecord();
		// eslint-disable-next-line cypress/no-unnecessary-waiting
		cy.wait(1500);

		assertFrontEndEmojiAssets({ present: true });

		openSiteEditorViewMode('/performance');
		cy.getByDataTest(SITE_EDITOR_TEST_IDS.performancePanel, {
			timeout: 20000,
		}).should('be.visible');

		setDisableEmojisToggle(true);
		assertEditedSiteRecord((site) => {
			// REST may surface boolean true; tolerate truthy after edit.
			expect(site[DISABLE_EMOJIS_SETTING]).to.not.equal(false);
			expect(site[DISABLE_EMOJIS_SETTING]).to.not.equal(null);
		});
		saveEditedSiteRecord();
		// eslint-disable-next-line cypress/no-unnecessary-waiting
		cy.wait(1500);

		assertFrontEndEmojiAssets({ present: false });
	});
});
