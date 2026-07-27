/**
 * Workspace tabs companion limit — theme mode blocks adding tabs beyond the
 * current document; post-new and site editor view-mode navigation stay clean.
 */
import {
	createPost,
	openSiteEditor,
	assertCompanionPluginFilter,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → workspace tabs companion guard', () => {
	describe('add tab actions (theme mode)', () => {
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

	describe('post-new.php bootstrap', () => {
		it('shows a single tab without companion modal on a fresh post-new load', () => {
			cy.tabsResetTabsRelatedStorage();
			createPost({ postType: 'post' });

			assertCompanionPluginFilter(false);
			cy.location('pathname', { timeout: 60000 }).should((pathname) => {
				expect(pathname).to.include('post-new.php');
			});
			cy.get('.blockera-tabs-bar', { timeout: 60000 }).should(
				'be.visible'
			);
			cy.tabsExpectUnpinnedCount(1);
			cy.tabsExpectNoCompanionLimitPrompt();
		});

		it('clears stale workspace storage and shows one tab without companion modal', () => {
			cy.tabsVisitPostNewWithStaleStorage({ staleTabCount: 3 });

			assertCompanionPluginFilter(false);
			cy.location('pathname', { timeout: 60000 }).should((pathname) => {
				expect(pathname).to.include('post-new.php');
			});
			cy.get('.blockera-tabs-bar', { timeout: 60000 }).should(
				'be.visible'
			);
			cy.tabsExpectUnpinnedCount(1, { timeout: 60000 });
			cy.tabsExpectNoCompanionLimitPrompt();
		});
	});

	describe('site editor view-mode toggle', () => {
		beforeEach(() => {
			cy.tabsResetWorkspaceStorage();
			cy.tabsResetTabsRelatedStorage();
			openSiteEditor();
		});

		it('does not show the companion install modal when using the view-mode toggle', () => {
			assertCompanionPluginFilter(false);
			cy.get('.blockera-tabs-bar', { timeout: 60000 }).should(
				'be.visible'
			);
			cy.tabsExpectUnpinnedCount(1);
			cy.tabsExpectNoCompanionLimitPrompt();

			cy.tabsClickSiteEditorViewModeToggle();

			cy.tabsExpectNoCompanionLimitPrompt();
			cy.get('.blockera-tabs-bar', { timeout: 60000 }).should(
				'be.visible'
			);
		});
	});
});
