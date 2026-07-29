import {
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	assertAddSizeVariationOpensCompanionModal,
	assertCompanionInstallModalVisible,
	openGlobalStylesBlockSizeVariations,
	openCompanionInstallModalFromAddSizeVariation,
	closeCompanionInstallModal,
	withinGlobalStylesSizeVariationsPanel,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → global styles add size variation companion gate', () => {
	beforeEach(() => {
		openGlobalStylesBlockSizeVariations('core/button');
	});

	it('registers blockera-one filter and reports theme mode (not companion plugin)', () => {
		assertBlockeraOneCompanionFilterRegistered();
		assertCompanionPluginFilter(false);
	});

	it('opens the companion install modal when add size variation is clicked', () => {
		assertAddSizeVariationOpensCompanionModal();
	});

	it('opens and closes the companion install modal from the add button', () => {
		openCompanionInstallModalFromAddSizeVariation();
		closeCompanionInstallModal();
	});

	it('opens the companion modal from each add size variation button', () => {
		withinGlobalStylesSizeVariationsPanel(() => {
			cy.getByDataTest('add-new-block-size-variation').each(
				($button, index) => {
					if (index > 0) {
						closeCompanionInstallModal();
					}

					cy.wrap($button).click();
					assertCompanionInstallModalVisible();
					cy.contains(
						'[role="dialog"]',
						'Add new size variation'
					).should('not.exist');
				}
			);
		});
	});
});
