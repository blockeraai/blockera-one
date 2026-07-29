import {
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	openGlobalStylesBlockStyleVariations,
	assertDuplicateStyleVariationOpensCompanionModal,
	assertDuplicateSizeVariationOpensCompanionModal,
	closeCompanionInstallModal,
} from '@blockera/dev-cypress/js/helpers';
import {
	openButtonBlockGlobalStylesVariations,
	SIZE_VARIATION_SLUGS,
} from '../../../blocks-core/js/libs/wordpress/button/test/button-style-size-variations-helpers';

describe('Blockera One → global styles duplicate variation companion gate', () => {
	describe('style variations', () => {
		beforeEach(() => {
			openGlobalStylesBlockStyleVariations('core/group');
			cy.getByDataTest('style-section-1', { timeout: 20000 }).should(
				'exist'
			);
		});

		it('registers blockera-one filter and reports theme mode (not companion plugin)', () => {
			assertBlockeraOneCompanionFilterRegistered();
			assertCompanionPluginFilter(false);
		});

		it('opens the companion install modal when duplicate style variation is clicked', () => {
			assertDuplicateStyleVariationOpensCompanionModal('section-1');
		});

		it('opens and closes the companion install modal from duplicate style variation', () => {
			assertDuplicateStyleVariationOpensCompanionModal('section-1');
			closeCompanionInstallModal();
		});
	});

	describe('size variations', () => {
		beforeEach(() => {
			openButtonBlockGlobalStylesVariations();
		});

		it('opens the companion install modal when duplicate size variation is clicked', () => {
			assertDuplicateSizeVariationOpensCompanionModal(
				SIZE_VARIATION_SLUGS[0]
			);
		});

		it('opens and closes the companion install modal from duplicate size variation', () => {
			assertDuplicateSizeVariationOpensCompanionModal(
				SIZE_VARIATION_SLUGS[0]
			);
			closeCompanionInstallModal();
		});
	});
});
