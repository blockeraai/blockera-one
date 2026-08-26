/**
 * stamp-lookup.ts: parent-scoped stamp resolution. Two parents may share
 * container/media; selection and parentId pick the right one.
 */

import { getStamp } from '../metadata';
import {
	setSectionAttribute,
	moveInnerSection,
	orderInnerSections,
} from '../section-ops';
import {
	findStampById,
	lookupFromControl,
	lookupFromInnerOrder,
	resolveWithinFromSelection,
} from '../stamp-lookup';
import { resolveSectionState } from '../resolve/resolve-state';
import { stamped } from './helpers/block-fixtures';

function collisionTree() {
	return [
		stamped('core/group', 'layout/main:no-sidebar', { clientId: 'main' }, [
			stamped('core/template-part', 'section/header:default', {
				clientId: 'chrome-header',
				slug: 'header',
			}),
			stamped(
				'core/group',
				'section/article:default',
				{ clientId: 'article' },
				[
					stamped('core/column', 'container/media', {
						clientId: 'article-media',
					}),
					stamped('core/column', 'container/body', {
						clientId: 'article-body',
					}),
				]
			),
			stamped(
				'core/group',
				'section/page-header:simple',
				{ clientId: 'page-header' },
				[
					stamped(
						'core/group',
						'container/body',
						{ clientId: 'page-header-body' },
						[
							stamped(
								'core/query-title',
								'section/page-header-title:default',
								{ clientId: 'page-header-title' }
							),
						]
					),
				]
			),
			stamped(
				'core/query',
				'section/posts-listing:list',
				{ clientId: 'listing' },
				[
					stamped('core/column', 'container/media', {
						clientId: 'listing-media',
					}),
					stamped('core/column', 'container/body', {
						clientId: 'listing-body',
					}),
				]
			),
		]),
	];
}

describe('resolveWithinFromSelection', () => {
	const tree = collisionTree();

	it('returns the nearest parent section or container; selected is fallback', () => {
		expect(
			resolveWithinFromSelection(tree, 'listing-media').block.clientId
		).toBe('listing');
		expect(
			resolveWithinFromSelection(tree, 'page-header-title').block.clientId
		).toBe('page-header-body');
		expect(resolveWithinFromSelection(tree, 'listing').block.clientId).toBe(
			'listing'
		);
	});

	it('skips chrome, layout, and area stamps while walking up', () => {
		expect(resolveWithinFromSelection(tree, 'chrome-header')).toBeNull();
		expect(resolveWithinFromSelection(tree, 'main')).toBeNull();
	});
});

describe('findStampById', () => {
	const tree = collisionTree();

	it('with selection inside posts-listing does not hit the other media', () => {
		const match = findStampById(tree, 'media', {
			selectedClientId: 'listing',
		});
		expect(match.block.clientId).toBe('listing-media');
	});

	it('falls back to parentId when the selection subtree misses', () => {
		const match = findStampById(tree, 'media', {
			selectedClientId: 'page-header-title',
			parentId: 'posts-listing',
		});
		expect(match.block.clientId).toBe('listing-media');
	});

	it('falls back to tree-global first-match when nothing scopes', () => {
		const match = findStampById(tree, 'media');
		expect(match.block.clientId).toBe('article-media');
	});

	it('keeps chrome header tree-global even when listing is selected', () => {
		const match = findStampById(tree, 'header', {
			selectedClientId: 'listing-body',
		});
		expect(match.block.clientId).toBe('chrome-header');
	});

	it('includes the ancestor when looking up body from inside body', () => {
		const match = findStampById(tree, 'body', {
			selectedClientId: 'page-header-title',
		});
		expect(match.block.clientId).toBe('page-header-body');
	});
});

describe('resolveSectionState lookup', () => {
	const tree = collisionTree();

	it('scopes media to the selected listing', () => {
		const state = resolveSectionState(tree, 'media', [], {
			selectedClientId: 'listing',
		});
		expect(state.path).toEqual([0, 3, 0]);
	});
});

describe('lookupFromControl + setSectionAttribute', () => {
	it('writes onto listing media, not the other parent, when listing is selected', () => {
		const tree = collisionTree();
		const lookup = lookupFromControl(
			{ innerOrder: { parentId: 'posts-listing', ids: [] } },
			'listing'
		);
		const next = setSectionAttribute(tree, {
			sectionId: 'media',
			attributePath: 'width',
			value: '40%',
			lookup,
		});
		const listing = findStampById(next, 'media', {
			selectedClientId: 'listing',
		});
		const article = findStampById(next, 'media', {
			selectedClientId: 'article',
		});
		expect(listing.block.attributes.width).toBe('40%');
		expect(article.block.attributes.width).toBeUndefined();
	});

	it('pins page-header body even when the listing is selected', () => {
		const tree = [
			stamped(
				'core/group',
				'layout/main:no-sidebar',
				{ clientId: 'main' },
				[
					stamped(
						'core/group',
						'section/page-header:simple',
						{ clientId: 'page-header' },
						[
							stamped('core/group', 'container/body', {
								clientId: 'page-header-body',
							}),
						]
					),
					stamped(
						'core/query',
						'section/posts-listing:list',
						{ clientId: 'listing' },
						[
							stamped('core/group', 'container/body', {
								clientId: 'listing-body',
							}),
						]
					),
				]
			),
		];
		const lookup = lookupFromControl(
			{
				id: 'page-header-gap',
				innerOrder: { parentId: 'body', ids: [] },
			},
			'listing-body'
		);
		expect(lookup.within).toBe('page-header');
		const match = findStampById(tree, 'body', lookup);
		expect(match.block.clientId).toBe('page-header-body');

		const next = setSectionAttribute(tree, {
			sectionId: 'body',
			attributePath: 'width',
			value: '645px',
			lookup,
		});
		expect(
			findStampById(next, 'body', { within: 'page-header' }).block
				.attributes.width
		).toBe('645px');
		expect(
			findStampById(next, 'body', { selectedClientId: 'listing' }).block
				.attributes.width
		).toBeUndefined();
	});

	it('pins page-header reorder-body under page-header, not posts-listing', () => {
		const tree = collisionTree();
		const lookup = lookupFromControl({
			id: 'reorder-body',
			innerOrder: {
				parentId: 'body',
				within: 'page-header',
				ids: [
					'page-header-title',
					'page-header-description',
					'page-header-breadcrumbs',
				],
			},
		});
		expect(lookup.within).toBe('page-header');
		expect(lookup.fallbackWithin).toBeUndefined();
		expect(findStampById(tree, 'body', lookup).block.clientId).toBe(
			'page-header-body'
		);
	});

	it('pins listing reorders under posts-listing with no canvas selection', () => {
		const tree = collisionTree();
		const lookup = lookupFromControl({
			id: 'reorder-body',
			innerOrder: {
				parentId: 'body',
				within: 'posts-listing',
				bucketParents: ['media', 'body'],
				ids: ['post-featured-image'],
			},
		});
		expect(lookup.within).toBe('posts-listing');
		expect(lookup.fallbackWithin).toBeUndefined();
		expect(findStampById(tree, 'body', lookup).block.clientId).toBe(
			'listing-body'
		);
	});

	it('uses posts-listing as fallbackWithin for listing toggles', () => {
		const tree = collisionTree();
		const lookup = lookupFromControl({
			id: 'post-featured-image',
			innerOrder: {
				parentId: 'body',
				within: 'posts-listing',
				bucketParents: ['media', 'body'],
				ids: ['post-featured-image'],
			},
		});
		expect(lookup.within).toBeUndefined();
		expect(lookup.fallbackWithin).toBe('posts-listing');
		expect(findStampById(tree, 'body', lookup).block.clientId).toBe(
			'listing-body'
		);
	});

	it('does not treat page-header post-meta as article post-meta via parentId body', () => {
		const tree = [
			stamped(
				'core/group',
				'section/page-header:simple',
				{ clientId: 'page-header' },
				[
					stamped(
						'core/group',
						'container/body',
						{ clientId: 'page-header-body' },
						[
							stamped('core/group', 'section/post-meta:default', {
								clientId: 'header-meta',
							}),
						]
					),
				]
			),
			stamped(
				'core/group',
				'section/article:default',
				{ clientId: 'article' },
				[
					stamped(
						'core/group',
						'container/body',
						{ clientId: 'article-body' },
						[
							stamped(
								'core/post-content',
								'section/post-content:default',
								{ clientId: 'article-content' }
							),
						]
					),
				]
			),
		];
		const lookup = lookupFromControl({
			id: 'post-meta',
			innerOrder: {
				parentId: 'body',
				within: 'article',
				ids: ['post-meta'],
			},
		});
		expect(lookup.fallbackWithin).toBe('article');
		expect(findStampById(tree, 'post-meta', lookup)).toBeNull();
		expect(findStampById(tree, 'post-meta').block.clientId).toBe(
			'header-meta'
		);
	});

	it('prefers canvas selection over listing fallbackWithin', () => {
		const tree = collisionTree();
		const lookup = lookupFromControl(
			{
				id: 'post-featured-image',
				innerOrder: {
					parentId: 'body',
					within: 'posts-listing',
					bucketParents: ['media', 'body'],
					ids: ['post-featured-image'],
				},
			},
			'article-body'
		);
		expect(findStampById(tree, 'body', lookup).block.clientId).toBe(
			'article-body'
		);
	});
});

/**
 * Four sections, each with nested inner slots. `post-title` repeats under
 * article, listing, and related. `start` / `body` repeat under page-header
 * and article. Reorder must stay inside the rule's `within` ancestor.
 */
function pageWithNestedSlots() {
	return [
		stamped('core/group', 'layout/main:no-sidebar', { clientId: 'main' }, [
			stamped(
				'core/group',
				'section/page-header:simple',
				{ clientId: 'page-header' },
				[
					stamped(
						'core/group',
						'container/start',
						{ clientId: 'page-header-start' },
						[
							stamped(
								'core/breadcrumbs',
								'section/page-header-breadcrumbs:default',
								{ clientId: 'crumbs' }
							),
						]
					),
					stamped(
						'core/group',
						'container/body',
						{ clientId: 'page-header-body' },
						[
							stamped(
								'core/query-title',
								'section/page-header-title:default',
								{ clientId: 'ph-title' }
							),
							stamped(
								'core/term-description',
								'section/page-header-description:default',
								{ clientId: 'ph-desc' }
							),
						]
					),
				]
			),
			stamped(
				'core/group',
				'section/article:default',
				{ clientId: 'article' },
				[
					stamped(
						'core/group',
						'container/start',
						{ clientId: 'article-start' },
						[
							stamped(
								'core/paragraph',
								'section/kicker:default',
								{ clientId: 'kicker' }
							),
						]
					),
					stamped('core/column', 'container/media', {
						clientId: 'article-media',
					}),
					stamped(
						'core/group',
						'container/body',
						{ clientId: 'article-body' },
						[
							stamped(
								'core/post-title',
								'section/post-title:default',
								{ clientId: 'article-title' }
							),
							stamped(
								'core/post-content',
								'section/post-content:default',
								{ clientId: 'article-content' }
							),
						]
					),
				]
			),
			stamped(
				'core/query',
				'section/posts-listing:list',
				{ clientId: 'listing' },
				[
					stamped(
						'core/column',
						'container/media',
						{ clientId: 'listing-media' },
						[
							stamped(
								'core/post-featured-image',
								'section/post-featured-image:default',
								{ clientId: 'listing-image' }
							),
						]
					),
					stamped(
						'core/group',
						'container/body',
						{ clientId: 'listing-body' },
						[
							stamped(
								'core/post-title',
								'section/post-title:default',
								{ clientId: 'listing-title' }
							),
							stamped(
								'core/post-excerpt',
								'section/post-excerpt:default',
								{ clientId: 'listing-excerpt' }
							),
						]
					),
				]
			),
			stamped(
				'core/group',
				'section/related-posts:default',
				{ clientId: 'related' },
				[
					stamped(
						'core/group',
						'container/body',
						{ clientId: 'related-body' },
						[
							stamped(
								'core/post-title',
								'section/post-title:default',
								{ clientId: 'related-title' }
							),
						]
					),
				]
			),
		]),
	];
}

function childStampIds(match) {
	return (match.block.innerBlocks || []).map((child) => getStamp(child)?.id);
}

describe('lookupFromInnerOrder', () => {
	it('pins nested parentId under the rule ancestor', () => {
		expect(
			lookupFromInnerOrder({
				parentId: 'body',
				within: 'related-posts',
			})
		).toEqual({
			selectedClientId: undefined,
			parentId: 'body',
			within: 'related-posts',
		});
	});
});

describe('nested slots across four sections', () => {
	const tree = pageWithNestedSlots();

	it('resolves each body and start under its owning section', () => {
		expect(
			findStampById(tree, 'body', { within: 'page-header' }).block
				.clientId
		).toBe('page-header-body');
		expect(
			findStampById(tree, 'start', { within: 'page-header' }).block
				.clientId
		).toBe('page-header-start');
		expect(
			findStampById(tree, 'body', { within: 'article' }).block.clientId
		).toBe('article-body');
		expect(
			findStampById(tree, 'start', { within: 'article' }).block.clientId
		).toBe('article-start');
		expect(
			findStampById(tree, 'body', { within: 'posts-listing' }).block
				.clientId
		).toBe('listing-body');
		expect(
			findStampById(tree, 'body', { within: 'related-posts' }).block
				.clientId
		).toBe('related-body');
	});

	it('does not leak a missing nested slot to another section', () => {
		expect(
			findStampById(tree, 'media', { within: 'page-header' })
		).toBeNull();
		expect(
			findStampById(tree, 'start', { within: 'posts-listing' })
		).toBeNull();
		expect(
			findStampById(tree, 'start', { within: 'related-posts' })
		).toBeNull();
	});

	it('resolves repeating post-title under the pinned section, not the first tree match', () => {
		expect(
			findStampById(tree, 'post-title', { within: 'article' }).block
				.clientId
		).toBe('article-title');
		expect(
			findStampById(tree, 'post-title', { within: 'posts-listing' }).block
				.clientId
		).toBe('listing-title');
		expect(
			findStampById(tree, 'post-title', { within: 'related-posts' }).block
				.clientId
		).toBe('related-title');
	});
});

describe('reorder stays inside the owning section', () => {
	const pageHeaderBodyOrder = {
		parentId: 'body',
		within: 'page-header',
		ids: ['page-header-title', 'page-header-description'],
	};
	const pageHeaderStartOrder = {
		parentId: 'start',
		within: 'page-header',
		ids: ['page-header-breadcrumbs'],
	};
	const articleBodyOrder = {
		parentId: 'body',
		within: 'article',
		ids: ['post-title', 'post-content'],
	};
	const listingBodyOrder = {
		parentId: 'body',
		within: 'posts-listing',
		ids: ['post-title', 'post-excerpt'],
	};

	function snapshotForeignRegions(blocks) {
		return {
			headerStart: childStampIds(
				findStampById(blocks, 'start', { within: 'page-header' })
			),
			articleStart: childStampIds(
				findStampById(blocks, 'start', { within: 'article' })
			),
			articleBody: childStampIds(
				findStampById(blocks, 'body', { within: 'article' })
			),
			listingMedia: childStampIds(
				findStampById(blocks, 'media', { within: 'posts-listing' })
			),
			relatedBody: childStampIds(
				findStampById(blocks, 'body', { within: 'related-posts' })
			),
		};
	}

	it('reorders page-header body without touching start or other bodies', () => {
		const tree = pageWithNestedSlots();
		const before = snapshotForeignRegions(tree);
		const lookup = lookupFromControl({
			id: 'reorder-body',
			innerOrder: pageHeaderBodyOrder,
		});
		const next = orderInnerSections(
			tree,
			'body',
			['page-header-description', 'page-header-title'],
			lookup
		);
		expect(
			childStampIds(
				findStampById(next, 'body', { within: 'page-header' })
			)
		).toEqual(['page-header-description', 'page-header-title']);
		expect(snapshotForeignRegions(next)).toEqual(before);
	});

	it('reorders page-header start without moving body children', () => {
		const tree = pageWithNestedSlots();
		const lookup = lookupFromControl({
			id: 'reorder-start',
			innerOrder: pageHeaderStartOrder,
		});
		const next = orderInnerSections(
			tree,
			'start',
			['page-header-breadcrumbs'],
			lookup
		);
		expect(
			childStampIds(
				findStampById(next, 'start', { within: 'page-header' })
			)
		).toEqual(['page-header-breadcrumbs']);
		expect(
			childStampIds(
				findStampById(next, 'body', { within: 'page-header' })
			)
		).toEqual(['page-header-title', 'page-header-description']);
		expect(
			childStampIds(findStampById(next, 'start', { within: 'article' }))
		).toEqual(['kicker']);
	});

	it('reorders listing body post-title without stealing article or related titles', () => {
		const tree = pageWithNestedSlots();
		const lookup = lookupFromControl({
			id: 'reorder-body',
			innerOrder: listingBodyOrder,
		});
		const next = orderInnerSections(
			tree,
			'body',
			['post-excerpt', 'post-title'],
			lookup
		);
		expect(
			childStampIds(
				findStampById(next, 'body', { within: 'posts-listing' })
			)
		).toEqual(['post-excerpt', 'post-title']);
		expect(
			childStampIds(findStampById(next, 'body', { within: 'article' }))
		).toEqual(['post-title', 'post-content']);
		expect(
			childStampIds(
				findStampById(next, 'body', { within: 'related-posts' })
			)
		).toEqual(['post-title']);
		expect(
			findStampById(next, 'post-title', { within: 'article' }).block
				.clientId
		).toBe('article-title');
		expect(
			findStampById(next, 'post-title', { within: 'related-posts' }).block
				.clientId
		).toBe('related-title');
	});

	it('reorders article body without touching listing or related', () => {
		const tree = pageWithNestedSlots();
		const lookup = lookupFromControl({
			id: 'reorder-body',
			innerOrder: articleBodyOrder,
		});
		const next = orderInnerSections(
			tree,
			'body',
			['post-content', 'post-title'],
			lookup
		);
		expect(
			childStampIds(findStampById(next, 'body', { within: 'article' }))
		).toEqual(['post-content', 'post-title']);
		expect(
			childStampIds(
				findStampById(next, 'body', { within: 'posts-listing' })
			)
		).toEqual(['post-title', 'post-excerpt']);
		expect(
			childStampIds(
				findStampById(next, 'body', { within: 'related-posts' })
			)
		).toEqual(['post-title']);
	});

	it('moves listing featured image into listing body, not article or page-header', () => {
		const tree = pageWithNestedSlots();
		const lookup = lookupFromControl({
			id: 'reorder-body',
			innerOrder: {
				parentId: 'body',
				within: 'posts-listing',
				bucketParents: ['media', 'body'],
				ids: ['post-featured-image', 'post-title', 'post-excerpt'],
			},
		});
		const next = moveInnerSection(
			tree,
			'post-featured-image',
			'body',
			0,
			lookup
		);
		expect(
			childStampIds(
				findStampById(next, 'media', { within: 'posts-listing' })
			)
		).toEqual([]);
		expect(
			childStampIds(
				findStampById(next, 'body', { within: 'posts-listing' })
			)
		).toEqual(['post-featured-image', 'post-title', 'post-excerpt']);
		expect(
			childStampIds(findStampById(next, 'body', { within: 'article' }))
		).toEqual(['post-title', 'post-content']);
		expect(
			childStampIds(
				findStampById(next, 'body', { within: 'page-header' })
			)
		).toEqual(['page-header-title', 'page-header-description']);
		expect(
			findStampById(next, 'media', { within: 'article' }).block
				.innerBlocks.length
		).toBe(0);
	});
});
