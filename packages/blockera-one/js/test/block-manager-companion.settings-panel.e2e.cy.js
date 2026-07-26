import {
	assertCompanionPluginFilter,
	openBlockManagerSettingsPanel,
	getBlockManagerCategoryCompanionWrapper,
	assertCompanionInstallNoticeVisible,
	clickCompanionInstallNotice,
	assertCompanionInstallModalVisible,
	closeCompanionInstallModal,
} from '@blockera/dev-cypress/js/helpers';

describe('Block Manager → companion plugin gate', () => {
	beforeEach(() => {
		openBlockManagerSettingsPanel();
	});

	it('reports theme mode on the block manager settings page', () => {
		assertCompanionPluginFilter(false);
	});

	it('shows companion install notice on the text category controls', () => {
		getBlockManagerCategoryCompanionWrapper('text').within(() => {
			assertCompanionInstallNoticeVisible();
		});
	});

	it('blocks block manager toggles behind the companion notice', () => {
		getBlockManagerCategoryCompanionWrapper('text').within(() => {
			cy.getByDataTest('item-core_paragraph').within(() => {
				cy.get('input').should('have.css', 'pointer-events', 'none');
			});

			cy.getByDataTest('text-category=disable').should(
				'have.css',
				'pointer-events',
				'none'
			);
			cy.getByDataTest('text-category=enable').should(
				'have.css',
				'pointer-events',
				'none'
			);
		});
	});

	it('opens and closes the companion install modal from the category notice', () => {
		getBlockManagerCategoryCompanionWrapper('text').within(() => {
			clickCompanionInstallNotice();
		});

		assertCompanionInstallModalVisible();
		closeCompanionInstallModal();
	});
});
