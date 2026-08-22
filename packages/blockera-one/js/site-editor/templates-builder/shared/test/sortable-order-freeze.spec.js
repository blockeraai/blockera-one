/**
 * Session freeze keys. Prune/surfaces were removed; order lasts the visit.
 */

import { ARTICLE_BLOCK_INNER_ORDER } from '../sections/section-blocks';
import { innerOrderFreezeKey } from '../sortable-order-freeze';

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
