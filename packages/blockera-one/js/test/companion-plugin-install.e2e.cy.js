import {
	createPost,
	openCompanionInstallModalInEditor,
	openCompanionInstallModalInCleanEditor,
	setCompanionPluginConfig,
	stubCompanionPluginWpUpdates,
	stubCompanionPageReload,
	prepareCleanEditorForCompanionInstall,
	prepareDirtyEditorForCompanionInstall,
	withinCompanionInstallModal,
	clickCompanionInstallButton,
	assertCompanionInstallProgressVisible,
	assertCompanionReloadCountdownVisible,
	completeCompanionInstallFromClippingGate,
	waitForCompanionInstallToFinish,
	assertCompanionInstallErrorVisible,
	assertCompanionInstallModalClosed,
	assertCompanionPageReloadCalled,
	assertCompanionPageReloadNotCalled,
	clickCompanionModalAction,
	FEATURE_WRAPPER_TEST_ID,
	COMPANION_INSTALL_MODAL_SELECTOR,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → companion plugin install modal', () => {
	beforeEach(() => {
		createPost();
		setCompanionPluginConfig();
		stubCompanionPluginWpUpdates({ installDelay: 100, activateDelay: 100 });
	});

	describe('install UI', () => {
		it('shows Install Now with WordPress install button classes', () => {
			openCompanionInstallModalInEditor();

			cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionInstall)
				.should('be.visible')
				.and('contain.text', 'Install Now')
				.and('have.class', 'install-now')
				.and('have.class', 'button-primary');
		});

		it('shows Activate label when companion plugin is installed but inactive', () => {
			setCompanionPluginConfig({ status: 'inactive' });
			openCompanionInstallModalInEditor();

			cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionInstall).should(
				'contain.text',
				'Activate'
			);
		});

		it('shows permission message when plugin install is not allowed', () => {
			setCompanionPluginConfig({
				canInstall: false,
				canActivate: false,
			});
			openCompanionInstallModalInEditor();

			withinCompanionInstallModal(() => {
				cy.contains(
					'You do not have permission to install plugins'
				).should('be.visible');
			});

			cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionInstall).should(
				'be.disabled'
			);
		});
	});

	describe('install progress', () => {
		it('shows modern progress UI while installing and activating', () => {
			stubCompanionPluginWpUpdates({
				installDelay: 400,
				activateDelay: 400,
			});
			openCompanionInstallModalInCleanEditor();

			clickCompanionInstallButton();

			assertCompanionInstallProgressVisible();
			withinCompanionInstallModal(() => {
				cy.get(
					'.blockera-component-feature-wrapper-companion-modal__progress-percent'
				)
					.should('be.visible')
					.invoke('text')
					.should('match', /\d+%/);
				cy.contains('Downloading Blockera Site Builder').should(
					'be.visible'
				);
			});

			cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionInstall).should(
				'contain.text',
				'Installing…'
			);

			waitForCompanionInstallToFinish();
			assertCompanionReloadCountdownVisible();
		});

		it('shows an error message when installation fails', () => {
			stubCompanionPluginWpUpdates({
				installError: {
					errorMessage: 'Companion install failed in e2e.',
				},
			});

			openCompanionInstallModalInEditor();
			clickCompanionInstallButton();

			assertCompanionInstallErrorVisible(
				'Companion install failed in e2e.'
			);

			cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionInstall).should(
				'contain.text',
				'Install Now'
			);
		});

		it('prevents closing the modal while installation is in progress', () => {
			stubCompanionPluginWpUpdates({
				installDelay: 1500,
				activateDelay: 1500,
			});
			openCompanionInstallModalInEditor();

			clickCompanionInstallButton();
			assertCompanionInstallProgressVisible();

			cy.getByTestId(FEATURE_WRAPPER_TEST_ID.companionClose).should(
				'be.disabled'
			);

			cy.get('body').type('{esc}');
			cy.get(COMPANION_INSTALL_MODAL_SELECTOR).should('be.visible');
		});
	});

	describe('post-install countdown reload', () => {
		beforeEach(() => {
			stubCompanionPageReload();
			prepareCleanEditorForCompanionInstall();
		});

		it('shows a 10 second countdown after successful install without unsaved changes', () => {
			completeCompanionInstallFromClippingGate('countdown');
		});

		it('reloads immediately when Reload now is clicked', () => {
			completeCompanionInstallFromClippingGate('countdown');

			clickCompanionModalAction(
				FEATURE_WRAPPER_TEST_ID.companionReloadNow
			);
			assertCompanionPageReloadCalled();
		});

		it('auto-reloads when the countdown reaches zero', () => {
			completeCompanionInstallFromClippingGate('countdown');

			cy.clock();
			cy.tick(10000);
			assertCompanionPageReloadCalled();
		});

		it('closes the modal when countdown is cancelled', () => {
			completeCompanionInstallFromClippingGate('countdown');

			clickCompanionModalAction(FEATURE_WRAPPER_TEST_ID.companionClose);
			assertCompanionInstallModalClosed();
			assertCompanionPageReloadNotCalled();
		});
	});

	describe('post-install confirm reload', () => {
		beforeEach(() => {
			stubCompanionPageReload();
			prepareDirtyEditorForCompanionInstall();
		});

		it('shows confirm dialog when the editor has unsaved changes', () => {
			completeCompanionInstallFromClippingGate('confirm');
		});

		it('closes the modal when confirm is cancelled', () => {
			completeCompanionInstallFromClippingGate('confirm');

			clickCompanionModalAction(
				FEATURE_WRAPPER_TEST_ID.companionReloadCancel
			);
			assertCompanionInstallModalClosed();
			assertCompanionPageReloadNotCalled();
		});

		it('reloads without saving when Discard & reload is clicked', () => {
			completeCompanionInstallFromClippingGate('confirm');

			clickCompanionModalAction(
				FEATURE_WRAPPER_TEST_ID.companionReloadDiscard
			);
			assertCompanionPageReloadCalled();
		});

		it('saves and reloads when Save & reload is clicked', () => {
			completeCompanionInstallFromClippingGate('confirm');

			cy.window().then((win) => {
				cy.spy(win.wp.data, 'dispatch').as('wpDataDispatch');
			});

			clickCompanionModalAction(
				FEATURE_WRAPPER_TEST_ID.companionReloadSave
			);

			cy.get('@wpDataDispatch').should('have.been.called');
			cy.get('@companionPageReload', { timeout: 20000 }).should(
				'have.been.calledOnce'
			);
		});
	});
});
