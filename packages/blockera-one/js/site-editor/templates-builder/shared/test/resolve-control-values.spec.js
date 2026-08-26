/**
 * resolve-control-values.ts: mapping every config control to its current
 * view state (value, visibility, needsConfirm) from internal fixture trees.
 */

import {
	getPostsPerPageMap,
	resolveControlViewStates,
} from '../resolve/resolve-control-values';
import { registerSectionHeuristics } from '../resolve/resolve-state';
import { block, stamped } from './helpers/block-fixtures';

const LAYOUT_ID = 'main';

beforeAll(() => {
	registerSectionHeuristics({
		'posts-listing': { kind: 'blockName', name: 'core/query' },
	});
});

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

	it('resolves broadcastSetting from the stored settings path', () => {
		const config = makeConfig([
			{
				id: 'sidebar-width',
				type: 'number',
				target: { kind: 'setting', id: 'sidebar-width' },
				operation: 'broadcastSetting',
				broadcastId: 'sidebar-width',
				settingPath: 'sidebar_width',
				defaultValue: 33.33,
			},
		]);
		expect(
			byId(resolve(makeNoSidebarTree(), config), 'sidebar-width').value
		).toBe(33.33);
		expect(
			byId(
				resolve(makeNoSidebarTree(), config, {
					sidebar_width: '30',
				}),
				'sidebar-width'
			).value
		).toBe(30);
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
				target: { kind: 'section', id: 'page-header' },
				operation: 'toggleSection',
				invertPresence: true,
			},
		]);
		const withTitle = [
			...makeNoSidebarTree(),
			stamped('core/group', 'section/page-header:simple'),
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

	it('does not confirm attribute edits on a customized section', () => {
		registerSectionHeuristics({
			'pagination-previous': {
				kind: 'innerBlock',
				parentId: 'pagination',
				name: 'core/query-pagination-previous',
			},
			pagination: { kind: 'blockName', name: 'core/query-pagination' },
		});
		const config = makeConfig([
			{
				id: 'pagination-previous-label',
				type: 'input',
				label: 'Label',
				target: { kind: 'section', id: 'pagination-previous' },
				operation: 'setSectionAttribute',
				attributePath: 'label',
				defaultValue: 'Previous Page',
			},
		]);
		const tree = [
			stamped('core/group', `layout/${LAYOUT_ID}:no-sidebar`, {}, [
				stamped('core/group', 'area/content', {}, [
					block('core/query-pagination', {}, [
						block('core/query-pagination-previous', {
							label: 'Previous Page',
						}),
					]),
				]),
			]),
		];
		const label = byId(resolve(tree, config), 'pagination-previous-label');
		expect(label.state.kind).toBe('customized');
		expect(label.needsConfirm).toBe(false);
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
				target: { kind: 'section', id: 'page-header' },
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
			stamped('core/group', 'section/page-header:simple', {
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
				target: { kind: 'section', id: 'page-header-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'separator',
				defaultValue: '/',
			},
			{
				id: 'breadcrumbs-show-home',
				type: 'toggle',
				label: 'Show home breadcrumb',
				target: { kind: 'section', id: 'page-header-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'showHomeItem',
				defaultValue: true,
			},
			{
				id: 'breadcrumbs-style',
				type: 'select',
				label: 'Style variation',
				target: { kind: 'section', id: 'page-header-breadcrumbs' },
				operation: 'setBlockStyle',
				defaultValue: 'default',
			},
		]);
		const tree = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default',
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
				target: { kind: 'section', id: 'page-header-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'separator',
				defaultValue: '/',
			},
		]);
		const tree = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default',
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
				target: { kind: 'section', id: 'page-header-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'blockeraFontColor.value',
			},
			{
				id: 'breadcrumbs-font-size',
				type: 'input',
				label: 'Font Size',
				target: { kind: 'section', id: 'page-header-breadcrumbs' },
				operation: 'setSectionAttribute',
				attributePath: 'blockeraFontSize.value',
			},
		]);
		const tree = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default',
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
			type: 'select',
			label: 'Position',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'placeSection',
			defaultValue: 'bottom',
			innerOrder: { parentId: 'page-header' },
			variants: [
				{ id: 'top', label: 'Top' },
				{ id: 'bottom', label: 'Bottom' },
			],
		};
		const config = makeConfig([position]);
		const topTree = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/breadcrumbs',
					'section/page-header-breadcrumbs:default'
				),
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
			]),
		];
		const bottomTree = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
				stamped(
					'core/breadcrumbs',
					'section/page-header-breadcrumbs:default'
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

	it('shows page-header design options by the active page-header variant', () => {
		const pageHeaderOn = { controlId: 'page-header', equals: true };
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					headerToggle: {
						id: 'page-header',
						type: 'toggle',
						label: 'Page Header',
						target: { kind: 'section', id: 'page-header' },
						operation: 'toggleSection',
						onValue: true,
						offValue: false,
					},
					controls: [
						{
							id: 'page-header-design',
							type: 'layout-picker',
							label: 'Header Design',
							target: { kind: 'section', id: 'page-header' },
							operation: 'swapSection',
							variants: [
								{ id: 'simple', label: 'Simple' },
								{ id: 'banner', label: 'Banner' },
							],
						},
						{
							id: 'page-header-gap',
							type: 'input',
							label: 'Elements Gap',
							target: { kind: 'section', id: 'page-header' },
							operation: 'setSectionAttribute',
							attributePath: 'blockeraGap.value',
							conditions: [pageHeaderOn],
						},
						{
							id: 'page-header-bottom-spacing',
							type: 'input',
							label: 'Container Bottom Spacing',
							target: { kind: 'section', id: 'page-header' },
							operation: 'setSectionAttribute',
							attributePath: 'blockeraSpacing.value',
							conditions: [
								pageHeaderOn,
								{
									controlId: 'page-header-design',
									equals: 'simple',
								},
							],
						},
						{
							id: 'page-header-align',
							type: 'layout-matrix',
							label: 'Items alignment',
							target: { kind: 'section', id: 'page-header' },
							alsoSetOn: ['body'],
							operation: 'setSectionAttribute',
							attributePath: 'blockeraFlexLayout.value',
							conditions: [
								pageHeaderOn,
								{
									controlId: 'page-header-design',
									equals: 'simple',
								},
							],
						},
						{
							id: 'page-header-align-banner',
							type: 'layout-matrix',
							label: 'Items alignment',
							target: { kind: 'container', id: 'body' },
							operation: 'setSectionAttribute',
							attributePath: 'blockeraFlexLayout.value',
							conditions: [
								pageHeaderOn,
								{
									controlId: 'page-header-design',
									equals: 'banner',
								},
							],
						},
						{
							id: 'page-header-bg-color',
							type: 'color',
							label: 'BG Color',
							target: { kind: 'section', id: 'page-header' },
							operation: 'setSectionAttribute',
							attributePath: 'blockeraBackgroundColor.value',
							conditions: [
								pageHeaderOn,
								{
									controlId: 'page-header-design',
									equals: 'banner',
								},
							],
						},
						{
							id: 'page-header-body-width',
							type: 'input',
							label: 'Elements Container Width',
							target: { kind: 'container', id: 'body' },
							operation: 'setSectionAttribute',
							attributePath: 'blockeraMaxWidth.value',
							conditions: [
								pageHeaderOn,
								{
									controlId: 'page-header-design',
									equals: 'banner',
								},
							],
						},
					],
				},
			],
		};
		const spacing = {
			padding: {
				top: '60px',
				right: '50px',
				bottom: '60px',
				left: '50px',
			},
			margin: { top: '', right: '', bottom: '40px', left: '' },
		};
		const flex = {
			direction: 'column',
			alignItems: 'stretch',
			justifyContent: 'center',
		};
		const simpleTree = [
			stamped(
				'core/group',
				'section/page-header:simple',
				{
					blockeraSpacing: { value: spacing },
					blockeraFlexLayout: { value: flex },
				},
				[stamped('core/group', 'container/body', {})]
			),
		];
		const bannerFlex = {
			direction: 'column',
			alignItems: 'center',
			justifyContent: 'center',
		};
		const bannerTree = [
			stamped(
				'core/group',
				'section/page-header:banner',
				{
					blockeraBackgroundColor: { value: '#111111' },
					blockeraFlexLayout: {
						value: {
							direction: 'column',
							alignItems: 'stretch',
							justifyContent: 'center',
						},
					},
				},
				[
					stamped('core/group', 'container/body', {
						blockeraMaxWidth: { value: '645px' },
						blockeraFlexLayout: { value: bannerFlex },
					}),
				]
			),
		];

		const simple = resolve(simpleTree, config);
		expect(byId(simple, 'page-header-gap').visible).toBe(true);
		expect(byId(simple, 'page-header-bottom-spacing').visible).toBe(true);
		expect(byId(simple, 'page-header-align').visible).toBe(true);
		expect(byId(simple, 'page-header-align-banner').visible).toBe(false);
		expect(byId(simple, 'page-header-bg-color').visible).toBe(false);
		expect(byId(simple, 'page-header-body-width').visible).toBe(false);
		expect(byId(simple, 'page-header-bottom-spacing').value).toEqual(
			spacing
		);
		expect(byId(simple, 'page-header-align').value).toEqual(flex);

		const banner = resolve(bannerTree, config);
		expect(byId(banner, 'page-header-gap').visible).toBe(true);
		expect(byId(banner, 'page-header-bottom-spacing').visible).toBe(false);
		expect(byId(banner, 'page-header-align').visible).toBe(false);
		expect(byId(banner, 'page-header-align-banner').visible).toBe(true);
		expect(byId(banner, 'page-header-bg-color').visible).toBe(true);
		expect(byId(banner, 'page-header-body-width').visible).toBe(true);
		expect(byId(banner, 'page-header-bg-color').value).toBe('#111111');
		expect(byId(banner, 'page-header-body-width').value).toBe('645px');
		expect(byId(banner, 'page-header-align-banner').value).toEqual(
			bannerFlex
		);
	});
});

describe('requireAtLeastOneOf and alsoToggle', () => {
	const required = [
		'pagination-previous',
		'pagination-numbers',
		'pagination-next',
	];
	const previous = {
		id: 'pagination-previous',
		type: 'toggle',
		label: 'Previous Page',
		target: { kind: 'section', id: 'pagination-previous' },
		operation: 'toggleSection',
		requireAtLeastOneOf: required,
	};
	const numbers = {
		id: 'pagination-numbers',
		type: 'toggle',
		label: 'Numbers',
		target: { kind: 'section', id: 'pagination-numbers' },
		operation: 'toggleSection',
		requireAtLeastOneOf: required,
	};
	const next = {
		id: 'pagination-next',
		type: 'toggle',
		label: 'Next Page',
		target: { kind: 'section', id: 'pagination-next' },
		operation: 'toggleSection',
		requireAtLeastOneOf: required,
	};

	function resolveElements(children) {
		return resolve(
			[
				stamped(
					'core/query-pagination',
					'section/pagination:standard',
					{},
					children
				),
			],
			makeConfig([previous, numbers, next])
		);
	}

	it('treats previous and next as independent toggles', () => {
		const states = resolveElements([
			stamped(
				'core/query-pagination-next',
				'section/pagination-next:default'
			),
		]);
		expect(byId(states, 'pagination-previous').value).toBe(false);
		expect(byId(states, 'pagination-next').value).toBe(true);
	});

	it('disables the last remaining required toggle', () => {
		const both = resolveElements([
			stamped(
				'core/query-pagination-previous',
				'section/pagination-previous:default'
			),
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
		]);
		expect(byId(both, 'pagination-previous').disabled).toBe(false);
		expect(byId(both, 'pagination-numbers').disabled).toBe(false);
		expect(byId(both, 'pagination-next').disabled).toBe(false);

		const onlyNumbers = resolveElements([
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
		]);
		expect(byId(onlyNumbers, 'pagination-numbers').disabled).toBe(true);
		expect(byId(onlyNumbers, 'pagination-previous').disabled).toBe(false);
		expect(byId(onlyNumbers, 'pagination-next').disabled).toBe(false);
	});

	it('does not lock an optional on item that shares requireAtLeastOneOf', () => {
		const filler = {
			id: 'space-filler',
			type: 'toggle',
			label: 'Space Filler',
			target: { kind: 'section', id: 'space-filler' },
			operation: 'toggleSection',
			requireAtLeastOneOf: required,
		};
		const states = resolve(
			[
				stamped(
					'core/query-pagination',
					'section/pagination:standard',
					{},
					[
						stamped(
							'core/query-pagination-numbers',
							'section/pagination-numbers:default'
						),
						stamped('core/group', 'section/space-filler:default'),
					]
				),
			],
			makeConfig([previous, numbers, next, filler])
		);
		expect(byId(states, 'pagination-numbers').disabled).toBe(true);
		expect(byId(states, 'space-filler').value).toBe(true);
		expect(byId(states, 'space-filler').disabled).toBe(false);
	});

	it('treats an alsoToggle companion as on when only the extra stamp is present', () => {
		const paired = {
			id: 'pagination-prev-next',
			type: 'toggle',
			label: 'Next/Prev',
			target: { kind: 'section', id: 'pagination-previous' },
			operation: 'toggleSection',
			alsoToggle: [{ id: 'pagination-next' }],
		};
		const states = resolve(
			[
				stamped(
					'core/query-pagination',
					'section/pagination:standard',
					{},
					[
						stamped(
							'core/query-pagination-next',
							'section/pagination-next:default'
						),
					]
				),
			],
			makeConfig([paired])
		);
		expect(byId(states, 'pagination-prev-next').value).toBe(true);
	});

	it('reads previous/next labels and numbers midSize from the blocks', () => {
		const config = makeConfig([
			{
				id: 'pagination-previous-label',
				type: 'input',
				label: 'Previous Label',
				target: { kind: 'section', id: 'pagination-previous' },
				operation: 'setSectionAttribute',
				attributePath: 'label',
				defaultValue: '',
			},
			{
				id: 'pagination-next-label',
				type: 'input',
				label: 'Next Label',
				target: { kind: 'section', id: 'pagination-next' },
				operation: 'setSectionAttribute',
				attributePath: 'label',
				defaultValue: '',
			},
			{
				id: 'pagination-numbers-mid-size',
				type: 'number',
				label: 'Number of links',
				target: { kind: 'section', id: 'pagination-numbers' },
				operation: 'setSectionAttribute',
				attributePath: 'midSize',
				defaultValue: 2,
			},
		]);
		const withValues = resolve(
			[
				stamped(
					'core/query-pagination',
					'section/pagination:standard',
					{},
					[
						stamped(
							'core/query-pagination-previous',
							'section/pagination-previous:default',
							{ label: 'Back' }
						),
						stamped(
							'core/query-pagination-numbers',
							'section/pagination-numbers:default',
							{ midSize: 4 }
						),
						stamped(
							'core/query-pagination-next',
							'section/pagination-next:default',
							{ label: 'Forward' }
						),
					]
				),
			],
			config
		);
		expect(byId(withValues, 'pagination-previous-label').value).toBe(
			'Back'
		);
		expect(byId(withValues, 'pagination-next-label').value).toBe('Forward');
		expect(byId(withValues, 'pagination-numbers-mid-size').value).toBe(4);

		const defaults = resolve(
			[
				stamped(
					'core/query-pagination',
					'section/pagination:standard',
					{},
					[
						stamped(
							'core/query-pagination-previous',
							'section/pagination-previous:default'
						),
						stamped(
							'core/query-pagination-numbers',
							'section/pagination-numbers:default'
						),
						stamped(
							'core/query-pagination-next',
							'section/pagination-next:default'
						),
					]
				),
			],
			config
		);
		expect(byId(defaults, 'pagination-previous-label').value).toBe('');
		expect(byId(defaults, 'pagination-next-label').value).toBe('');
		expect(byId(defaults, 'pagination-numbers-mid-size').value).toBe(2);
	});

	it('reads a merged spacing side instead of the whole box', () => {
		const config = makeConfig([
			{
				id: 'pagination-top-spacing',
				type: 'input',
				label: 'Top Spacing',
				target: { kind: 'section', id: 'pagination' },
				operation: 'setSectionAttribute',
				attributePath: 'blockeraSpacing.value',
				attributeMergeKeys: ['margin.top'],
			},
		]);
		const states = resolve(
			[
				stamped(
					'core/query-pagination',
					'section/pagination:standard',
					{
						blockeraSpacing: {
							value: {
								margin: { top: '24px' },
								padding: { top: '16px' },
							},
						},
					}
				),
			],
			config
		);
		expect(byId(states, 'pagination-top-spacing').value).toBe('24px');
	});

	it('hydrates featured image aspect ratio from the WP attribute', () => {
		const config = makeConfig([
			{
				id: 'post-featured-image-aspect-ratio',
				type: 'aspect-ratio',
				label: 'Aspect Ratio',
				target: { kind: 'section', id: 'post-featured-image' },
				operation: 'setSectionAttribute',
				attributePath: 'blockeraRatio.value',
				defaultValue: { val: '', width: '', height: '' },
			},
		]);
		const fromWp = byId(
			resolve(
				[
					stamped(
						'core/post-featured-image',
						'section/post-featured-image:default',
						{ aspectRatio: '3/2' }
					),
				],
				config
			),
			'post-featured-image-aspect-ratio'
		);
		expect(fromWp.value).toEqual({ val: '3/2', width: '', height: '' });

		const fromCustom = byId(
			resolve(
				[
					stamped(
						'core/post-featured-image',
						'section/post-featured-image:default',
						{ aspectRatio: '21/9' }
					),
				],
				config
			),
			'post-featured-image-aspect-ratio'
		);
		expect(fromCustom.value).toEqual({
			val: 'custom',
			width: '21',
			height: '9',
		});

		const fromBlockera = byId(
			resolve(
				[
					stamped(
						'core/post-featured-image',
						'section/post-featured-image:default',
						{
							aspectRatio: '3/2',
							blockeraRatio: {
								value: { val: '1', width: '', height: '' },
							},
						}
					),
				],
				config
			),
			'post-featured-image-aspect-ratio'
		);
		expect(fromBlockera.value).toEqual({
			val: '1',
			width: '',
			height: '',
		});
	});

	it('maps featured image linkTarget onto the open-in-new-tab toggle', () => {
		const config = makeConfig([
			{
				id: 'post-featured-image-is-link',
				type: 'toggle',
				label: 'Make image a link',
				target: { kind: 'section', id: 'post-featured-image' },
				operation: 'setSectionAttribute',
				attributePath: 'isLink',
				defaultValue: true,
			},
			{
				id: 'post-featured-image-open-in-new-tab',
				type: 'toggle',
				label: 'Open in new tab',
				target: { kind: 'section', id: 'post-featured-image' },
				operation: 'setSectionAttribute',
				attributePath: 'linkTarget',
				onValue: '_blank',
				offValue: '_self',
				defaultValue: false,
				conditions: [
					{ controlId: 'post-featured-image-is-link', equals: true },
				],
			},
		]);
		const linked = resolve(
			[
				stamped(
					'core/post-featured-image',
					'section/post-featured-image:default',
					{ isLink: true, linkTarget: '_blank' }
				),
			],
			config
		);
		expect(byId(linked, 'post-featured-image-is-link').value).toBe(true);
		expect(byId(linked, 'post-featured-image-open-in-new-tab').value).toBe(
			true
		);
		expect(
			byId(linked, 'post-featured-image-open-in-new-tab').visible
		).toBe(true);

		const unlinked = resolve(
			[
				stamped(
					'core/post-featured-image',
					'section/post-featured-image:default',
					{ isLink: false, linkTarget: '_self' }
				),
			],
			config
		);
		expect(byId(unlinked, 'post-featured-image-is-link').value).toBe(false);
		expect(
			byId(unlinked, 'post-featured-image-open-in-new-tab').visible
		).toBe(false);
	});

	it('reads post-meta parts, separator, and items design from the tree', () => {
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				stamped(
					'core/group',
					'section/post-meta-author-name:default',
					{},
					[
						stamped(
							'core/paragraph',
							'container/meta-item-prefix:default',
							{ content: 'By' }
						),
						stamped(
							'core/post-author-name',
							'container/meta-item-block:default'
						),
					]
				),
				stamped('core/paragraph', 'container/meta-separator:default', {
					content: '\u2022',
				}),
				stamped(
					'core/group',
					'section/post-meta-post-date:default',
					{},
					[
						stamped(
							'core/paragraph',
							'container/meta-item-prefix:default',
							{ content: 'Published' }
						),
						stamped(
							'core/post-date',
							'container/meta-item-block:default',
							{ isLink: true }
						),
					]
				),
			]),
		];
		const config = {
			type: 'archive',
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'posts-loop',
					title: 'Loop',
					controls: [
						{
							id: 'post-meta-items-design',
							type: 'toggle-select',
							target: { kind: 'section', id: 'post-meta' },
							operation: 'setMetaItemsDesign',
							defaultValue: 'labels',
						},
						{
							id: 'post-meta-separator',
							type: 'toggle-select',
							target: { kind: 'section', id: 'post-meta' },
							operation: 'setMetaSeparator',
							defaultValue: 'bullet',
						},
						{
							id: 'post-meta-author-name-prefix',
							type: 'input',
							target: {
								kind: 'section',
								id: 'post-meta-author-name',
							},
							operation: 'setMetaItemPart',
							attributePath: 'prefix',
						},
						{
							id: 'post-meta-author-name-icon',
							type: 'icon',
							target: {
								kind: 'section',
								id: 'post-meta-author-name',
							},
							operation: 'setMetaItemPart',
							attributePath: 'icon',
						},
						{
							id: 'post-meta-post-date-is-link',
							type: 'toggle',
							target: {
								kind: 'container',
								id: 'meta-item-block',
							},
							operation: 'setSectionAttribute',
							attributePath: 'isLink',
							defaultValue: true,
							innerOrder: {
								parentId: 'post-meta-post-date',
								ids: [],
							},
						},
					],
				},
			],
		};
		const states = resolve(blocks, config);
		expect(byId(states, 'post-meta-items-design').value).toBe('labels');
		expect(byId(states, 'post-meta-separator').value).toBe('bullet');
		expect(byId(states, 'post-meta-author-name-prefix').value).toBe('By');
		expect(byId(states, 'post-meta-author-name-icon').value).toMatchObject({
			icon: '',
			library: '',
		});
		expect(byId(states, 'post-meta-post-date-is-link').value).toBe(true);
	});

	it('leaves Items Design unselected when item parts are mixed', () => {
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				stamped(
					'core/group',
					'section/post-meta-author-name:default',
					{},
					[
						stamped(
							'core/paragraph',
							'container/meta-item-prefix:default',
							{ content: 'By' }
						),
						stamped(
							'core/post-author-name',
							'container/meta-item-block:default'
						),
					]
				),
				stamped(
					'core/group',
					'section/post-meta-post-date:default',
					{},
					[
						stamped(
							'core/post-date',
							'container/meta-item-block:default'
						),
					]
				),
			]),
		];
		const config = {
			type: 'archive',
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'posts-loop',
					title: 'Loop',
					controls: [
						{
							id: 'post-meta-items-design',
							type: 'toggle-select',
							target: { kind: 'section', id: 'post-meta' },
							operation: 'setMetaItemsDesign',
							defaultValue: 'labels',
						},
					],
				},
			],
		};
		expect(
			byId(resolve(blocks, config), 'post-meta-items-design').value
		).toBe(null);
	});
});

describe('Post Meta lookup-scoped resolution', () => {
	function metaRow(rowId) {
		return stamped('core/group', `section/${rowId}:default`, {}, [
			stamped('core/group', `section/${rowId}-author-name:default`, {}, [
				stamped(
					'core/post-author-name',
					'container/meta-item-block:default'
				),
			]),
		]);
	}

	function sectionWithBody(sectionId, inner) {
		return stamped('core/group', `section/${sectionId}:default`, {}, [
			stamped('core/group', 'container/body:default', {}, inner),
		]);
	}

	function metaStyleControls(rowId, prefix) {
		const id = (suffix) =>
			prefix ? `${prefix}-${rowId}-${suffix}` : `${rowId}-${suffix}`;
		const target = { kind: 'section', id: rowId };
		const innerOrder = {
			parentId: rowId,
			ids: [],
			within: prefix === 'page-header' ? 'page-header' : 'article',
		};
		return [
			{
				id: id('items-design'),
				type: 'toggle-select',
				target,
				operation: 'setMetaItemsDesign',
				innerOrder,
			},
			{
				id: id('separator'),
				type: 'toggle-select',
				target,
				operation: 'setMetaSeparator',
				innerOrder,
			},
			{
				id: id('customize'),
				type: 'button',
				target,
				operation: 'selectInCanvas',
				innerOrder,
			},
		];
	}

	function metaToggle(rowId, prefix) {
		const id = prefix ? `${prefix}-${rowId}` : rowId;
		return {
			id,
			type: 'toggle',
			target: { kind: 'section', id: rowId },
			operation: 'toggleSection',
			nestedPanel: {
				id,
				title: 'Post Meta',
				groups: [
					{
						id: `${id}-styles`,
						controls: metaStyleControls(rowId, prefix),
					},
				],
			},
		};
	}

	function singleMetaConfig(groupOrder = ['page-header', 'article']) {
		const groups = {
			'page-header': {
				id: 'page-header',
				title: 'Page Header',
				controls: [
					metaToggle('post-meta', 'page-header'),
					metaToggle('post-meta-2', 'page-header'),
				],
			},
			article: {
				id: 'article',
				title: 'Post Content',
				controls: [metaToggle('post-meta'), metaToggle('post-meta-2')],
			},
		};
		return {
			type: 'single',
			layoutId: LAYOUT_ID,
			groups: groupOrder.map((id) => groups[id]),
		};
	}

	const PAGE_HEADER_STYLE_IDS = [
		'page-header-post-meta-items-design',
		'page-header-post-meta-separator',
		'page-header-post-meta-customize',
		'page-header-post-meta-2-items-design',
		'page-header-post-meta-2-separator',
		'page-header-post-meta-2-customize',
	];
	const ARTICLE_STYLE_IDS = [
		'post-meta-items-design',
		'post-meta-separator',
		'post-meta-customize',
		'post-meta-2-items-design',
		'post-meta-2-separator',
		'post-meta-2-customize',
	];

	function expectKinds(states, ids, kind) {
		for (let i = 0; i < ids.length; i++) {
			expect(byId(states, ids[i]).state.kind).toBe(kind);
		}
	}

	function expectNotMissing(states, ids) {
		for (let i = 0; i < ids.length; i++) {
			expect(byId(states, ids[i]).state.kind).not.toBe('missing');
		}
	}

	it('keeps article Items Design enabled when page-header Post Meta is off', () => {
		const states = resolve(
			[
				sectionWithBody('page-header', []),
				sectionWithBody('article', [
					metaRow('post-meta'),
					metaRow('post-meta-2'),
				]),
			],
			singleMetaConfig()
		);
		expect(byId(states, 'page-header-post-meta').value).toBe(false);
		expect(byId(states, 'post-meta').value).toBe(true);
		expectKinds(states, PAGE_HEADER_STYLE_IDS, 'missing');
		expectNotMissing(states, ARTICLE_STYLE_IDS);
	});

	it('resolves both instances as present when each parent has its own row', () => {
		const states = resolve(
			[
				sectionWithBody('page-header', [
					metaRow('post-meta'),
					metaRow('post-meta-2'),
				]),
				sectionWithBody('article', [
					metaRow('post-meta'),
					metaRow('post-meta-2'),
				]),
			],
			singleMetaConfig()
		);
		expectNotMissing(states, PAGE_HEADER_STYLE_IDS);
		expectNotMissing(states, ARTICLE_STYLE_IDS);
		expect(
			byId(states, 'page-header-post-meta-items-design').state.path
		).not.toEqual(byId(states, 'post-meta-items-design').state.path);
	});

	it('keeps page-header styles missing when only article has the row and article flattens first', () => {
		const states = resolve(
			[
				sectionWithBody('page-header', []),
				sectionWithBody('article', [metaRow('post-meta')]),
			],
			singleMetaConfig(['article', 'page-header'])
		);
		expectKinds(
			states,
			[
				'page-header-post-meta-items-design',
				'page-header-post-meta-separator',
				'page-header-post-meta-customize',
			],
			'missing'
		);
		expectNotMissing(states, [
			'post-meta-items-design',
			'post-meta-separator',
			'post-meta-customize',
		]);
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
