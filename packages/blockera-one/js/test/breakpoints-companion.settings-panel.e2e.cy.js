import {
	goTo,
	dismissOpenModals,
	assertCompanionPluginFilter,
	assertCompanionInstallModalVisible,
	closeCompanionInstallModal,
	FEATURE_WRAPPER_TEST_ID,
	COMPANION_INSTALL_NOTICE,
} from '@blockera/dev-cypress/js/helpers';

describe('Breakpoints settings → companion plugin gate', () => {
	beforeEach(() => {
		goTo('/wp-admin/admin.php?page=blockera-settings-general-settings');

		dismissOpenModals();
	});

	afterEach(() => {
		dismissOpenModals();
	});

	it('gates native breakpoints and add-breakpoint with companion install (not Pro upgrade)', () => {
		assertCompanionPluginFilter(false);

		// Locked native breakpoints use companion (blue) FeatureWrapper, not Pro (red).
		cy.getByDataTest('2xl-desktop').within(() => {
			cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.root('companion'))
				.should('be.visible')
				.and('have.class', 'type-companion');
			cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.root('native')).should(
				'not.exist'
			);
			cy.get('.blockera-component-feature-wrapper__notice__text').should(
				'contain.text',
				COMPANION_INSTALL_NOTICE
			);
			cy.contains('Upgrade to PRO').should('not.exist');
		});

		cy.getByDataTest('tablet').within(() => {
			cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.root('companion')).should(
				'not.exist'
			);
			cy.getByDataTest(FEATURE_WRAPPER_TEST_ID.root('native')).should(
				'not.exist'
			);
		});

		cy.getByDataTest('2xl-desktop')
			.find(`[data-test="${FEATURE_WRAPPER_TEST_ID.companionNotice}"]`)
			.realHover()
			.click({ force: true });

		assertCompanionInstallModalVisible();
		cy.get('.blockera-component-upgrade-prompt').should('not.exist');
		closeCompanionInstallModal();

		cy.getByDataTest('add-new-breakpoint').click();

		assertCompanionInstallModalVisible();
		cy.get('.blockera-component-upgrade-prompt').should('not.exist');
		closeCompanionInstallModal();

		cy.getByDataTest('tablet').should('be.visible');
		cy.getByDataTest('tablet').realHover();

		cy.getByAriaLabel('Delete tablet').should('not.exist');
	});
});
