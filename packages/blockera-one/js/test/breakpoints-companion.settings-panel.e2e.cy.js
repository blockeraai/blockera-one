import {
	goTo,
	dismissOpenModals,
	assertCompanionPluginFilter,
	assertCompanionInstallModalVisible,
	closeCompanionInstallModal,
} from '@blockera/dev-cypress/js/helpers';

describe('Breakpoints settings → companion plugin gate', () => {
	beforeEach(() => {
		goTo('/wp-admin/admin.php?page=blockera-settings-general-settings');

		dismissOpenModals();
	});

	afterEach(() => {
		dismissOpenModals();
	});

	it('opens companion install modal (not Pro upgrade) when adding a breakpoint', () => {
		assertCompanionPluginFilter(false);

		cy.getByDataTest('add-new-breakpoint').click();

		assertCompanionInstallModalVisible();
		cy.get('.blockera-component-upgrade-prompt').should('not.exist');
		closeCompanionInstallModal();

		cy.getByDataTest('tablet').should('be.visible');
		cy.getByDataTest('tablet').realHover();

		cy.getByAriaLabel('Delete tablet').should('not.exist');
	});
});
