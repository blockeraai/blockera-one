import {
	createPost,
	assertCompanionPluginFilter,
	assertBlockeraOneCompanionFilterRegistered,
	openParagraphBlockStylesView,
	openBackgroundClippingSection,
} from '@blockera/dev-cypress/js/helpers';
// eslint-disable-next-line import/no-unresolved
import { FEATURE_WRAPPER_TEST_ID } from 'blockera-controls-feature-wrapper-test-ids';

const clippingCompanionWrapper = () =>
	cy
		.getParentContainer('Clipping')
		.parents(`[data-test="${FEATURE_WRAPPER_TEST_ID.root('companion')}"]`)
		.first();

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

		clippingCompanionWrapper().within(() => {
			cy.get('.blockera-component-feature-wrapper__notice__text').and(
				'contain.text',
				'Install Companion Plugin to Unlock'
			);

			cy.get('button')
				.first()
				.should('have.css', 'pointer-events', 'none');
		});
	});

	it.only('opens companion install modal from the notice', () => {
		openParagraphBlockStylesView();
		openBackgroundClippingSection();

		clippingCompanionWrapper().within(() => {
			cy.get('.blockera-component-feature-wrapper__notice__text')
				.and('contain.text', 'Install Companion Plugin to Unlock')
				.click();
		});

		cy.get(
			'.blockera-component-' + FEATURE_WRAPPER_TEST_ID.companionModal
		).should('be.visible');
		cy.get(
			'.blockera-component-' + FEATURE_WRAPPER_TEST_ID.companionModal
		).should('contain.text', 'Blockera Site Builder');

		cy.get('.blockera-component-' + FEATURE_WRAPPER_TEST_ID.companionModal)
			.find('button[aria-label="Close"]')
			.click();

		cy.get(
			'.blockera-component-' + FEATURE_WRAPPER_TEST_ID.companionModal
		).should('not.exist');
	});
});
