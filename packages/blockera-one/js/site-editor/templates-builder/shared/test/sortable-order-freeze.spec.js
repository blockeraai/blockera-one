/**
 * Session freeze keys, shared parent/nested surfaces, and stack prune.
 */

import {
	ARTICLE_BLOCK_INNER_ORDER,
	LOOP_BLOCK_INNER_ORDER,
} from '../sections/section-blocks';
import { singularContentGroup } from '../sections/singular-content-group';
import { postsLoopGroup } from '../sections/posts-loop-group';
import {
	collectInnerOrderSurfaces,
	innerOrderFreezeKey,
	pruneFrozenOrders,
	ROOT_PANEL_KEY,
} from '../sortable-order-freeze';

const ARTICLE_KEY = innerOrderFreezeKey(ARTICLE_BLOCK_INNER_ORDER);

describe('innerOrderFreezeKey', () => {
	it('does not share article vs posts-listing lists', () => {
		expect(
			innerOrderFreezeKey({
				...ARTICLE_BLOCK_INNER_ORDER,
				within: 'posts-listing',
			})
		).not.toBe(ARTICLE_KEY);
	});
});

describe('collectInnerOrderSurfaces', () => {
	it('registers the same Post Content rule on root and the article panel', () => {
		const surfaces = collectInnerOrderSurfaces([singularContentGroup()]);
		expect(surfaces[ARTICLE_KEY]).toEqual(
			expect.arrayContaining([ROOT_PANEL_KEY, 'article'])
		);
	});

	it('registers Posts Loop blocks only on the nested posts-loop panel', () => {
		const surfaces = collectInnerOrderSurfaces([postsLoopGroup()]);
		const loopKey = innerOrderFreezeKey(LOOP_BLOCK_INNER_ORDER);
		expect(surfaces[loopKey]).toEqual(['posts-loop']);
	});
});

describe('pruneFrozenOrders', () => {
	const articleBuckets = [{ parentId: 'body', ids: ['post-title'] }];
	const loopKey = innerOrderFreezeKey(LOOP_BLOCK_INNER_ORDER);
	const loopBuckets = [{ parentId: 'body', ids: ['post-excerpt'] }];
	const surfaces = {
		[ARTICLE_KEY]: [ROOT_PANEL_KEY, 'article'],
		[loopKey]: ['posts-loop'],
	};
	const frozen = {
		[ARTICLE_KEY]: articleBuckets,
		[loopKey]: loopBuckets,
	};

	it('keeps a freeze while any surface is in the ancestor chain', () => {
		expect(pruneFrozenOrders(frozen, surfaces, [])[ARTICLE_KEY]).toBe(
			articleBuckets
		);
		expect(
			pruneFrozenOrders(frozen, surfaces, ['article'])[ARTICLE_KEY]
		).toBe(articleBuckets);
		expect(
			pruneFrozenOrders(frozen, surfaces, ['comments'])[ARTICLE_KEY]
		).toBe(articleBuckets);
	});

	it('drops a nested-only freeze when the stack returns to root', () => {
		expect(
			pruneFrozenOrders(frozen, surfaces, ['posts-loop'])[loopKey]
		).toBe(loopBuckets);
		expect(
			pruneFrozenOrders(frozen, surfaces, [])[loopKey]
		).toBeUndefined();
	});

	it('clears unknown keys that have no surfaces', () => {
		expect(
			pruneFrozenOrders({ orphan: articleBuckets }, surfaces, [])
		).toEqual({});
	});

	it('returns the same object when nothing is dropped', () => {
		const empty = {};
		expect(pruneFrozenOrders(empty, surfaces, [])).toBe(empty);
		expect(pruneFrozenOrders(frozen, surfaces, ['posts-loop'])).toBe(
			frozen
		);
	});
});
