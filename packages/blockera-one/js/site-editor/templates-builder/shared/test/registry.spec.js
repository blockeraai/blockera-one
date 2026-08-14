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
		'page-title': [
			{
				id: 'default',
				label: 'Default',
				kind: 'pattern',
				patternSlug: 'test/page-title-default',
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
		'page-title-title': [
			{
				id: 'default',
				label: 'Title',
				kind: 'pattern',
				patternSlug: 'test/page-title-title',
			},
		],
		'page-title-description': [
			{
				id: 'default',
				label: 'Description',
				kind: 'pattern',
				patternSlug: 'test/page-title-description',
			},
		],
		'page-title-breadcrumbs': [
			{
				id: 'default',
				label: 'Breadcrumbs',
				kind: 'pattern',
				patternSlug: 'test/page-title-breadcrumbs',
			},
		],
		pagination: [
			{
				id: 'standard',
				label: 'Standard',
				kind: 'pattern',
				patternSlug: 'test/pagination-standard',
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

	it('gives title and description a Design nested panel without Settings', () => {
		const title = controls.find((c) => c.id === 'page-title-title');
		const description = controls.find(
			(c) => c.id === 'page-title-description'
		);

		expect(title.nestedPanel.id).toBe('page-header-title');
		expect(title.nestedPanel.groups.map((g) => g.id)).toEqual([
			'title-design',
		]);
		expect(title.nestedPanel.groups[0].controls.map((c) => c.id)).toEqual([
			'title-color',
			'title-bg-color',
			'title-font-size',
			'title-style',
			'title-customize',
		]);

		expect(description.nestedPanel.id).toBe('page-header-description');
		expect(description.nestedPanel.groups.map((g) => g.id)).toEqual([
			'description-design',
		]);
		expect(
			description.nestedPanel.groups[0].controls.map((c) => c.id)
		).toEqual([
			'description-color',
			'description-bg-color',
			'description-font-size',
			'description-style',
			'description-customize',
		]);
	});
});
