/**
 * registry.ts: filter → hydrated config resolution (inline window catalog,
 * torn down after the suite) plus structural invariants on the static
 * archive config source. No theme patterns/templates or PHP fixture reads —
 * the schema/fixture contract lives in hydrate-config.spec.js + PHPUnit.
 */

// templates/constants (pulled via archive/config) imports the nested-panels
// barrel whose module graph reaches @wordpress/block-editor UI. Only
// readPanelStack is consumed there — stub it to keep this suite light.
jest.mock('../../../nested-panels', () => ({
	readPanelStack: () => [],
}));

// Inline catalog payload must exist before the registry hydrates (module
// memoizes per type on first access).
const INLINE_CATALOG = {
	archive: {
		header: [
			{
				id: 'header-default',
				label: 'Default',
				kind: 'templatePart',
				slug: 'header-default',
				area: 'header',
			},
		],
		footer: [
			{
				id: 'footer-default',
				label: 'Default',
				kind: 'templatePart',
				slug: 'footer-default',
				area: 'footer',
			},
		],
		'page-header': [
			{
				id: 'default',
				label: 'Default',
				kind: 'pattern',
				patternSlug: 'test/page-header-default',
			},
		],
		'posts-listing': [
			{
				id: 'list',
				label: 'List',
				kind: 'pattern',
				patternSlug: 'test/listing-list',
			},
			{
				id: 'grid-2',
				label: 'Grid 2',
				kind: 'pattern',
				patternSlug: 'test/listing-grid-2',
			},
		],
		'page-header-title': [
			{
				id: 'default',
				label: 'Title',
				kind: 'pattern',
				patternSlug: 'test/page-header-title',
			},
		],
		'page-header-description': [
			{
				id: 'default',
				label: 'Description',
				kind: 'pattern',
				patternSlug: 'test/page-header-description',
			},
		],
		'page-header-breadcrumbs': [
			{
				id: 'default',
				label: 'Breadcrumbs',
				kind: 'pattern',
				patternSlug: 'test/page-header-breadcrumbs',
			},
		],
		pagination: [
			{
				id: 'standard',
				label: 'Standard',
				kind: 'pattern',
				patternSlug: 'test/pagination-standard',
			},
			{
				id: 'load-more',
				label: 'Load more',
				disabled: true,
				badge: 'Coming soon',
			},
		],
		'pagination-previous': [
			{
				id: 'default',
				label: 'Previous',
				kind: 'pattern',
				patternSlug: 'test/pagination-previous',
			},
		],
		'pagination-next': [
			{
				id: 'default',
				label: 'Next',
				kind: 'pattern',
				patternSlug: 'test/pagination-next',
			},
		],
		'pagination-numbers': [
			{
				id: 'default',
				label: 'Numbers',
				kind: 'pattern',
				patternSlug: 'test/pagination-numbers',
			},
		],
		layout: [
			{
				id: 'no-sidebar',
				label: 'None',
				kind: 'pattern',
				patternSlug: 'test/layout-none',
				areas: ['content'],
			},
			{
				id: 'sidebar-right',
				label: 'Right',
				kind: 'pattern',
				patternSlug: 'test/layout-right',
				areas: ['content', 'sidebar-area'],
			},
			{
				id: 'sidebar-left',
				label: 'Left',
				kind: 'pattern',
				patternSlug: 'test/layout-left',
				areas: ['content', 'sidebar-area'],
			},
		],
	},
};

window.blockeraOneTemplateBuilder = { catalog: INLINE_CATALOG };

// Import after the payload is in place (registry registers roles on load).
const {
	ARCHIVE_OPTIONS_CONFIG,
	getOptionsConfigForFilter,
} = require('../../registry');
const { flattenPanelControls } = require('../resolve-options-panel');

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

afterAll(() => {
	delete window.blockeraOneTemplateBuilder;
});

describe('getOptionsConfigForFilter', () => {
	it('returns the hydrated archive config for every archive-family filter', () => {
		const config = getOptionsConfigForFilter('archive');
		expect(config).not.toBeNull();
		expect(config.type).toBe('archive');

		const postsTemplate = flattenPanelControls(config.groups).find(
			(c) => c.id === 'posts-template'
		);
		expect(postsTemplate.variants.map((v) => v.id)).toEqual([
			'list',
			'grid-2',
		]);

		// catalogExclude drops the toggle-off layout from the position picker.
		const sidebarPosition = flattenPanelControls(config.groups).find(
			(c) => c.id === 'sidebar-position'
		);
		expect(sidebarPosition.variants.map((v) => v.id)).toEqual([
			'sidebar-right',
			'sidebar-left',
		]);
	});

	it('memoizes the hydrated config per type (same reference)', () => {
		const first = getOptionsConfigForFilter('archive');
		const second = getOptionsConfigForFilter('category');
		expect(second).toBe(first);
		// The static source config is never mutated by hydration.
		expect(first).not.toBe(ARCHIVE_OPTIONS_CONFIG);
		const staticControl = flattenPanelControls(
			ARCHIVE_OPTIONS_CONFIG.groups
		).find((c) => c.id === 'posts-template');
		expect(staticControl.variants).toBeUndefined();
	});

	it('returns null for unknown or empty filters', () => {
		expect(getOptionsConfigForFilter('single')).toBeNull();
		expect(getOptionsConfigForFilter('')).toBeNull();
		expect(getOptionsConfigForFilter(null)).toBeNull();
		expect(getOptionsConfigForFilter(undefined)).toBeNull();
	});
});

describe('archive config structural invariants', () => {
	const config = ARCHIVE_OPTIONS_CONFIG;
	const controls = flattenPanelControls(config.groups);
	const controlIds = new Set(controls.map((c) => c.id));

	// Stamp-id existence/role checks for layoutId, control targets, insert
	// anchors, heuristics, and sibling sections live in the pattern lint
	// (template-builder.spec.js), which owns the stamp dictionaries.

	it('points conditions and reapply hints at existing control ids', () => {
		for (const control of controls) {
			for (const condition of control.conditions || []) {
				expect(controlIds.has(condition.controlId)).toBe(true);
			}
			for (const depId of control.swapHints?.reapplyControls || []) {
				expect(controlIds.has(depId)).toBe(true);
			}
		}
	});

	it('declares catalog pools (never inline variants) on the static config', () => {
		for (const control of controls) {
			if (control.catalogPool) {
				expect(control.variants).toBeUndefined();
				expect(control.catalogPool).toMatch(KEBAB);
			}
		}
	});

	it('omits inspector labels on layout-picker controls', () => {
		const pickers = controls.filter((c) => c.type === 'layout-picker');
		expect([...new Set(pickers.map((c) => c.id))].sort()).toEqual([
			'footer-design',
			'header-design',
			'page-header-design',
			'pagination-design',
			'posts-template',
			'sidebar-position',
		]);
		for (const control of pickers) {
			expect(control.label).toBeUndefined();
		}
	});

	it('gives page header Design a customize-in-editor action', () => {
		const pageHeader = config.groups.find((g) => g.id === 'page-header');
		const design = pageHeader.nestedPanel.groups.find(
			(g) => g.id === 'page-header-design'
		);

		expect(pageHeader.controls[0].id).toBe('page-header-design');
		expect(pageHeader.controls[0].label).toBeUndefined();
		expect(design.controls.map((c) => c.id)).toEqual([
			'page-header-design',
			'page-header-gap',
			'page-header-bottom-spacing',
			'page-header-align',
			'page-header-align-banner',
			'page-header-bg-color',
			'page-header-min-height',
			'page-header-padding',
			'page-header-elements-width',
			'page-header-customize',
		]);
		expect(design.controls[0].label).toBeUndefined();

		const customize = design.controls.find(
			(c) => c.id === 'page-header-customize'
		);
		expect(customize.type).toBe('button');
		expect(customize.operation).toBe('selectInCanvas');
		expect(customize.target).toEqual({
			kind: 'section',
			id: 'page-header',
		});

		const alignBanner = design.controls.find(
			(c) => c.id === 'page-header-align-banner'
		);
		expect(alignBanner.target).toEqual({
			kind: 'container',
			id: 'elements',
		});
		expect(alignBanner.alsoSetOn).toBeUndefined();
	});

	it('gives title and description a Design nested panel without Settings', () => {
		const title = controls.find((c) => c.id === 'page-header-title');
		const description = controls.find(
			(c) => c.id === 'page-header-description'
		);

		expect(title.nestedPanel.id).toBe('page-header-title');
		expect(title.nestedPanel.groups.map((g) => g.id)).toEqual([
			'title-design',
		]);
		expect(title.nestedPanel.groups[0].controls.map((c) => c.id)).toEqual([
			'title-style',
			'title-color',
			'title-bg-color',
			'title-font-size',
			'title-customize',
		]);

		expect(description.nestedPanel.id).toBe('page-header-description');
		expect(description.nestedPanel.groups.map((g) => g.id)).toEqual([
			'description-design',
		]);
		expect(
			description.nestedPanel.groups[0].controls.map((c) => c.id)
		).toEqual([
			'description-style',
			'description-color',
			'description-bg-color',
			'description-font-size',
			'description-customize',
		]);
	});

	it('puts Style first in Design groups that change block style variation', () => {
		const breadcrumbs = controls.find(
			(c) => c.id === 'page-header-breadcrumbs'
		);
		const design = breadcrumbs.nestedPanel.groups.find(
			(g) => g.id === 'breadcrumbs-design'
		);

		expect(design.controls[0].id).toBe('breadcrumbs-style');
		expect(design.controls[0].operation).toBe('setBlockStyle');
	});

	it('gates pagination as its own group between Posts Loop and Sidebar', () => {
		expect(config.groups.map((g) => g.id)).toEqual([
			'site-header',
			'page-header',
			'page-layout',
			'pagination',
			'sidebar',
			'site-footer',
		]);
		const pagination = config.groups.find((g) => g.id === 'pagination');
		expect(pagination.headerToggle.id).toBe('pagination');
		expect(pagination.headerToggle.operation).toBe('toggleSection');
		expect(pagination.controls).toEqual([]);
		expect(pagination.nestedPanel.id).toBe('pagination');
		expect(pagination.nestedPanel.title).toBe('Pagination');
		expect(pagination.nestedPanel.groups.map((g) => g.id)).toEqual([
			'pagination-design',
			'pagination-elements',
		]);
		expect(
			pagination.nestedPanel.groups[0].controls.map((c) => c.id)
		).toEqual([
			'pagination-design',
			'pagination-style',
			'pagination-top-divider',
			'pagination-top-spacing',
			'pagination-customize',
		]);
		const customize = pagination.nestedPanel.groups[0].controls.find(
			(c) => c.id === 'pagination-customize'
		);
		expect(customize.type).toBe('button');
		expect(customize.operation).toBe('selectInCanvas');
		expect(customize.target).toEqual({
			kind: 'section',
			id: 'pagination',
		});
		const elements = pagination.nestedPanel.groups[1].controls;
		expect(elements.map((c) => c.id)).toEqual([
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		]);
		expect(elements[0].requireAtLeastOneOf).toEqual([
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		]);
		expect(elements[0].alsoToggle).toBeUndefined();
		expect(
			elements.map((c) => c.nestedPanel.groups.map((g) => g.id))
		).toEqual([
			['pagination-prev-design', 'pagination-prev-settings'],
			['pagination-num-design', 'pagination-num-settings'],
			['pagination-next-design', 'pagination-next-settings'],
		]);
		for (const element of elements) {
			const design = element.nestedPanel.groups[0];
			expect(
				design.controls.some((c) => c.operation === 'selectInCanvas')
			).toBe(true);
		}
	});

	it('overrides Number of posts to an even label/field split', () => {
		const postsPerPage = controls.find((c) => c.id === 'posts-per-page');
		expect(postsPerPage.type).toBe('number');
		expect(postsPerPage.columns).toBe('2fr 2fr');
	});

	it('locks page header elements with requireAtLeastOneOf', () => {
		const title = controls.find((c) => c.id === 'page-header-title');
		expect(title.requireAtLeastOneOf).toEqual([
			'page-header-title',
			'page-header-description',
			'page-header-breadcrumbs',
		]);
	});

	it('adds a Design and Elements gateway on the Posts Loop card', () => {
		const pageLayout = config.groups.find((g) => g.id === 'page-layout');
		expect(pageLayout.controls.map((c) => c.id)).toEqual([
			'posts-template',
			'posts-per-page',
			'posts-loop',
		]);
		const gateway = pageLayout.controls.find((c) => c.id === 'posts-loop');
		expect(gateway.type).toBe('gateway');
		expect(gateway.nestedPanel.id).toBe('posts-loop');
		expect(gateway.nestedPanel.groups.map((g) => g.id)).toEqual([
			'posts-loop-design',
			'posts-loop-elements',
		]);
		expect(gateway.nestedPanel.groups[0].controls.map((c) => c.id)).toEqual(
			['posts-template']
		);
		const elements = gateway.nestedPanel.groups[1].controls;
		expect(elements.map((c) => c.id)).toEqual([
			'post-featured-image',
			'post-title',
			'post-excerpt',
			'post-content',
			'post-read-more',
			'post-meta',
			'post-meta-2',
		]);
		expect(elements[0].requireAtLeastOneOf).toEqual(
			elements.map((c) => c.id)
		);
		expect(elements[0].innerOrder.bucketParents).toEqual([
			'loop-item-media',
			'loop-item-content',
		]);
		expect(elements[0].innerOrder.showParentNames).toBe(true);
		expect(elements[5].label).toBe('Post Meta');
		expect(elements[6].label).toBe('Post Meta');
	});

	it('gives every Posts Loop element Design a customize-in-editor action', () => {
		const postsLoop = config.groups
			.find((g) => g.id === 'page-layout')
			.controls.find((c) => c.id === 'posts-loop');
		const elements = postsLoop.nestedPanel.groups[1].controls;

		for (const element of elements) {
			const design = element.nestedPanel.groups[0];
			const customize = design.controls.find(
				(c) => c.operation === 'selectInCanvas'
			);
			expect(customize).toBeDefined();
			expect(customize.type).toBe('button');
			expect(customize.id).toBe(`${element.id}-customize`);
			expect(customize.target).toEqual({
				kind: 'section',
				id: element.id,
			});
		}

		for (const meta of [elements[5], elements[6]]) {
			const metaChildren = meta.nestedPanel.groups[1].controls;
			for (const child of metaChildren) {
				const design = child.nestedPanel.groups[0];
				const customize = design.controls.find(
					(c) => c.operation === 'selectInCanvas'
				);
				expect(customize).toBeDefined();
				expect(customize.id).toBe(`${child.id}-customize`);
				expect(customize.target).toEqual({
					kind: 'section',
					id: child.id,
				});
			}
		}
	});

	it('keeps two Post Meta rows on independent stamps and child lists', () => {
		const meta1 = controls.find((c) => c.id === 'post-meta');
		const meta2 = controls.find((c) => c.id === 'post-meta-2');
		expect(meta1.target.id).toBe('post-meta');
		expect(meta2.target.id).toBe('post-meta-2');
		expect(meta1.nestedPanel.groups.map((g) => g.id)).toEqual([
			'post-meta-design',
			'post-meta-elements',
		]);
		expect(meta2.nestedPanel.groups.map((g) => g.id)).toEqual([
			'post-meta-2-design',
			'post-meta-2-elements',
		]);
		expect(meta1.nestedPanel.groups[0].keepVisible).toBe(true);
		expect(meta1.nestedPanel.groups[0].controls.map((c) => c.id)).toEqual([
			'post-meta-customize',
		]);
		expect(meta1.nestedPanel.groups[0].controls[0].operation).toBe(
			'selectInCanvas'
		);
		expect(meta1.nestedPanel.groups[0].controls[0].target).toEqual({
			kind: 'section',
			id: 'post-meta',
		});
		expect(meta2.nestedPanel.groups[0].controls.map((c) => c.id)).toEqual([
			'post-meta-2-customize',
		]);
		const children1 = meta1.nestedPanel.groups[1].controls.map((c) => c.id);
		const children2 = meta2.nestedPanel.groups[1].controls.map((c) => c.id);
		expect(children1).toEqual([
			'post-meta-author-name',
			'post-meta-comments-count',
			'post-meta-comments-link',
			'post-meta-date',
			'post-meta-post-date',
			'post-meta-modified-date',
			'post-meta-categories',
			'post-meta-tags',
			'post-meta-time-to-read',
			'post-meta-word-count',
		]);
		expect(children2).toEqual(
			children1.map((id) => id.replace('post-meta-', 'post-meta-2-'))
		);
		expect(
			meta1.nestedPanel.groups[1].controls[0].innerOrder.parentId
		).toBe('post-meta');
		expect(
			meta1.nestedPanel.groups[1].controls[0].innerOrder.showParentNames
		).toBeUndefined();
		expect(
			meta2.nestedPanel.groups[1].controls[0].innerOrder.parentId
		).toBe('post-meta-2');
		expect(
			meta1.nestedPanel.groups[1].controls[0].requireAtLeastOneOf
		).toEqual(children1);
		expect(
			meta2.nestedPanel.groups[1].controls[0].requireAtLeastOneOf
		).toEqual(children2);
	});
});
