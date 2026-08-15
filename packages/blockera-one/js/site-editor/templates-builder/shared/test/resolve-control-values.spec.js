/**
 * resolve-control-values.ts: mapping every config control to its current
 * view state (value, visibility, needsConfirm) from internal fixture trees.
 */

import {
	getPostsPerPageMap,
	resolveControlViewStates,
} from '../resolve-control-values';
import { registerSectionHeuristics } from '../resolve-state';

const LAYOUT_ID = 'archive-body';

beforeAll(() => {
	registerSectionHeuristics({
		'posts-listing': { kind: 'blockName', name: 'core/query' },
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

const LAYOUT_VARIANTS = [
	{ id: 'no-sidebar', label: 'None' },
	{ id: 'sidebar-right', label: 'Right' },
	{ id: 'sidebar-left', label: 'Left' },
];

const LISTING_VARIANTS = [
	{ id: 'list', label: 'List' },
	{ id: 'grid-2', label: 'Grid 2' },
];

function makeConfig(extraControls = []) {
	return {
		type: 'archive',
		filters: ['archive'],
		layoutId: LAYOUT_ID,
		groups: [
			{
				id: 'layout',
				title: 'Layout',
				headerToggle: {
					id: 'sidebar',
					type: 'toggle',
					label: 'Sidebar',
					target: { kind: 'layout', id: LAYOUT_ID },
					operation: 'transplantLayout',
					variants: LAYOUT_VARIANTS,
				},
				controls: [
					{
						id: 'posts-template',
						type: 'layout-picker',
						label: 'Posts Template',
						target: { kind: 'section', id: 'posts-listing' },
						operation: 'swapSection',
						variants: LISTING_VARIANTS,
					},
					{
						id: 'posts-per-page',
						type: 'number',
						label: 'Posts',
						target: { kind: 'setting', id: 'posts_per_page' },
						operation: 'setTemplateSetting',
						defaultValue: 9,
					},
					...extraControls,
				],
				nestedPanel: {
					id: 'sidebar',
					title: 'Sidebar',
					groups: [
						{
							id: 'sidebar-layout',
							title: 'Position',
							controls: [
								{
									id: 'sidebar-position',
									type: 'layout-picker',
									label: 'Position',
									target: {
										kind: 'layout',
										id: LAYOUT_ID,
									},
									operation: 'transplantLayout',
									variants: LAYOUT_VARIANTS,
									conditions: [
										{ controlId: 'sidebar', equals: true },
									],
								},
							],
						},
					],
				},
			},
		],
	};
}

function makeSidebarTree() {
	return [
		stamped('core/group', `layout/${LAYOUT_ID}:sidebar-right`, {}, [
			block('core/columns', {}, [
				block('core/column', {}, [
					stamped('core/group', 'area/content', {}, [
						stamped('core/query', 'section/posts-listing:grid-2'),
					]),
				]),
				block('core/column', {}, [
					stamped('core/group', 'area/sidebar-area'),
				]),
			]),
		]),
	];
}

function makeNoSidebarTree() {
	return [
		stamped('core/group', `layout/${LAYOUT_ID}:no-sidebar`, {}, [
			stamped('core/group', 'area/content', {}, [
				stamped('core/query', 'section/posts-listing:list'),
			]),
		]),
	];
}

function resolve(
	blocks,
	config = makeConfig(),
	settings = {},
	bucket = 'archive'
) {
	return resolveControlViewStates(blocks, config, settings, bucket);
}

function byId(states, id) {
	return states.find((s) => s.control.id === id);
}

describe('resolveControlViewStates', () => {
	it('resolves setting controls from the bucket map with defaults', () => {
		const fromMap = byId(
			resolve(makeNoSidebarTree(), makeConfig(), {
				posts_per_page: { archive: 15 },
			}),
			'posts-per-page'
		);
		expect(fromMap.value).toBe(15);

		const fromDefault = byId(
			resolve(makeNoSidebarTree()),
			'posts-per-page'
		);
		expect(fromDefault.value).toBe(9);

		const noDefaultConfig = makeConfig();
		delete noDefaultConfig.groups[0].controls[1].defaultValue;
		expect(
			byId(
				resolve(makeNoSidebarTree(), noDefaultConfig),
				'posts-per-page'
			).value
		).toBe(10);
	});

	it('resolves layout toggle + picker values (including nested panels)', () => {
		const withSidebar = resolve(makeSidebarTree());
		expect(byId(withSidebar, 'sidebar').value).toBe(true);
		expect(byId(withSidebar, 'sidebar-position').value).toBe(
			'sidebar-right'
		);

		const noSidebar = resolve(makeNoSidebarTree());
		expect(byId(noSidebar, 'sidebar').value).toBe(false);
		expect(byId(noSidebar, 'sidebar-position').value).toBe('no-sidebar');
	});

	it('resolves section picker values from stamps', () => {
		expect(byId(resolve(makeSidebarTree()), 'posts-template').value).toBe(
			'grid-2'
		);
		expect(byId(resolve(makeNoSidebarTree()), 'posts-template').value).toBe(
			'list'
		);
	});

	it('resolves presence toggles with invertPresence support', () => {
		const config = makeConfig([
			{
				id: 'hide-title',
				type: 'toggle',
				label: 'Hide title',
				target: { kind: 'section', id: 'page-title' },
				operation: 'toggleSection',
				invertPresence: true,
			},
		]);
		const withTitle = [
			...makeNoSidebarTree(),
			stamped('core/group', 'section/page-title:simple'),
		];

		expect(byId(resolve(withTitle, config), 'hide-title').value).toBe(
			false
		);
		expect(
			byId(resolve(makeNoSidebarTree(), config), 'hide-title').value
		).toBe(true);
	});

	it('flags customized structures for confirmation', () => {
		// Unstamped query found by heuristic → customized.
		const customized = [
			stamped('core/group', `layout/${LAYOUT_ID}:no-sidebar`, {}, [
				stamped('core/group', 'area/content', {}, [
					block('core/query', { query: {} }),
				]),
			]),
		];
		const state = byId(resolve(customized), 'posts-template');
		expect(state.state.kind).toBe('customized');
		expect(state.needsConfirm).toBe(true);

		const clean = byId(resolve(makeNoSidebarTree()), 'posts-template');
		expect(clean.needsConfirm).toBe(false);
	});

	it('evaluates visibility conditions against resolved values', () => {
		const sidebarOn = resolve(makeSidebarTree());
		expect(byId(sidebarOn, 'sidebar-position').visible).toBe(true);

		const sidebarOff = resolve(makeNoSidebarTree());
		expect(byId(sidebarOff, 'sidebar-position').visible).toBe(false);
	});

	it('supports notEquals conditions', () => {
		const config = makeConfig([
			{
				id: 'grid-columns',
				type: 'number',
				label: 'Columns',
				target: { kind: 'section', id: 'posts-listing' },
				operation: 'setSectionAttribute',
				attributePath: 'query.columns',
				conditions: [
					{ controlId: 'posts-template', notEquals: 'list' },
				],
			},
		]);

		expect(
			byId(resolve(makeSidebarTree(), config), 'grid-columns').visible
		).toBe(true); // grid-2 !== list
		expect(
			byId(resolve(makeNoSidebarTree(), config), 'grid-columns').visible
		).toBe(false); // list
	});

	it('reads setSectionAttribute values from the nested attribute path', () => {
		const config = makeConfig([
			{
				id: 'page-header-gap',
				type: 'input',
				label: 'Items Spacing',
				target: { kind: 'section', id: 'page-title' },
				operation: 'setSectionAttribute',
				attributePath: 'blockeraGap.value',
			},
		]);
		const gapValue = {
			lock: true,
			gap: '20px',
			columns: '',
			rows: '',
		};
		const tree = [
			...makeNoSidebarTree(),
			stamped('core/group', 'section/page-title:simple', {
				blockeraGap: { value: gapValue },
			}),
		];

		expect(byId(resolve(tree, config), 'page-header-gap').value).toEqual(
			gapValue
		);
		expect(
			byId(resolve(makeNoSidebarTree(), config), 'page-header-gap').value
		).toBeNull();
	});

	it('uses Gutenberg defaults for omitted breadcrumbs attributes', () => {
		const config = makeConfig([
			{
				id: 'breadcrumbs-separator',
				type: 'input',
				label: 'Separator',
				target: { kind: 'section', id: 'page-title-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'separator',
				defaultValue: '/',
			},
			{
				id: 'breadcrumbs-show-home',
				type: 'toggle',
				label: 'Show home breadcrumb',
				target: { kind: 'section', id: 'page-title-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'showHomeItem',
				defaultValue: true,
			},
			{
				id: 'breadcrumbs-style',
				type: 'select',
				label: 'Style variation',
				target: { kind: 'section', id: 'page-title-breadcrumbs' },
				operation: 'setBlockStyle',
				defaultValue: 'default',
			},
		]);
		const tree = [
			stamped(
				'core/breadcrumbs',
				'section/page-title-breadcrumbs:default',
				{ className: 'blockera-block is-style-underline' }
			),
		];

		expect(byId(resolve(tree, config), 'breadcrumbs-separator').value).toBe(
			'/'
		);
		expect(byId(resolve(tree, config), 'breadcrumbs-show-home').value).toBe(
			true
		);
		expect(byId(resolve(tree, config), 'breadcrumbs-style').value).toBe(
			'underline'
		);
		expect(byId(resolve(tree, config), 'breadcrumbs-style').blockName).toBe(
			'core/breadcrumbs'
		);
	});

	it('keeps an empty breadcrumbs separator instead of falling back to /', () => {
		const config = makeConfig([
			{
				id: 'breadcrumbs-separator',
				type: 'input',
				label: 'Separator',
				target: { kind: 'section', id: 'page-title-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'separator',
				defaultValue: '/',
			},
		]);
		const tree = [
			stamped(
				'core/breadcrumbs',
				'section/page-title-breadcrumbs:default',
				{ separator: '' }
			),
		];

		expect(byId(resolve(tree, config), 'breadcrumbs-separator').value).toBe(
			''
		);
	});

	it('reads Blockera color and font-size values including empty inspector clears', () => {
		const config = makeConfig([
			{
				id: 'breadcrumbs-color',
				type: 'color',
				label: 'Text Color',
				target: { kind: 'section', id: 'page-title-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'blockeraFontColor.value',
			},
			{
				id: 'breadcrumbs-font-size',
				type: 'input',
				label: 'Font Size',
				target: { kind: 'section', id: 'page-title-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'blockeraFontSize.value',
			},
		]);
		const tree = [
			stamped(
				'core/breadcrumbs',
				'section/page-title-breadcrumbs:default',
				{
					blockeraFontColor: { value: '' },
					blockeraFontSize: { value: '18px' },
				}
			),
		];

		expect(byId(resolve(tree, config), 'breadcrumbs-color').value).toBe('');
		expect(byId(resolve(tree, config), 'breadcrumbs-font-size').value).toBe(
			'18px'
		);
		expect(
			byId(resolve(makeNoSidebarTree(), config), 'breadcrumbs-color')
				.value
		).toBeNull();
	});

	it('resolves placeSection as top when the section is the first inner block', () => {
		const position = {
			id: 'breadcrumbs-position',
			type: 'segmented-choice',
			label: 'Position',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'placeSection',
			defaultValue: 'bottom',
			innerOrder: { parentId: 'page-title' },
			variants: [
				{ id: 'top', label: 'Top' },
				{ id: 'bottom', label: 'Bottom' },
			],
		};
		const config = makeConfig([position]);
		const topTree = [
			stamped('core/group', 'section/page-title:default', {}, [
				stamped(
					'core/breadcrumbs',
					'section/page-title-breadcrumbs:default'
				),
				stamped('core/query-title', 'section/page-title-title:default'),
			]),
		];
		const bottomTree = [
			stamped('core/group', 'section/page-title:default', {}, [
				stamped('core/query-title', 'section/page-title-title:default'),
				stamped(
					'core/breadcrumbs',
					'section/page-title-breadcrumbs:default'
				),
			]),
		];

		expect(
			byId(resolve(topTree, config), 'breadcrumbs-position').value
		).toBe('top');
		expect(
			byId(resolve(bottomTree, config), 'breadcrumbs-position').value
		).toBe('bottom');
		expect(
			byId(resolve(makeNoSidebarTree(), config), 'breadcrumbs-position')
				.value
		).toBe('bottom');
	});

	it('resolves duplicate control ids exactly once (even with null values)', () => {
		// A heuristic-detected section with no variants resolves to null —
		// the dedupe must still hold (regression for the !== undefined guard).
		const nullValueControl = {
			id: 'dup-control',
			type: 'layout-picker',
			label: 'Dup',
			target: { kind: 'section', id: 'posts-listing' },
			operation: 'swapSection',
		};
		const config = makeConfig([
			nullValueControl,
			{ ...nullValueControl, label: 'Dup copy' },
		]);
		const customized = [
			stamped('core/group', 'area/content', {}, [
				block('core/query', { query: {} }),
			]),
		];

		const states = resolve(customized, config);
		const duplicates = states.filter((s) => s.control.id === 'dup-control');
		expect(duplicates).toHaveLength(1);
		expect(duplicates[0].value).toBeNull();
	});
});

describe('getPostsPerPageMap', () => {
	it('returns the map for plain objects and {} otherwise', () => {
		expect(getPostsPerPageMap({ posts_per_page: { archive: 5 } })).toEqual({
			archive: 5,
		});
		expect(getPostsPerPageMap({ posts_per_page: [5] })).toEqual({});
		expect(getPostsPerPageMap({})).toEqual({});
		expect(getPostsPerPageMap(null)).toEqual({});
		expect(getPostsPerPageMap(undefined)).toEqual({});
	});
});
