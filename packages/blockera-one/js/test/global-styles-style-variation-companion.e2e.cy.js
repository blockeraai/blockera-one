import {
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	assertAddStyleVariationOpensCompanionModal,
	assertEachAddStyleVariationButtonOpensCompanionModal,
	openGlobalStylesBlockStyleVariations,
	openCompanionInstallModalFromAddStyleVariation,
	closeCompanionInstallModal,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → global styles add style variation companion gate', () => {
	beforeEach(() => {
		openGlobalStylesBlockStyleVariations('core/paragraph');
	});

	it('registers blockera-one filter and reports theme mode (not companion plugin)', () => {
		assertBlockeraOneCompanionFilterRegistered();
		assertCompanionPluginFilter(false);
	});

	it('opens the companion install modal when add style variation is clicked', () => {
		assertAddStyleVariationOpensCompanionModal();
	});

	it('opens and closes the companion install modal from the add button', () => {
		openCompanionInstallModalFromAddStyleVariation();
		closeCompanionInstallModal();
	});

	it('opens the companion modal from each add style variation button', () => {
		assertEachAddStyleVariationButtonOpensCompanionModal();
	});
});
