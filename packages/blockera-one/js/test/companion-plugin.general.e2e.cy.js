import {
	createPost,
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	openParagraphBlockStylesView,
	openBackgroundClippingSection,
	getClippingCompanionWrapper,
	assertCompanionInstallNoticeVisible,
	openCompanionInstallModalInEditor,
	closeCompanionInstallModal,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → companion plugin identity', () => {
	beforeEach(() => {
		createPost();
	});

	it('registers blockera-one filter and reports theme mode (not companion plugin)', () => {
		assertBlockeraOneCompanionFilterRegistered();
		assertCompanionPluginFilter(false);
	});

	it('shows companion install notice on companion-gated background clipping', () => {
		openParagraphBlockStylesView();
		openBackgroundClippingSection();

		getClippingCompanionWrapper().within(() => {
			assertCompanionInstallNoticeVisible();

			cy.get('button')
				.first()
				.should('have.css', 'pointer-events', 'none');
		});
	});

	it('opens companion install modal from the notice', () => {
		openCompanionInstallModalInEditor();
		closeCompanionInstallModal();
	});
});
