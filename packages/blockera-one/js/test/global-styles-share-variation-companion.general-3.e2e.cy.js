import {
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	assertShareStyleVariationModalActionOpensCompanionModal,
	openShareStyleVariationWithOtherBlocksModal,
	closeCompanionInstallModal,
} from '@blockera/dev-cypress/js/helpers';
import { openGlobalStylesBlockStyleVariations } from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → global styles share variation companion gate', () => {
	beforeEach(() => {
		openGlobalStylesBlockStyleVariations('core/group');
		cy.getByDataTest('style-section-1', { timeout: 20000 }).should('exist');
	});

	it('registers blockera-one filter and reports theme mode (not companion plugin)', () => {
		assertBlockeraOneCompanionFilterRegistered();
		assertCompanionPluginFilter(false);
	});

	it('opens the share modal from the style menu without the companion gate', () => {
		openShareStyleVariationWithOtherBlocksModal('section-1');
		cy.getByDataTest('feature-wrapper-companion-modal').should('not.exist');
	});

	it('opens the companion install modal when a block toggle is clicked inside the share modal', () => {
		assertShareStyleVariationModalActionOpensCompanionModal('section-1');
	});

	it('opens and closes the companion install modal while keeping the share modal open', () => {
		openShareStyleVariationWithOtherBlocksModal('section-1');
		cy.getByDataTest('core/heading').first().click({ force: true });
		assertCompanionInstallModalVisible();
		closeCompanionInstallModal();
		cy.getByDataTest('save-usage-for-multiple-blocks-button', {
			timeout: 20000,
		})
			.first()
			.should('be.visible');
		cy.getByDataTest('feature-wrapper-companion-modal').should('not.exist');
	});
});
