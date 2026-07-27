/**
 * Cypress helpers for blockera-one companion plugin identity in the theme.
 */

import { goTo } from './site-navigation';
// eslint-disable-next-line import/no-unresolved
import { FEATURE_WRAPPER_TEST_ID } from 'blockera-controls-feature-wrapper-test-ids';
import { assertBlockData } from './editor';

export { FEATURE_WRAPPER_TEST_ID };

export const COMPANION_INSTALL_NOTICE = 'Install Companion Plugin to Unlock';

export const COMPANION_INSTALL_MODAL_SELECTOR =
	'.blockera-component-feature-wrapper-companion-modal';

export const COMPANION_NOTICE_TEXT_SELECTOR =
	'.blockera-component-feature-wrapper__notice__text';

export const COMPANION_EDITOR_WRAPPER_SELECTOR =
	'[data-test="feature-wrapper-companion"]';

const DEFAULT_COMPANION_PLUGIN_CONFIG = {
	slug: 'blockera',
	plugin: 'blockera/blockera.php',
	name: 'Blockera Site Builder',
	status: 'not-installed',
	canInstall: true,
	canActivate: true,
};

/**
 * Assert the blockera.products.isCompanionPlugin filter value.
 *
 * @param {boolean} expected Expected filter result.
 */
export function assertCompanionPluginFilter(expected = false) {
	cy.window().should((win) => {
		expect(win.wp?.hooks?.applyFilters, 'wp.hooks.applyFilters').to.be.a(
			'function'
		);

		expect(
			win.wp.hooks.applyFilters(
				'blockera.products.isCompanionPlugin',
				false
			),
			'blockera.products.isCompanionPlugin'
		).to.equal(expected);
	});
}

/**
 * Assert blockera-one registered its companion plugin filter callback.
 */
export function assertBlockeraOneCompanionFilterRegistered() {
	cy.window().should((win) => {
		expect(
			win.wp.hooks.hasFilter(
				'blockera.products.isCompanionPlugin',
				'blockera-one/products.isCompanionPlugin'
			),
			'blockera-one/products.isCompanionPlugin filter'
		).to.equal(true);
	});
}

/**
 * Open the block editor styles panel for a new default paragraph block.
 */
export function openParagraphBlockStylesView() {
	cy.getBlock('default').type('Blockera One e2e', { delay: 0 });
	cy.getByAriaControls('styles-view').click();
}

/**
 * Open the block editor styles panel without modifying block content.
 *
 * Use this when post-install behavior depends on a clean editor state.
 */
export function openCleanParagraphBlockStylesView() {
	cy.getBlock('default').click({ force: true });
	cy.getByAriaControls('styles-view').click();
}

/**
 * Assert the current editor post has no unsaved changes.
 */
export function assertEditorHasNoUnsavedChanges() {
	assertBlockData((data) => {
		const editor = data.select('core/editor');
		expect(editor.isEditedPostDirty(), 'edited post dirty').to.equal(false);
	});
}

/**
 * Scroll the Background → Clipping control into view in the styles panel.
 */
export function openBackgroundClippingSection() {
	cy.getParentContainer('Clipping').scrollIntoView();
}

/**
 * Open the Block Manager tab on Blockera settings.
 */
export function openBlockManagerSettingsPanel() {
	goTo('/wp-admin/admin.php?page=blockera-settings-block-manager');
	cy.get('.blockera-settings-active-panel').should('be.visible');
}

/**
 * Locate the companion FeatureWrapper for a block manager category section.
 *
 * @param {string} categorySlug Block category slug (e.g. text, media).
 */
export function getBlockManagerCategoryCompanionWrapper(categorySlug) {
	return cy
		.getByDataTest(`${categorySlug}-category=disable`)
		.parents('[data-test="feature-wrapper-companion"]')
		.first();
}

/**
 * Assert the companion install notice is visible within the current subject.
 */
export function assertCompanionInstallNoticeVisible() {
	cy.get(COMPANION_NOTICE_TEXT_SELECTOR)
		.should('be.visible')
		.and('contain.text', COMPANION_INSTALL_NOTICE);
}

/**
 * Click the companion install notice within the current subject.
 */
export function clickCompanionInstallNotice() {
	cy.get(COMPANION_NOTICE_TEXT_SELECTOR).click();
}

/**
 * Assert the companion install modal is open.
 */
export function assertCompanionInstallModalVisible() {
	cy.get(COMPANION_INSTALL_MODAL_SELECTOR)
		.should('be.visible')
		.and('contain.text', 'Blockera Site Builder');
}

/**
 * Close the companion install modal from the default install view.
 */
export function closeCompanionInstallModal() {
	cy.get(COMPANION_INSTALL_MODAL_SELECTOR)
		.find('button[aria-label="Close"]')
		.click();

	cy.get(COMPANION_INSTALL_MODAL_SELECTOR).should('not.exist');
}

/**
 * Locate the companion FeatureWrapper on the editor Background → Clipping control.
 */
export function getClippingCompanionWrapper() {
	return cy
		.getParentContainer('Clipping')
		.parents(COMPANION_EDITOR_WRAPPER_SELECTOR)
		.first();
}

/**
 * Prepare a clean editor session for companion countdown reload tests.
 */
export function prepareCleanEditorForCompanionInstall() {
	openCleanParagraphBlockStylesView();
	assertEditorHasNoUnsavedChanges();
}

/**
 * Prepare a dirty editor session for companion confirm reload tests.
 *
 * @param {string} [text=' unsaved companion e2e'] Text appended to the default block.
 */
export function prepareDirtyEditorForCompanionInstall(
	text = ' unsaved companion e2e'
) {
	openCleanParagraphBlockStylesView();
	makeEditorPostDirty(text);
}

/**
 * Open clipping gate and complete install until the expected post-install view.
 *
 * @param {'countdown'|'confirm'} expectedView Expected post-install view.
 */
export function completeCompanionInstallFromClippingGate(
	expectedView = 'countdown'
) {
	openCompanionInstallModalFromClippingGate();
	completeCompanionPluginInstall(expectedView);
}

/**
 * Assert the companion install modal is closed.
 */
export function assertCompanionInstallModalClosed() {
	cy.get(COMPANION_INSTALL_MODAL_SELECTOR).should('not.exist');
}

/**
 * Assert the stubbed companion page reload was called once.
 */
export function assertCompanionPageReloadCalled() {
	cy.get('@companionPageReload').should('have.been.calledOnce');
}

/**
 * Assert the stubbed companion page reload was not called.
 */
export function assertCompanionPageReloadNotCalled() {
	cy.get('@companionPageReload').should('not.have.been.called');
}

/**
 * Assert companion install error message is visible.
 *
 * @param {string} message Expected error message.
 */
export function assertCompanionInstallErrorVisible(message) {
	cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.companionInstallError, {
		timeout: 10000,
	})
		.should('be.visible')
		.and('contain.text', message);
}

/**
 * Click a companion install modal action by test id.
 *
 * @param {string} testId Companion modal button test id.
 */
export function clickCompanionModalAction(testId) {
	cy.getByTestId(testId).click();
}

/**
 * Open the companion install modal from the editor clipping gate only.
 */
export function openCompanionInstallModalFromClippingGate() {
	openBackgroundClippingSection();

	getClippingCompanionWrapper().within(() => {
		clickCompanionInstallNotice();
	});

	assertCompanionInstallModalVisible();
}

/**
 * Open the companion install modal from the editor background clipping gate.
 */
export function openCompanionInstallModalInEditor() {
	openParagraphBlockStylesView();
	openCompanionInstallModalFromClippingGate();
}

/**
 * Open the companion install modal with a clean editor (no unsaved changes).
 */
export function openCompanionInstallModalInCleanEditor() {
	openCleanParagraphBlockStylesView();
	assertEditorHasNoUnsavedChanges();
	openCompanionInstallModalFromClippingGate();
}

/**
 * Override companion plugin config exposed to the install modal.
 *
 * @param {Object} overrides Partial config overrides.
 */
export function setCompanionPluginConfig(overrides = {}) {
	cy.window().then((win) => {
		win.blockeraCompanionPlugin = {
			...DEFAULT_COMPANION_PLUGIN_CONFIG,
			...(win.blockeraCompanionPlugin || {}),
			...overrides,
		};
	});
}

/**
 * Stub wp.updates install/activate handlers for companion plugin e2e flows.
 *
 * @param {Object}  options
 * @param {number}  [options.installDelay=0]
 * @param {number}  [options.activateDelay=0]
 * @param {Object|null} [options.installError=null]
 * @param {Object|null} [options.activateError=null]
 */
export function stubCompanionPluginWpUpdates({
	installDelay = 0,
	activateDelay = 0,
	installError = null,
	activateError = null,
} = {}) {
	cy.window().then((win) => {
		win.wp = win.wp || {};
		win.wp.updates = win.wp.updates || {};

		win.wp.updates.installPlugin = (args = {}) => {
			const run = () => {
				if (installError) {
					args.error?.(installError);
					return;
				}

				args.success?.({
					slug: 'blockera',
					pluginName: 'Blockera Site Builder',
					activateUrl: '#',
				});
			};

			if (installDelay > 0) {
				win.setTimeout(run, installDelay);
			} else {
				run();
			}

			return { abort: () => {} };
		};

		win.wp.updates.activatePlugin = (args = {}) => {
			const run = () => {
				if (activateError) {
					args.error?.(activateError);
					return;
				}

				args.success?.({
					slug: 'blockera',
					plugin: 'blockera/blockera.php',
					pluginName: 'Blockera Site Builder',
				});
			};

			if (activateDelay > 0) {
				win.setTimeout(run, activateDelay);
			} else {
				run();
			}

			return { abort: () => {} };
		};
	});
}

/**
 * Stub window.location.reload for post-install reload assertions.
 */
export function stubCompanionPageReload() {
	cy.window().then((win) => {
		const reloadStub = cy.stub().as('companionPageReload');

		Object.defineProperty(win, 'location', {
			configurable: true,
			value: {
				...win.location,
				reload: reloadStub,
			},
		});
	});
}

/**
 * Run callback within the visible companion install modal root.
 *
 * @param {Function} callback Cypress chain callback.
 */
export function withinCompanionInstallModal(callback) {
	cy.get(COMPANION_INSTALL_MODAL_SELECTOR)
		.should('be.visible')
		.within(callback);
}

/**
 * Click the companion install/activate button in the modal.
 */
export function clickCompanionInstallButton() {
	cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionInstall).click();
}

/**
 * Assert install progress UI is visible.
 */
export function assertCompanionInstallProgressVisible() {
	cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.companionInstallProgress).should(
		'be.visible'
	);
	cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.companionInstallProgress).within(
		() => {
			cy.get('[role="progressbar"]').should('be.visible');
		}
	);
}

/**
 * Assert post-install countdown reload UI is visible.
 *
 * @param {number} [seconds=10] Expected countdown value.
 */
export function assertCompanionReloadCountdownVisible(seconds = 10) {
	cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.companionReloadCountdown)
		.should('be.visible')
		.and('contain.text', String(seconds));

	withinCompanionInstallModal(() => {
		cy.contains('Blockera Site Builder was installed successfully.').should(
			'be.visible'
		);
		cy.contains('Reloading in 10 seconds to unlock all features…').should(
			'be.visible'
		);
	});
}

/**
 * Assert post-install unsaved-changes confirm view is visible.
 */
export function assertCompanionReloadConfirmVisible() {
	cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.companionReloadDialog).should(
		'be.visible'
	);
	cy.contains('Reload editor to unlock features?').should('be.visible');
	cy.contains('you have unsaved editor changes').should('be.visible');
	cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionReloadCancel).should(
		'be.visible'
	);
	cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionReloadDiscard).should(
		'be.visible'
	);
	cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionReloadSave).should(
		'be.visible'
	);
}

/**
 * Complete install flow until post-install UI is shown.
 *
 * @param {'countdown'|'confirm'} expectedView Expected post-install view.
 */
export function completeCompanionPluginInstall(expectedView = 'countdown') {
	clickCompanionInstallButton();
	assertCompanionInstallProgressVisible();
	waitForCompanionInstallToFinish();

	if ('confirm' === expectedView) {
		assertCompanionReloadConfirmVisible();
		return;
	}

	assertCompanionReloadCountdownVisible();
}

/**
 * Make the current editor post dirty without saving.
 *
 * @param {string} text Text appended to the default block.
 */
export function makeEditorPostDirty(text = ' unsaved companion e2e') {
	cy.getBlock('default').type(text, { delay: 0 });

	assertBlockData((data) => {
		const editor = data.select('core/editor');
		expect(editor.isEditedPostDirty(), 'edited post dirty').to.equal(true);
	});
}

/**
 * Wait until companion install finishes (progress hidden).
 */
export function waitForCompanionInstallToFinish() {
	cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.companionInstallProgress, {
		timeout: 20000,
	}).should('not.exist');
}
