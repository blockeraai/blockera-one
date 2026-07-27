/**
 * Workspace tabs companion limit — aligned with Pro limit promotion, but hard-blocks
 * any new tab in theme mode (regular limit = 1, companion install modal).
 */
import {
	createPost,
	assertCompanionPluginFilter,
} from '@blockera/dev-cypress/js/helpers';

describe('Workspace tabs: Companion limit (theme mode)', () => {
	beforeEach(() => {
		cy.tabsResetWorkspaceStorage();
		cy.tabsResetTabsRelatedStorage();
		createPost({ postType: 'post' });
	});

	it('opens the companion install modal when clicking add tab without the companion plugin', () => {
		assertCompanionPluginFilter(false);
		cy.tabsExpectUnpinnedCount(1);

		cy.tabsOpenAddTabWithoutCompanionStub();

		cy.tabsExpectCompanionLimitPrompt();
		cy.get('.commands-command-menu [cmdk-input]').should('not.exist');
		cy.tabsExpectUnpinnedCount(1);
	});

	it('opens the companion install modal from Ctrl/Cmd+T and keeps a single tab', () => {
		cy.tabsExpectUnpinnedCount(1);

		cy.tabsPressAddTabShortcut();

		cy.tabsExpectCompanionLimitPrompt();
		cy.get('.commands-command-menu [cmdk-input]').should('not.exist');
		cy.tabsExpectUnpinnedCount(1);
	});
});
