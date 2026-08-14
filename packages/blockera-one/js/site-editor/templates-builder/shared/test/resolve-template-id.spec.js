/**
 * resolve-template-id.ts: template entity resolution per filter with an
 * injected findBySlug (no WP data, no real templates).
 */

// templates/constants (pulled via templates-matchers) imports the
// nested-panels barrel whose module graph reaches @wordpress/block-editor UI.
// Only readPanelStack is consumed there — stub it to keep this suite light.
jest.mock('../../../nested-panels', () => ({
	readPanelStack: () => [],
}));

import { resolveTemplateIdForFilter } from '../resolve-template-id';

function makeFinder(records) {
	return (slug) => records.find((r) => r.slug === slug);
}

describe('resolveTemplateIdForFilter', () => {
	it('resolves the base template directly when it exists', () => {
		const findBySlug = makeFinder([
			{ id: 'theme//category', slug: 'category' },
			{ id: 'theme//archive', slug: 'archive' },
		]);

		expect(resolveTemplateIdForFilter('category', findBySlug)).toEqual({
			id: 'theme//category',
			slug: 'category',
			isFallback: false,
		});
	});

	it('falls back through the WP template hierarchy when the base is missing', () => {
		// No category.html → category falls back to archive.html.
		const findBySlug = makeFinder([
			{ id: 'theme//archive', slug: 'archive' },
			{ id: 'theme//index', slug: 'index' },
		]);

		expect(resolveTemplateIdForFilter('category', findBySlug)).toEqual({
			id: 'theme//archive',
			slug: 'archive',
			isFallback: true,
		});

		// Deeper fallback: only index exists.
		const indexOnly = makeFinder([{ id: 'theme//index', slug: 'index' }]);
		expect(resolveTemplateIdForFilter('category', indexOnly)).toEqual({
			id: 'theme//index',
			slug: 'index',
			isFallback: true,
		});
	});

	it('reports the base slug with a null id when nothing in the chain exists', () => {
		expect(resolveTemplateIdForFilter('category', () => undefined)).toEqual(
			{
				id: null,
				slug: 'category',
				isFallback: false,
			}
		);
	});

	it('returns nulls for filters without a base template slug', () => {
		const findBySlug = makeFinder([{ id: 'theme//index', slug: 'index' }]);

		for (const filter of ['all', 'active', 'user', 'parts']) {
			expect(resolveTemplateIdForFilter(filter, findBySlug)).toEqual({
				id: null,
				slug: null,
				isFallback: false,
			});
		}
	});

	it('keeps the record slug when it differs from the queried one', () => {
		// findBySlug may return records without a slug — fall back to the query.
		const findBySlug = (slug) =>
			slug === 'archive' ? { id: 'theme//archive' } : undefined;

		expect(resolveTemplateIdForFilter('category', findBySlug)).toEqual({
			id: 'theme//archive',
			slug: 'archive',
			isFallback: true,
		});
	});
});
