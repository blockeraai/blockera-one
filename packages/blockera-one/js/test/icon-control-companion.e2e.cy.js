import {
	createPost,
	appendBlocks,
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	assertCompanionInstallModalVisible,
	closeCompanionInstallModal,
	BUTTON_BLOCK_FOR_ICON_CONTROL,
	openButtonBlockIconSettings,
	openIconPickerCustomTab,
	assertCustomIconUploadCompanionGateVisible,
	openCompanionInstallModalFromCustomIconTab,
	dropSvgFixtureOnElement,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → icon control custom SVG companion gate', () => {
	beforeEach(() => {
		createPost();
		appendBlocks(BUTTON_BLOCK_FOR_ICON_CONTROL);
		openButtonBlockIconSettings();
	});

	it('registers blockera-one filter and reports theme mode (not companion plugin)', () => {
		assertBlockeraOneCompanionFilterRegistered();
		assertCompanionPluginFilter(false);
	});

	it('gates the custom SVG tab behind companion install notices', () => {
		openIconPickerCustomTab();
		assertCustomIconUploadCompanionGateVisible();
	});

	it('opens and closes the companion install modal from the custom tab', () => {
		openIconPickerCustomTab();
		openCompanionInstallModalFromCustomIconTab();
		closeCompanionInstallModal();
	});

	it('opens the companion install modal when an SVG is dropped on the icon picker', () => {
		cy.getByAriaLabel('Choose Icon…').first().click();
		cy.get('.blockera-control-icon-picker-modal').should('be.visible');

		dropSvgFixtureOnElement('.blockera-control-icon-picker-modal');
		assertCompanionInstallModalVisible();

		cy.get('.blockera-control-icon-picker-modal').should('be.visible');
		closeCompanionInstallModal();
	});

	it('opens the companion install modal when an SVG is dropped on the icon preview', () => {
		dropSvgFixtureOnElement('.blockera-control-icon.icon-none');
		assertCompanionInstallModalVisible();
		closeCompanionInstallModal();
	});

	it('blocks browse and paste controls behind the companion gate', () => {
		openIconPickerCustomTab();

		cy.get(
			'.blockera-control-icon-picker-custom-icon-browse-wrapper'
		).within(() => {
			cy.contains('button', /Browse WordPress Media Library/i).should(
				'have.css',
				'pointer-events',
				'none'
			);
		});

		cy.get('.blockera-control-icon-picker-custom-icon-textarea').should(
			'be.disabled'
		);
	});
});
