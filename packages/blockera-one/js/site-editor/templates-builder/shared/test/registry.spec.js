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
				id: 'sidebar-left',
				label: 'Left',
				kind: 'pattern',
				patternSlug: 'test/layout-left',
				areas: ['content', 'sidebar-area'],
			},
			{
				id: 'sidebar-right',
				label: 'Right',
				kind: 'pattern',
				patternSlug: 'test/layout-right',
				areas: ['content', 'sidebar-area'],
			},
		],
	},
};

window.blockeraOneTemplateBuilder = { catalog: INLINE_CATALOG };

// Import after the payload is in place (registry registers roles on load).
const {
	ARCHIVE_OPTIONS_CONFIG,
	GLOBAL_FOOTER_OPTIONS_CONFIG,
	GLOBAL_HEADER_OPTIONS_CONFIG,
	GLOBAL_SIDEBAR_OPTIONS_CONFIG,
	getOptionsConfigForFilter,
	getOptionsConfigForPartsArea,
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
			'sidebar-left',
			'sidebar-right',
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

describe('getOptionsConfigForPartsArea', () => {
	it.each([
		['header', 'global-header'],
		['footer', 'global-footer'],
		['sidebar', 'global-sidebar'],
	])('returns the hydrated %s config (type %s)', (area, type) => {
		const config = getOptionsConfigForPartsArea(area);
		expect(config).not.toBeNull();
		expect(config.type).toBe(type);
		expect(config.entityPostType).toBe('wp_template_part');
		expect(config.groups.map((g) => g.id)).toEqual(['design', 'settings']);
		expect(
			config.groups.every((g) => g.keepVisible && g.controls.length === 0)
		).toBe(true);
	});

	it('memoizes the hydrated config per area (same reference)', () => {
		const first = getOptionsConfigForPartsArea('sidebar');
		const second = getOptionsConfigForPartsArea('sidebar');
		expect(second).toBe(first);
		expect(first).not.toBe(GLOBAL_SIDEBAR_OPTIONS_CONFIG);
		expect(getOptionsConfigForPartsArea('header')).not.toBe(
			GLOBAL_HEADER_OPTIONS_CONFIG
		);
		expect(getOptionsConfigForPartsArea('footer')).not.toBe(
			GLOBAL_FOOTER_OPTIONS_CONFIG
		);
	});

	it('returns null for unknown or empty areas', () => {
		expect(getOptionsConfigForPartsArea('unknown')).toBeNull();
		expect(getOptionsConfigForPartsArea('')).toBeNull();
		expect(getOptionsConfigForPartsArea(null)).toBeNull();
		expect(getOptionsConfigForPartsArea(undefined)).toBeNull();
	});
});

describe('part config structural invariants', () => {
	it.each([
		['header', GLOBAL_HEADER_OPTIONS_CONFIG, 'site-header', 'Header'],
		['footer', GLOBAL_FOOTER_OPTIONS_CONFIG, 'site-footer', 'Footer'],
		['sidebar', GLOBAL_SIDEBAR_OPTIONS_CONFIG, 'site-sidebar', 'Sidebar'],
	])(
		'binds empty Design and Settings groups to the %s part',
		(area, config, layoutId, title) => {
			expect(config.layoutId).toBe(layoutId);
			expect(config.partsAreas).toEqual([area]);
			expect(config.filters).toEqual([]);
			expect(config.title).toBe(title);
		}
	);
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

	it('splits page header into Layout, Styles, and Blocks', () => {
		const pageHeader = config.groups.find((g) => g.id === 'page-header');
		expect(pageHeader.nestedPanel.gatewayLabel).toBe('Styles & Blocks');
		expect(pageHeader.nestedPanel.groups.map((g) => g.id)).toEqual([
			'page-header-layout',
			'page-header-styles',
			'page-header-blocks',
		]);
		expect(pageHeader.nestedPanel.groups.map((g) => g.title)).toEqual([
			'Layout',
			'Styles',
			'Blocks',
		]);

		const layout = pageHeader.nestedPanel.groups[0];
		const styles = pageHeader.nestedPanel.groups[1];

		expect(pageHeader.controls[0].id).toBe('page-header-design');
		expect(pageHeader.controls[0].label).toBeUndefined();
		expect(layout.controls.map((c) => c.id)).toEqual([
			'page-header-design',
		]);
		expect(layout.controls[0].label).toBeUndefined();
		expect(styles.controls.map((c) => c.id)).toEqual([
			'page-header-gap',
			'page-header-bottom-spacing',
			'page-header-align',
			'page-header-align-banner',
			'page-header-bg-color',
			'page-header-min-height',
			'page-header-padding',
			'page-header-body-width',
			'page-header-customize',
		]);

		const customize = styles.controls.find(
			(c) => c.id === 'page-header-customize'
		);
		expect(customize.type).toBe('button');
		expect(customize.operation).toBe('selectInCanvas');
		expect(customize.target).toEqual({
			kind: 'section',
			id: 'page-header',
		});

		const alignBanner = styles.controls.find(
			(c) => c.id === 'page-header-align-banner'
		);
		expect(alignBanner.target).toEqual({
			kind: 'container',
			id: 'body',
		});
		expect(alignBanner.alsoSetOn).toBeUndefined();
	});

	it('gives title and description a Styles nested panel without Settings', () => {
		const title = controls.find((c) => c.id === 'page-header-title');
		const description = controls.find(
			(c) => c.id === 'page-header-description'
		);

		expect(title.innerOrder.within).toBe('page-header');
		expect(title.innerOrder.parentId).toBe('body');
		expect(title.nestedPanel.groups.map((g) => g.id)).toEqual([
			'title-styles',
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
			'description-styles',
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

	it('puts Style Variation first in Styles groups that change block style variation', () => {
		const breadcrumbs = controls.find(
			(c) => c.id === 'page-header-breadcrumbs'
		);
		const styles = breadcrumbs.nestedPanel.groups.find(
			(g) => g.id === 'breadcrumbs-styles'
		);

		expect(styles.controls[0].id).toBe('breadcrumbs-style');
		expect(styles.controls[0].label).toBe('Style Variation');
		expect(styles.controls[0].operation).toBe('setBlockStyle');
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
			'pagination-layout',
			'pagination-styles',
			'pagination-blocks',
		]);
		expect(pagination.nestedPanel.groups.map((g) => g.title)).toEqual([
			'Layout',
			'Styles',
			'Blocks',
		]);
		expect(
			pagination.nestedPanel.groups[0].controls.map((c) => c.id)
		).toEqual(['pagination-design']);
		expect(
			pagination.nestedPanel.groups[1].controls.map((c) => c.id)
		).toEqual([
			'pagination-style',
			'pagination-top-divider',
			'pagination-top-spacing',
			'pagination-customize',
		]);
		const customize = pagination.nestedPanel.groups[1].controls.find(
			(c) => c.id === 'pagination-customize'
		);
		expect(customize.type).toBe('button');
		expect(customize.operation).toBe('selectInCanvas');
		expect(customize.target).toEqual({
			kind: 'section',
			id: 'pagination',
		});
		const blocks = pagination.nestedPanel.groups[2].controls;
		expect(blocks.map((c) => c.id)).toEqual([
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		]);
		expect(blocks[0].requireAtLeastOneOf).toEqual([
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		]);
		expect(blocks[0].alsoToggle).toBeUndefined();
		expect(
			blocks.map((c) => c.nestedPanel.groups.map((g) => g.id))
		).toEqual([
			['pagination-prev-styles', 'pagination-prev-settings'],
			['pagination-num-styles', 'pagination-num-settings'],
			['pagination-next-styles', 'pagination-next-settings'],
		]);
		for (const block of blocks) {
			const styles = block.nestedPanel.groups[0];
			expect(
				styles.controls.some((c) => c.operation === 'selectInCanvas')
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

	it('makes the Posts Loop card a navigable group without a header toggle', () => {
		const pageLayout = config.groups.find((g) => g.id === 'page-layout');
		expect(pageLayout.headerToggle).toBeUndefined();
		expect(pageLayout.controls.map((c) => c.id)).toEqual([
			'posts-template',
			'posts-per-page',
		]);
		expect(pageLayout.nestedPanel.id).toBe('posts-loop');
		expect(pageLayout.nestedPanel.title).toBe('Posts Loop');
		expect(pageLayout.nestedPanel.gatewayLabel).toBe('Styles & Blocks');
		expect(pageLayout.nestedPanel.scrollTarget).toBe('posts-listing');
		expect(pageLayout.nestedPanel.groups.map((g) => g.id)).toEqual([
			'posts-loop-layout',
			'posts-loop-styles',
			'posts-loop-blocks',
		]);
		expect(pageLayout.nestedPanel.groups.map((g) => g.title)).toEqual([
			'Layout',
			'Styles',
			'Blocks',
		]);
		expect(
			pageLayout.nestedPanel.groups[0].controls.map((c) => c.id)
		).toEqual(['posts-template']);
		expect(
			pageLayout.nestedPanel.groups[1].controls.map((c) => c.id)
		).toEqual(['posts-per-page', 'posts-loop-customize']);
		const customize = pageLayout.nestedPanel.groups[1].controls[1];
		expect(customize.type).toBe('button');
		expect(customize.operation).toBe('selectInCanvas');
		expect(customize.target).toEqual({
			kind: 'section',
			id: 'posts-listing',
		});
		const elements = pageLayout.nestedPanel.groups[2].controls;
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
		expect(elements[0].innerOrder.within).toBe('posts-listing');
		expect(elements[0].innerOrder.bucketParents).toEqual(['media', 'body']);
		expect(elements[0].innerOrder.showParentNames).toBe(true);
		expect(elements[5].label).toBe('Post Meta');
		expect(elements[6].label).toBe('Post Meta');
	});

	it('gives every Posts Loop element Styles a customize-in-editor action', () => {
		const pageLayout = config.groups.find((g) => g.id === 'page-layout');
		const elements = pageLayout.nestedPanel.groups.find(
			(g) => g.id === 'posts-loop-blocks'
		).controls;

		for (const element of elements) {
			const styles = element.nestedPanel.groups[0];
			expect(styles.id).toBe(`${element.id}-styles`);
			expect(styles.title).toBe('Styles');
			const customize = styles.controls.find(
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
				const styles = child.nestedPanel.groups[0];
				expect(styles.id).toBe(`${child.id}-styles`);
				expect(styles.title).toBe('Styles');
				const customize = styles.controls.find(
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

	it('completes Featured Image Styles and Settings', () => {
		const pageLayout = config.groups.find((g) => g.id === 'page-layout');
		const featured = pageLayout.nestedPanel.groups
			.find((g) => g.id === 'posts-loop-blocks')
			.controls.find((c) => c.id === 'post-featured-image');
		expect(featured.nestedPanel.groups.map((g) => g.id)).toEqual([
			'post-featured-image-styles',
			'post-featured-image-settings',
		]);
		expect(featured.nestedPanel.groups.map((g) => g.title)).toEqual([
			'Styles',
			'Settings',
		]);
		const styles = featured.nestedPanel.groups[0];
		expect(styles.controls.map((c) => c.id)).toEqual([
			'post-featured-image-style',
			'post-featured-image-aspect-ratio',
			'post-featured-image-border-radius',
			'post-featured-image-bottom-spacing',
			'post-featured-image-customize',
		]);
		expect(styles.controls[0].label).toBe('Style Variation');
		expect(styles.controls[0].operation).toBe('setBlockStyle');
		expect(styles.controls[0].defaultValue).toBe('default');
		expect(styles.controls[1].attributePath).toBe('blockeraRatio.value');
		expect(styles.controls[2].attributePath).toBe(
			'blockeraBorderRadius.value'
		);
		expect(styles.controls[3].attributePath).toBe('blockeraSpacing.value');
		expect(styles.controls[3].attributeMergeKeys).toEqual([
			'margin.bottom',
		]);
		expect(styles.controls[4].operation).toBe('selectInCanvas');
		const settings = featured.nestedPanel.groups[1];
		expect(settings.controls.map((c) => c.id)).toEqual([
			'post-featured-image-resolution',
			'post-featured-image-is-link',
			'post-featured-image-open-in-new-tab',
		]);
		expect(settings.controls[0].attributePath).toBe('sizeSlug');
		expect(settings.controls[1].attributePath).toBe('isLink');
		expect(settings.controls[2].attributePath).toBe('linkTarget');
		expect(settings.controls[2].onValue).toBe('_blank');
		expect(settings.controls[2].offValue).toBe('_self');
		expect(settings.controls[2].conditions).toEqual([
			{ controlId: 'post-featured-image-is-link', equals: true },
		]);
	});

	it('keeps two Post Meta rows on independent stamps and child lists', () => {
		const meta1 = controls.find((c) => c.id === 'post-meta');
		const meta2 = controls.find((c) => c.id === 'post-meta-2');
		expect(meta1.target.id).toBe('post-meta');
		expect(meta2.target.id).toBe('post-meta-2');
		expect(meta1.nestedPanel.groups.map((g) => g.id)).toEqual([
			'post-meta-styles',
			'post-meta-blocks',
		]);
		expect(meta2.nestedPanel.groups.map((g) => g.id)).toEqual([
			'post-meta-2-styles',
			'post-meta-2-blocks',
		]);
		expect(meta1.nestedPanel.groups[1].title).toBe('Blocks');
		expect(meta2.nestedPanel.groups[1].title).toBe('Blocks');
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

	it('splits Site Header and Site Footer into Layout plus a visible Styles shell', () => {
		const header = config.groups.find((g) => g.id === 'site-header');
		expect(header.nestedPanel.groups.map((g) => g.id)).toEqual([
			'header-layout',
			'header-styles',
		]);
		expect(header.nestedPanel.groups.map((g) => g.title)).toEqual([
			'Layout',
			'Styles',
		]);
		expect(header.nestedPanel.groups[0].controls.map((c) => c.id)).toEqual([
			'header-design',
		]);
		const headerStyles = header.nestedPanel.groups[1];
		expect(headerStyles.keepVisible).toBe(true);
		expect(headerStyles.controls.map((c) => c.id)).toEqual([
			'header-customize',
		]);
		expect(headerStyles.controls[0].operation).toBe('selectInCanvas');
		expect(headerStyles.controls[0].target).toEqual({
			kind: 'section',
			id: 'header',
		});

		const footer = config.groups.find((g) => g.id === 'site-footer');
		expect(footer.nestedPanel.groups.map((g) => g.id)).toEqual([
			'footer-layout',
			'footer-styles',
		]);
		expect(footer.nestedPanel.groups.map((g) => g.title)).toEqual([
			'Layout',
			'Styles',
		]);
		expect(footer.nestedPanel.groups[0].controls.map((c) => c.id)).toEqual([
			'footer-design',
		]);
		const footerStyles = footer.nestedPanel.groups[1];
		expect(footerStyles.keepVisible).toBe(true);
		expect(footerStyles.controls.map((c) => c.id)).toEqual([
			'footer-customize',
		]);
		expect(footerStyles.controls[0].operation).toBe('selectInCanvas');
		expect(footerStyles.controls[0].target).toEqual({
			kind: 'section',
			id: 'footer',
		});
	});

	it('names the Sidebar nested group Layout', () => {
		const sidebar = config.groups.find((g) => g.id === 'sidebar');
		expect(sidebar.nestedPanel.groups.map((g) => g.id)).toEqual([
			'sidebar-layout',
		]);
		expect(sidebar.nestedPanel.groups[0].title).toBe('Layout');
		expect(sidebar.nestedPanel.groups[0].controls.map((c) => c.id)).toEqual(
			['sidebar-position']
		);
	});
});
