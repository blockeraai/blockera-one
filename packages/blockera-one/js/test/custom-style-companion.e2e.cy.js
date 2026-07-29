import {
	createPost,
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	openCustomCssSettingsPanel,
	assertCustomCssCompanionGateVisible,
	openCompanionInstallModalFromCustomCss,
	closeCompanionInstallModal,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → custom CSS companion gate', () => {
	beforeEach(() => {
		createPost();
		cy.getBlock('default').type('Custom CSS companion e2e', { delay: 0 });
		openCustomCssSettingsPanel();
	});

	it('registers blockera-one filter and reports theme mode (not companion plugin)', () => {
		assertBlockeraOneCompanionFilterRegistered();
		assertCompanionPluginFilter(false);
	});

	it('gates the Custom CSS editor behind a companion install notice', () => {
		assertCustomCssCompanionGateVisible();
	});

	it('opens and closes the companion install modal from the Custom CSS gate', () => {
		openCompanionInstallModalFromCustomCss();
		closeCompanionInstallModal();
	});
});
