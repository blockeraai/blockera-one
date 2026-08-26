/**
 * applyOperation setTemplateSetting / selectInCanvas / unknown ops.
 * The WP parse/serialize adapter is mocked with an internal markup map
 * so no @wordpress/blocks registration is needed.
 */

jest.mock('../blocks-adapter', () => {
	const markup = {};
	return {
		defaultOpsContext: {
			parse: (html) => JSON.parse(JSON.stringify(markup[html] ?? [])),
			serialize: () => '',
		},
		__setMarkup: (key, tree) => {
			markup[key] = tree;
		},
	};
});

import { apply, CONTROLS } from './helpers/apply-operation-setup';
import { TEMPLATE_SETTINGS_KEY } from '../constants';

describe('setTemplateSetting', () => {
	it('returns site edits with the bucket map and the mirrored posts_per_page', () => {
		const result = apply(CONTROLS.postsPerPage, 24, {
			settings: { posts_per_page: { archive: 12, category: 6 } },
		});

		expect(result.kind).toBe('site-edits');
		expect(result.edits).toEqual({
			[TEMPLATE_SETTINGS_KEY]: {
				posts_per_page: { archive: 24, category: 6 },
			},
			posts_per_page: 24,
		});
	});

	it('coerces non-numeric values to the 10 fallback', () => {
		const result = apply(CONTROLS.postsPerPage, 'not-a-number');
		expect(result.edits.posts_per_page).toBe(10);
	});
});
describe('selectInCanvas', () => {
	it('does not mutate the block tree', () => {
		expect(
			apply(
				{
					id: 'breadcrumbs-customize',
					type: 'button',
					label: 'Customize in editor',
					target: { kind: 'section', id: 'page-header-breadcrumbs' },
					operation: 'selectInCanvas',
				},
				true
			)
		).toBeNull();
	});
});

describe('unknown operations', () => {
	it('returns null so callers can ignore the change', () => {
		expect(
			apply({ ...CONTROLS.queryPerPage, operation: 'unsupported' }, 1)
		).toBeNull();
	});
});
