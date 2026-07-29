/**
 * Workspace tabs companion limit — theme mode allows one tab; navigation replaces
 * it on post.php, post-new.php, and site-editor.php; add-tab promotes companion.
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

		it('opens the companion install modal when clicking add tab on post-new.php', () => {
			cy.tabsResetTabsRelatedStorage();
			createPost({ postType: 'post' });

			assertCompanionPluginFilter(false);
			cy.location('pathname', { timeout: 60000 }).should((pathname) => {
				expect(pathname).to.include('post-new.php');
			});
			cy.tabsExpectUnpinnedCount(1);
			cy.tabsExpectNoCompanionLimitPrompt();

			cy.tabsOpenAddTabWithoutCompanionStub();

			cy.tabsExpectCompanionLimitPrompt();
			cy.get('.commands-command-menu [cmdk-input]').should('not.exist');
			cy.tabsExpectUnpinnedCount(1);
		});
	});

	describe('post.php editor', () => {
		beforeEach(() => {
			cy.tabsResetWorkspaceStorage();
			cy.tabsResetTabsRelatedStorage();
			createPost({
				postType: 'post',
				postTitle: 'Companion guard post.php',
			});

			cy.window({ timeout: 20000 }).then((win) => {
				const editorDispatch = win.wp.data.dispatch('core/editor');

				if (
					!win.wp.data
						.select('core/editor')
						.getEditedPostAttribute('title')
				) {
					editorDispatch.editPost({
						title: 'Companion guard post.php',
					});
				}

				return editorDispatch.savePost();
			});

			cy.location('pathname', { timeout: 60000 }).should((pathname) => {
				expect(pathname).to.include('post.php');
				expect(pathname).not.to.include('post-new.php');
			});
			cy.get('.blockera-tabs-bar', { timeout: 60000 }).should(
				'be.visible'
			);
		});

		it('opens the companion install modal when clicking add tab on post.php', () => {
			assertCompanionPluginFilter(false);
			cy.tabsExpectUnpinnedCount(1);
			cy.tabsExpectNoCompanionLimitPrompt();

			cy.tabsOpenAddTabWithoutCompanionStub();

			cy.tabsExpectCompanionLimitPrompt();
			cy.get('.commands-command-menu [cmdk-input]').should('not.exist');
			cy.tabsExpectUnpinnedCount(1);
		});

		it('does not show companion modal on post.php load with stale workspace storage', () => {
			cy.url().then((editUrl) => {
				cy.visit(editUrl, {
					onBeforeLoad(win) {
						win.localStorage.setItem(
							'blockera-tabs-tabs',
							JSON.stringify({
								main: {
									'pinned-tabs': [],
									tabs: [
										{
											id: 9001,
											type: 'post',
											title: 'Stale tab 1',
											slug: null,
											status: 'draft',
											key: 'post-9001',
											isPinned: false,
										},
										{
											id: 9002,
											type: 'post',
											title: 'Stale tab 2',
											slug: null,
											status: 'draft',
											key: 'post-9002',
											isPinned: false,
										},
									],
								},
							})
						);
					},
				});
			});

			cy.location('pathname', { timeout: 60000 }).should((pathname) => {
				expect(pathname).to.include('post.php');
			});
			cy.get('.blockera-tabs-bar', { timeout: 60000 }).should(
				'be.visible'
			);
			cy.tabsExpectNoCompanionLimitPrompt();
			cy.tabsExpectUnpinnedCount(1, { timeout: 60000 });
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
		});

		it('opens the companion install modal when clicking add tab on site-editor.php', () => {
			assertCompanionPluginFilter(false);
			cy.get('.blockera-tabs-bar', { timeout: 60000 }).should(
				'be.visible'
			);
			cy.tabsExpectUnpinnedCount(1);
			cy.tabsExpectNoCompanionLimitPrompt();

			cy.tabsOpenAddTabWithoutCompanionStub();

			cy.tabsExpectCompanionLimitPrompt();
			cy.get('.commands-command-menu [cmdk-input]').should('not.exist');
			cy.tabsExpectUnpinnedCount(1);
		});
	});
});
