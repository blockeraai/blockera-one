/**
 * resolve-state.ts: stamp-first detection with heuristic fallbacks, area and
 * container maps, sidebar inference, and chrome-rail lookups. Fixtures are
 * internal BlockNode trees — independent of real theme templates.
 */

import {
	findChromeRail,
	findLayoutPath,
	isVerticalRailChrome,
	registerSectionHeuristics,
	resolveLayoutState,
	resolveSectionState,
	resolveSidebarLayoutValue,
	resolveToggleState,
} from '../resolve-state';

const LAYOUT_ID = 'archive-body';

beforeAll(() => {
	registerSectionHeuristics({
		'posts-listing': { kind: 'blockName', name: 'core/query' },
		'page-header': { kind: 'groupWrapping', childName: 'core/query-title' },
		header: { kind: 'templatePart', area: 'header' },
		footer: { kind: 'templatePart', slugPrefix: 'footer' },
		sidebar: { kind: 'templatePart', slugIncludes: 'sidebar' },
	});
});

function block(name, attributes = {}, innerBlocks = []) {
	return { name, attributes, innerBlocks };
}

function stamped(name, stampValue, attributes = {}, innerBlocks = []) {
	return block(
		name,
		{ ...attributes, metadata: { blockeraOne: stampValue } },
		innerBlocks
	);
}

const KNOWN_LAYOUTS = [
	{ id: 'no-sidebar', label: 'No sidebar' },
	{ id: 'sidebar-right', label: 'Sidebar right' },
];

/** header part + stamped no-sidebar layout (content area with one block). */
function makeStampedTree(variant = 'no-sidebar') {
	return [
		block('core/template-part', { slug: 'site-header', area: 'header' }),
		stamped(
			'core/group',
			`layout/${LAYOUT_ID}:${variant}`,
			{ tagName: 'main', className: 'user-main' },
			[
				stamped('core/group', 'area/content', {}, [
					block('core/paragraph', { content: 'hello' }),
				]),
			]
		),
	];
}

describe('resolveLayoutState', () => {
	it('resolves a stamped layout with area and container maps (absolute paths)', () => {
		const state = resolveLayoutState(
			makeStampedTree(),
			LAYOUT_ID,
			KNOWN_LAYOUTS
		);

		expect(state.kind).toBe('value');
		expect(state.value).toBe('no-sidebar');
		expect(state.path).toEqual([1]);
		// Area map path is absolute (layout sits at index 1).
		expect(state.areaMap.content.path).toEqual([1, 0]);
		expect(state.areaMap.content.innerBlocks[0].name).toBe(
			'core/paragraph'
		);
		// Layout root doubles as the "main" container for carry-over.
		expect(state.containerMap.main.path).toEqual([1]);
		expect(state.containerMap.main.attributes.className).toBe('user-main');
	});

	it('collects container-stamped descendants into the container map', () => {
		const tree = [
			stamped('core/group', `layout/${LAYOUT_ID}:sidebar-right`, {}, [
				stamped(
					'core/columns',
					'container/layout-columns',
					{ align: 'wide' },
					[
						stamped('core/column', 'container/content-column', {}, [
							stamped('core/group', 'area/content'),
						]),
						stamped('core/column', 'container/sidebar-column', {}, [
							stamped('core/group', 'area/sidebar-area'),
						]),
					]
				),
			]),
		];
		const state = resolveLayoutState(tree, LAYOUT_ID, KNOWN_LAYOUTS);

		expect(state.containerMap['layout-columns']).toEqual({
			path: [0, 0],
			attributes: expect.objectContaining({ align: 'wide' }),
		});
		expect(state.containerMap['content-column'].path).toEqual([0, 0, 0]);
		expect(state.areaMap['sidebar-area'].path).toEqual([0, 0, 1, 0]);
	});

	it('marks unknown stamped variants as customized', () => {
		const state = resolveLayoutState(
			makeStampedTree('hand-rolled'),
			LAYOUT_ID,
			KNOWN_LAYOUTS
		);
		expect(state.kind).toBe('customized');
		expect(state.value).toBe('hand-rolled');
	});

	it('treats an unstamped main with a content area as customized', () => {
		const tree = [
			block('core/template-part', { slug: 'site-header' }),
			block('core/group', { tagName: 'main' }, [
				stamped('core/group', 'area/content', {}, [
					block('core/paragraph'),
				]),
			]),
		];
		const state = resolveLayoutState(tree, LAYOUT_ID, KNOWN_LAYOUTS);

		expect(state.kind).toBe('customized');
		expect(state.value).toBeNull();
		expect(state.path).toEqual([1]);
		expect(state.areaMap.content.path).toEqual([1, 0]);
	});

	it('falls back to unrecognized with the whole main as content', () => {
		const paragraph = block('core/paragraph', { content: 'raw' });
		const tree = [block('core/group', { className: 'raw' }, [paragraph])];
		const state = resolveLayoutState(tree, LAYOUT_ID, KNOWN_LAYOUTS);

		expect(state.kind).toBe('unrecognized');
		expect(state.path).toEqual([0]);
		expect(state.areaMap.content.innerBlocks).toEqual([paragraph]);
		expect(state.containerMap.main.attributes.className).toBe('raw');
	});

	it('returns unrecognized without a path when nothing matches', () => {
		const state = resolveLayoutState([block('core/paragraph')], LAYOUT_ID);
		expect(state).toEqual({ kind: 'unrecognized', value: null });
	});
});

describe('resolveSectionState', () => {
	const KNOWN_LISTINGS = [
		{ id: 'list', label: 'List' },
		{ id: 'grid-2', label: 'Grid 2' },
	];

	it('resolves a stamped section variant', () => {
		const tree = [stamped('core/query', 'section/posts-listing:list')];
		expect(
			resolveSectionState(tree, 'posts-listing', KNOWN_LISTINGS)
		).toEqual({ kind: 'value', value: 'list', path: [0] });
	});

	it('marks unknown stamped variants as customized', () => {
		const tree = [stamped('core/query', 'section/posts-listing:bespoke')];
		const state = resolveSectionState(
			tree,
			'posts-listing',
			KNOWN_LISTINGS
		);
		expect(state.kind).toBe('customized');
		expect(state.value).toBe('bespoke');
	});

	it('uses the template-part slug as the design id for chrome sections', () => {
		const tree = [
			stamped('core/template-part', 'section/header:old-variant', {
				slug: 'header-large-title',
			}),
		];
		const state = resolveSectionState(tree, 'header', [
			{ id: 'header-large-title', label: 'Large title' },
		]);
		expect(state).toEqual({
			kind: 'value',
			value: 'header-large-title',
			path: [0],
		});
	});

	it('falls back to "default" when a stamp has no variant', () => {
		const tree = [stamped('core/group', 'section/page-header')];
		const state = resolveSectionState(tree, 'page-header');
		expect(state.kind).toBe('value');
		expect(state.value).toBe('default');
	});

	it('aliases a leftover default stamp to simple when the catalog dropped default', () => {
		const tree = [stamped('core/group', 'section/page-header:default')];
		const state = resolveSectionState(tree, 'page-header', [
			{ id: 'simple', label: 'Simple' },
			{ id: 'banner', label: 'Banner' },
		]);
		expect(state).toEqual({ kind: 'value', value: 'simple', path: [0] });
	});

	it('marks a leftover next-prev pagination stamp as customized', () => {
		const tree = [
			stamped('core/query-pagination', 'section/pagination:next-prev'),
		];
		const state = resolveSectionState(tree, 'pagination', [
			{ id: 'standard', label: 'Standard' },
			{ id: 'load-more', label: 'Load more' },
		]);
		expect(state).toEqual({
			kind: 'customized',
			value: 'next-prev',
			path: [0],
		});
	});

	it('detects unstamped sections via the blockName heuristic as customized', () => {
		const tree = [
			block('core/group', { tagName: 'main' }, [
				block('core/query', { query: {} }),
			]),
		];
		const state = resolveSectionState(tree, 'posts-listing');
		expect(state.kind).toBe('customized');
		expect(state.path).toEqual([0, 0]);
	});

	it('groupWrapping matches the group directly wrapping the child, never the bare child', () => {
		const tree = [
			block('core/group', { tagName: 'main' }, [
				block('core/group', { className: 'title-band' }, [
					block('core/query-title'),
				]),
			]),
		];
		const state = resolveSectionState(tree, 'page-header');
		expect(state.kind).toBe('customized');
		expect(state.path).toEqual([0, 0]);

		// Regression guard: a query-title nested deeper (e.g. inside the
		// listing markup, not directly under a group) must not match.
		const bare = [
			block('core/group', { tagName: 'main' }, [
				block('core/query', {}, [
					block('core/cover', {}, [block('core/query-title')]),
				]),
			]),
		];
		expect(resolveSectionState(bare, 'page-header').kind).toBe('missing');
	});

	it('groupWrapping skips a container/elements stack and binds the outer group', () => {
		const tree = [
			block('core/group', { tagName: 'main' }, [
				block('core/group', { className: 'title-band' }, [
					stamped('core/group', 'container/elements', {}, [
						block('core/query-title'),
					]),
				]),
			]),
		];
		const state = resolveSectionState(tree, 'page-header');
		expect(state.kind).toBe('customized');
		expect(state.path).toEqual([0, 0]);
	});

	it('templatePart heuristic matches by area, slug prefix and slug substring', () => {
		const byArea = [
			block('core/template-part', { slug: 'x', area: 'header' }),
		];
		expect(resolveSectionState(byArea, 'header').kind).toBe('customized');

		const byPrefix = [
			block('core/template-part', { slug: 'footer-columns' }),
		];
		expect(resolveSectionState(byPrefix, 'footer').kind).toBe('customized');

		const byIncludes = [
			block('core/template-part', { slug: 'my-sidebar-part' }),
		];
		expect(resolveSectionState(byIncludes, 'sidebar').kind).toBe(
			'customized'
		);

		// Non template-part blocks never match.
		expect(resolveSectionState([block('core/group')], 'header').kind).toBe(
			'missing'
		);
	});

	it('returns missing when nothing matches (no heuristic registered)', () => {
		expect(
			resolveSectionState([block('core/group')], 'never-registered')
		).toEqual({ kind: 'missing', value: false });
	});

	it('innerBlock matches a named child of the parent section only', () => {
		registerSectionHeuristics({
			'page-header-title': {
				kind: 'innerBlock',
				parentId: 'page-header',
				name: 'core/query-title',
			},
			'page-header-breadcrumbs': {
				kind: 'innerBlock',
				parentId: 'page-header',
				name: 'core/breadcrumbs',
			},
		});

		const tree = [
			stamped('core/group', 'section/page-header:default', {}, [
				block('core/query-title'),
				block('core/term-description'),
			]),
			block('core/query-title'),
		];

		const title = resolveSectionState(tree, 'page-header-title');
		expect(title.kind).toBe('customized');
		expect(title.path).toEqual([0, 0]);

		expect(resolveSectionState(tree, 'page-header-breadcrumbs').kind).toBe(
			'missing'
		);
	});

	it('descendantBlock matches the first nested block under the parent', () => {
		registerSectionHeuristics({
			'posts-listing': { kind: 'blockName', name: 'core/query' },
			'post-featured-image': {
				kind: 'descendantBlock',
				parentId: 'posts-listing',
				name: 'core/post-featured-image',
			},
			'post-title': {
				kind: 'descendantBlock',
				parentId: 'posts-listing',
				name: 'core/post-title',
			},
		});

		const tree = [
			stamped('core/query', 'section/posts-listing:list', {}, [
				block('core/post-template', {}, [
					block('core/group', {}, [
						block('core/post-featured-image'),
						block('core/post-title'),
					]),
				]),
			]),
			block('core/post-featured-image'),
		];

		const image = resolveSectionState(tree, 'post-featured-image');
		expect(image.kind).toBe('customized');
		expect(image.path).toEqual([0, 0, 0, 0]);

		const title = resolveSectionState(tree, 'post-title');
		expect(title.kind).toBe('customized');
		expect(title.path).toEqual([0, 0, 0, 1]);
	});
});

describe('resolveToggleState', () => {
	it('maps presence to a boolean value with the section path', () => {
		const tree = [stamped('core/query', 'section/posts-listing:list')];
		expect(resolveToggleState(tree, 'posts-listing')).toEqual({
			kind: 'value',
			value: true,
			path: [0],
		});
		expect(resolveToggleState([], 'posts-listing')).toEqual({
			kind: 'value',
			value: false,
		});
	});
});

describe('resolveSidebarLayoutValue', () => {
	it('returns the stamped variant string when present', () => {
		expect(
			resolveSidebarLayoutValue({ kind: 'value', value: 'sidebar-left' })
		).toBe('sidebar-left');
	});

	it('infers position from the column order when the variant is unknown', () => {
		// Stamp without :variant → value null → column-order inference.
		const sidebarFirst = [
			stamped('core/group', `layout/${LAYOUT_ID}`, {}, [
				block('core/columns', {}, [
					block('core/column', {}, [
						stamped('core/group', 'area/sidebar-area'),
					]),
					block('core/column', {}, [
						stamped('core/group', 'area/content'),
					]),
				]),
			]),
		];
		expect(
			resolveSidebarLayoutValue(
				resolveLayoutState(sidebarFirst, LAYOUT_ID)
			)
		).toBe('sidebar-left');

		const contentFirst = [
			stamped('core/group', `layout/${LAYOUT_ID}`, {}, [
				block('core/columns', {}, [
					block('core/column', {}, [
						stamped('core/group', 'area/content'),
					]),
					block('core/column', {}, [
						stamped('core/group', 'area/sidebar-area'),
					]),
				]),
			]),
		];
		expect(
			resolveSidebarLayoutValue(
				resolveLayoutState(contentFirst, LAYOUT_ID)
			)
		).toBe('sidebar-right');
	});

	it('reports no-sidebar when the area is absent', () => {
		const state = resolveLayoutState(makeStampedTree(), LAYOUT_ID);
		expect(resolveSidebarLayoutValue(state)).toBe('no-sidebar');
	});
});

describe('layout / chrome lookups', () => {
	it('findLayoutPath returns the stamped path or null', () => {
		expect(findLayoutPath(makeStampedTree(), LAYOUT_ID)).toEqual([1]);
		expect(findLayoutPath([block('core/group')], LAYOUT_ID)).toBeNull();
	});

	it('findChromeRail / isVerticalRailChrome detect the rail stamp', () => {
		const rail = [
			stamped('core/columns', 'container/chrome-rail:vertical-rail', {}, [
				block('core/column'),
			]),
		];
		expect(findChromeRail(rail).path).toEqual([0]);
		expect(isVerticalRailChrome(rail)).toBe(true);
		expect(isVerticalRailChrome(makeStampedTree())).toBe(false);
	});
});
