/**
 * localReplaceForSection: in-place stamp swap vs structural move.
 */

import { insertRelative, replaceAtPath, removeAtPath } from '../tree';
import {
	localAttributeUpdates,
	localInnerPatches,
	localReplaceForSection,
	localReorderForParent,
	localToggleForSection,
} from '../ops/local-replace';
import { stamped } from './helpers/block-fixtures';

function listing(clientId, variant) {
	return stamped('core/query', `section/posts-listing:${variant}`, {
		clientId,
		query: { inherit: true },
	});
}

function tree(listingNode) {
	return [
		stamped('core/template-part', 'section/header:header-default', {
			clientId: 'header-1',
			slug: 'header-default',
		}),
		stamped(
			'core/group',
			'layout/main:no-sidebar',
			{ clientId: 'layout-1', tagName: 'main' },
			[
				stamped(
					'core/group',
					'area/content',
					{ clientId: 'content-1' },
					[listingNode]
				),
			]
		),
	];
}

describe('localReplaceForSection', () => {
	it('returns the outgoing clientId when only that stamp is replaced in place', () => {
		const prevListing = listing('listing-1', 'list');
		const prev = tree(prevListing);
		const nextListing = listing('listing-2', 'grid-2');
		const next = replaceAtPath(prev, [1, 0, 0], nextListing);

		expect(localReplaceForSection(prev, next, 'posts-listing')).toEqual({
			clientId: 'listing-1',
			blocks: [nextListing],
		});
	});

	it('returns undefined when the outgoing block has no clientId', () => {
		const prev = tree(listing(undefined, 'list'));
		const next = replaceAtPath(
			prev,
			[1, 0, 0],
			listing('listing-2', 'grid-2')
		);
		expect(
			localReplaceForSection(prev, next, 'posts-listing')
		).toBeUndefined();
	});

	it('returns undefined when a sibling also changes', () => {
		const prevListing = listing('listing-1', 'list');
		const prev = tree(prevListing);
		const nextListing = listing('listing-2', 'grid-2');
		let next = replaceAtPath(prev, [1, 0, 0], nextListing);
		next = replaceAtPath(next, [0], {
			...next[0],
			attributes: { ...next[0].attributes, slug: 'header-large' },
		});
		expect(
			localReplaceForSection(prev, next, 'posts-listing')
		).toBeUndefined();
	});

	it('returns undefined when the stamp moves to a new path', () => {
		const prevListing = listing('listing-1', 'list');
		const prev = tree(prevListing);
		const next = [
			prev[0],
			listing('listing-2', 'grid-2'),
			stamped(
				'core/group',
				'layout/main:no-sidebar',
				{ clientId: 'layout-1', tagName: 'main' },
				[
					stamped('core/group', 'area/content', {
						clientId: 'content-1',
					}),
				]
			),
		];
		expect(
			localReplaceForSection(prev, next, 'posts-listing')
		).toBeUndefined();
	});

	it('relocates page-header from content into the layout (simple → banner)', () => {
		const simple = stamped('core/group', 'section/page-header:simple', {
			clientId: 'ph-1',
		});
		const listingNode = listing('listing-1', 'list');
		const content = stamped(
			'core/group',
			'area/content',
			{ clientId: 'content-1' },
			[simple, listingNode]
		);
		const layout = stamped(
			'core/group',
			'layout/main:no-sidebar',
			{ clientId: 'layout-1', tagName: 'main' },
			[content]
		);
		const prev = [
			stamped('core/template-part', 'section/header:header-default', {
				clientId: 'header-1',
			}),
			layout,
		];
		const banner = stamped('core/group', 'section/page-header:banner', {
			clientId: 'ph-2',
		});
		const nextContent = {
			...content,
			innerBlocks: [listingNode],
		};
		const next = [
			prev[0],
			{
				...layout,
				innerBlocks: [banner, nextContent],
			},
		];
		expect(localReplaceForSection(prev, next, 'page-header')).toEqual({
			clientId: 'ph-1',
			blocks: [banner],
			destParentClientId: 'layout-1',
			destIndex: 0,
		});
	});
});

describe('localToggleForSection', () => {
	it('removes pagination from the query and keeps sibling refs', () => {
		const postTpl = stamped(
			'core/post-template',
			'container/post-template:default',
			{ clientId: 'tpl-1' }
		);
		const pag = stamped(
			'core/query-pagination',
			'section/pagination:standard',
			{ clientId: 'pag-1' }
		);
		const prev = tree(
			stamped(
				'core/query',
				'section/posts-listing:list',
				{ clientId: 'listing-1', query: { inherit: true } },
				[postTpl, pag]
			)
		);
		const next = removeAtPath(prev, [1, 0, 0, 1]);

		expect(localToggleForSection(prev, next, 'pagination')).toEqual({
			clientId: 'pag-1',
			blocks: [],
		});
	});

	it('inserts pagination at the end of the listing inner blocks', () => {
		const postTpl = stamped(
			'core/post-template',
			'container/post-template:default',
			{ clientId: 'tpl-1' }
		);
		const prev = tree(
			stamped(
				'core/query',
				'section/posts-listing:list',
				{ clientId: 'listing-1', query: { inherit: true } },
				[postTpl]
			)
		);
		const pag = stamped(
			'core/query-pagination',
			'section/pagination:standard',
			{ clientId: 'pag-2' }
		);
		const next = insertRelative(prev, [1, 0, 0], 'inside-end', [pag]);

		expect(localToggleForSection(prev, next, 'pagination')).toEqual({
			blocks: [pag],
			destParentClientId: 'listing-1',
			destIndex: 1,
		});
	});
});

describe('localReorderForParent', () => {
	it('returns the body clientId and permuted children', () => {
		const title = stamped(
			'core/query-title',
			'section/page-header-title:default',
			{ clientId: 'title-1' }
		);
		const desc = stamped(
			'core/term-description',
			'section/page-header-description:default',
			{ clientId: 'desc-1' }
		);
		const body = stamped(
			'core/group',
			'container/body',
			{ clientId: 'body-1' },
			[title, desc]
		);
		const prev = [
			stamped(
				'core/group',
				'section/page-header:simple',
				{ clientId: 'ph-1' },
				[body]
			),
		];
		const nextBody = { ...body, innerBlocks: [desc, title] };
		const next = [
			{
				...prev[0],
				innerBlocks: [nextBody],
			},
		];

		expect(
			localReorderForParent(prev, next, 'body', {
				parentId: 'body',
				within: 'page-header',
			})
		).toEqual({
			reorderParentClientId: 'body-1',
			blocks: [desc, title],
		});
	});
});

describe('localInnerPatches', () => {
	it('keeps the live prev clientId when next rebuilds children without ids', () => {
		const author = stamped(
			'core/group',
			'section/post-meta-author-name:default',
			{ clientId: 'author-1' }
		);
		const sep = stamped('core/paragraph', 'meta-separator', {
			clientId: 'sep-1',
			content: '·',
		});
		const date = stamped(
			'core/group',
			'section/post-meta-post-date:default',
			{ clientId: 'date-1' }
		);
		const prev = [
			stamped(
				'core/group',
				'section/post-meta:default',
				{ clientId: 'row-1' },
				[author, sep, date]
			),
		];
		const nextSep = stamped('core/paragraph', 'meta-separator', {
			content: '/',
		});
		const next = [
			{
				...prev[0],
				innerBlocks: [author, nextSep, date],
			},
		];
		expect(localInnerPatches(prev, next)).toEqual({
			blocks: [],
			innerPatches: [
				{
					clientId: 'sep-1',
					attributes: nextSep.attributes,
				},
			],
		});
	});
});

describe('localAttributeUpdates', () => {
	it('collects the changed node when only attributes change', () => {
		const prev = [
			stamped('core/group', 'section/page-header:simple', {
				clientId: 'ph-1',
			}),
		];
		const next = replaceAtPath(prev, [0], {
			...prev[0],
			attributes: {
				...prev[0].attributes,
				style: { spacing: { blockGap: '24px' } },
			},
		});
		expect(localAttributeUpdates(prev, next)).toEqual({
			blocks: [],
			attributeUpdates: [
				{
					clientId: 'ph-1',
					attributes: next[0].attributes,
				},
			],
		});
	});
});
