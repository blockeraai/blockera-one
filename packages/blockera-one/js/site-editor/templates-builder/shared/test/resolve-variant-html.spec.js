/**
 * resolve-variant-html: pattern-store lookup, template-part comment
 * generation, and the loading/missing behavior (fake pattern map, no WP).
 */

import {
	hasUnresolvedVariants,
	resolveConfigVariantsHtml,
	resolveVariantHtml,
} from '../resolve-variant-html';
import { buildTemplatePartHtml } from '../template-part-html';

const PATTERNS = [
	{
		name: 'blockera-one/builder-archive-listing-list',
		content:
			'<!-- wp:query {"metadata":{"blockeraOne":"section/posts-listing:list"}} --><!-- /wp:query -->',
	},
	{
		name: 'blockera-one/builder-archive-pagination-standard',
		content:
			'<!-- wp:query-pagination {"metadata":{"blockeraOne":"section/pagination:standard"}} /-->',
	},
];

const listVariant = {
	id: 'list',
	label: 'List',
	kind: 'pattern',
	patternSlug: 'blockera-one/builder-archive-listing-list',
};

const headerVariant = {
	id: 'header',
	label: 'Default',
	kind: 'templatePart',
	slug: 'header',
	area: 'header',
	tagName: 'header',
};

describe('buildTemplatePartHtml', () => {
	it('builds the stamped self-closing comment (attribute order stable)', () => {
		expect(buildTemplatePartHtml(headerVariant, 'header')).toBe(
			'<!-- wp:template-part {"slug":"header","area":"header","tagName":"header","metadata":{"blockeraOne":"section/header:header"}} /-->'
		);
	});

	it('omits optional area/tagName and returns null without a slug', () => {
		expect(
			buildTemplatePartHtml({ id: 'x', label: 'X', slug: 'x-part' }, 's')
		).toBe(
			'<!-- wp:template-part {"slug":"x-part","metadata":{"blockeraOne":"section/s:x"}} /-->'
		);
		expect(buildTemplatePartHtml({ id: 'x', label: 'X' }, 's')).toBeNull();
	});
});

describe('resolveVariantHtml', () => {
	it('resolves pattern content by slug from the patterns payload', () => {
		expect(resolveVariantHtml(listVariant, 'posts-listing', PATTERNS)).toBe(
			PATTERNS[0].content
		);
	});

	it('returns null while patterns are unavailable or the slug is unregistered', () => {
		expect(
			resolveVariantHtml(listVariant, 'posts-listing', undefined)
		).toBeNull();
		expect(
			resolveVariantHtml(
				{ ...listVariant, patternSlug: 'blockera-one/nope' },
				'posts-listing',
				PATTERNS
			)
		).toBeNull();
	});

	it('prefers pre-resolved html (test injection path)', () => {
		expect(
			resolveVariantHtml(
				{ ...listVariant, html: '<!-- injected -->' },
				'posts-listing',
				PATTERNS
			)
		).toBe('<!-- injected -->');
	});

	it('generates template-part markup without touching the pattern payload', () => {
		expect(resolveVariantHtml(headerVariant, 'header', undefined)).toBe(
			buildTemplatePartHtml(headerVariant, 'header')
		);
	});
});

describe('resolveConfigVariantsHtml', () => {
	function makeConfig() {
		return {
			type: 'archive',
			filters: ['archive'],
			layoutId: 'main',
			groups: [
				{
					id: 'page-layout',
					title: 'Posts Loop',
					controls: [
						{
							id: 'posts-template',
							type: 'layout-picker',
							label: 'Posts Template',
							target: { kind: 'section', id: 'posts-listing' },
							operation: 'swapSection',
							variants: [
								{ ...listVariant },
								{
									id: 'missing',
									label: 'Missing',
									kind: 'pattern',
									patternSlug: 'blockera-one/unregistered',
								},
							],
						},
					],
				},
			],
		};
	}

	it('fills html and keeps unresolved tiles while patterns are loading', () => {
		const resolved = resolveConfigVariantsHtml(
			makeConfig(),
			undefined,
			false
		);
		const variants = resolved.groups[0].controls[0].variants;
		expect(variants).toHaveLength(2);
		expect(variants[0].html).toBeUndefined();
		expect(hasUnresolvedVariants(resolved.groups[0].controls[0])).toBe(
			true
		);
	});

	it('drops tiles whose pattern is missing once resolution finished', () => {
		const config = makeConfig();
		const snapshot = JSON.parse(JSON.stringify(config));
		const resolved = resolveConfigVariantsHtml(config, PATTERNS, true);
		const variants = resolved.groups[0].controls[0].variants;

		expect(variants.map((v) => v.id)).toEqual(['list']);
		expect(variants[0].html).toBe(PATTERNS[0].content);
		expect(hasUnresolvedVariants(resolved.groups[0].controls[0])).toBe(
			false
		);
		// Pure: the input config is untouched.
		expect(config).toEqual(snapshot);
	});

	it('never drops templatePart variants (no pattern dependency)', () => {
		const config = makeConfig();
		config.groups[0].controls[0].variants.push({ ...headerVariant });
		const resolved = resolveConfigVariantsHtml(config, PATTERNS, true);
		const ids = resolved.groups[0].controls[0].variants.map((v) => v.id);
		expect(ids).toEqual(['list', 'header']);
	});

	it('keeps position-only variants and does not treat them as unresolved', () => {
		const position = {
			id: 'top',
			label: 'Top',
			placement: { relativeTo: 'page-header', position: 'inside-start' },
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: 'main',
			groups: [
				{
					id: 'breadcrumbs',
					title: 'Breadcrumbs',
					controls: [
						{
							id: 'breadcrumbs-position',
							type: 'select',
							label: 'Position',
							target: {
								kind: 'section',
								id: 'page-header-breadcrumbs',
							},
							operation: 'placeSection',
							variants: [position],
						},
					],
				},
			],
		};
		const resolved = resolveConfigVariantsHtml(config, PATTERNS, true);
		const control = resolved.groups[0].controls[0];
		expect(control.variants.map((v) => v.id)).toEqual(['top']);
		expect(hasUnresolvedVariants(control)).toBe(false);
	});
});
