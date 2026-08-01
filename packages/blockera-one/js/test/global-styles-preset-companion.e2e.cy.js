import {
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	assertAddCustomColorPresetOpensCompanionModal,
	assertDuplicateCustomColorPresetOpensCompanionModal,
	assertCompanionInstallModalVisible,
	closeCompanionInstallModal,
	clickAddCustomColorPreset,
} from '@blockera/dev-cypress/js/helpers';
import {
	CUSTOM_PRESET_ROW_META,
	injectCustomPresetRow,
} from '@blockera/dev-cypress/js/helpers/missing-variable';
import { openGlobalStylesColorPaletteScreen } from '@blockera/dev-cypress/js/helpers/global-styles';

describe('Blockera One → global styles preset companion gate', () => {
	beforeEach(() => {
		openGlobalStylesColorPaletteScreen({ reset: true });
	});

	it('registers blockera-one filter and reports theme mode (not companion plugin)', () => {
		assertBlockeraOneCompanionFilterRegistered();
		assertCompanionPluginFilter(false);
	});

	it('opens the companion install modal when add custom color preset is clicked', () => {
		assertAddCustomColorPresetOpensCompanionModal();
	});

	it('opens and closes the companion install modal from add custom color preset', () => {
		clickAddCustomColorPreset();
		assertCompanionInstallModalVisible();
		closeCompanionInstallModal();
	});

	describe('duplicate custom color preset', () => {
		beforeEach(() => {
			injectCustomPresetRow('color', {
				slug: 'companion-e2e-color',
				name: 'Companion E2E Color',
				color: '#336699',
				...CUSTOM_PRESET_ROW_META,
			});

			cy.getParentContainer('Custom variables').within(() => {
				cy.get('[data-cy="repeater-item"]', { timeout: 15000 }).should(
					'have.length',
					1
				);
			});
		});

		it('opens the companion install modal when duplicate is clicked', () => {
			assertDuplicateCustomColorPresetOpensCompanionModal();
		});

		it('opens and closes the companion install modal from duplicate', () => {
			assertDuplicateCustomColorPresetOpensCompanionModal();
			closeCompanionInstallModal();
		});
	});
});
