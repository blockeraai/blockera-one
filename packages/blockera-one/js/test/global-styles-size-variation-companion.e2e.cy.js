import {
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	assertAddSizeVariationOpensCompanionModal,
	assertEachAddSizeVariationButtonOpensCompanionModal,
	openGlobalStylesBlockSizeVariations,
	openCompanionInstallModalFromAddSizeVariation,
	closeCompanionInstallModal,
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
		assertEachAddSizeVariationButtonOpensCompanionModal();
	});
});
