/**
 * apply-operation.ts: pure dispatch from control changes to block trees or
 * site-entity edits. The WP parse/serialize adapter is mocked with an
 * internal markup map so no @wordpress/blocks registration is needed.
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

import { applyOperation } from '../apply-operation';
import { __setMarkup } from '../blocks-adapter';
import { TEMPLATE_SETTINGS_KEY } from '../constants';
import { INNER_ORDER_META_KEY } from '../element-order';
import { getStamp } from '../metadata';
import { findByStamp } from '../tree';

const LAYOUT_ID = 'archive-body';

function block(name, attributes = {}, innerBlocks = []) {
	return { name, attributes, innerBlocks };
}

function stamped(name, stampValue, attributes = {}, innerBlocks = []) {
	const { metadata, ...rest } = attributes;
	return block(
		name,
		{
			...rest,
			metadata: { ...(metadata || {}), blockeraOne: stampValue },
		},
		innerBlocks
	);
}

beforeAll(() => {
	__setMarkup('layout-no-sidebar', [
		stamped(
			'core/group',
			`layout/${LAYOUT_ID}:no-sidebar`,
			{ tagName: 'main' },
			[stamped('core/group', 'area/content')]
		),
	]);
	__setMarkup('layout-sidebar-right', [
		stamped(
			'core/group',
			`layout/${LAYOUT_ID}:sidebar-right`,
			{ tagName: 'main' },
			[
				block('core/columns', {}, [
					block('core/column', {}, [
						stamped('core/group', 'area/content'),
					]),
					block('core/column', {}, [
						stamped('core/group', 'area/sidebar-area'),
					]),
				]),
			]
		),
	]);
	// Listing markup ships with its default pagination inside.
	__setMarkup('listing-grid-2', [
		stamped('core/query', 'section/posts-listing:grid-2', {}, [
			stamped('core/query-pagination', 'section/pagination:standard'),
		]),
	]);
	__setMarkup('pagination-standard', [
		stamped('core/query-pagination', 'section/pagination:standard'),
	]);
	__setMarkup('pagination-previous', [
		stamped(
			'core/query-pagination-previous',
			'section/pagination-previous:default'
		),
	]);
	__setMarkup('pagination-next', [
		stamped(
			'core/query-pagination-next',
			'section/pagination-next:default'
		),
	]);
	__setMarkup('pagination-numbers', [
		stamped(
			'core/query-pagination-numbers',
			'section/pagination-numbers:default'
		),
	]);
	__setMarkup('header-large', [
		block('core/template-part', { slug: 'raw', area: 'header' }),
	]);
});

const LAYOUT_VARIANTS = [
	{
		id: 'no-sidebar',
		label: 'None',
		html: 'layout-no-sidebar',
		areas: ['content'],
	},
	{
		id: 'sidebar-right',
		label: 'Right',
		html: 'layout-sidebar-right',
		areas: ['content', 'sidebar-area'],
	},
];

const LISTING_VARIANTS = [
	{ id: 'list', label: 'List', html: 'listing-list' },
	{ id: 'grid-2', label: 'Grid 2', html: 'listing-grid-2' },
];

const PAGINATION_VARIANTS = [
	{ id: 'standard', label: 'Standard', html: 'pagination-standard' },
	{
		id: 'load-more',
		label: 'Load more',
		disabled: true,
		badge: 'Coming soon',
	},
];

const CONTROLS = {
	postsPerPage: {
		id: 'posts-per-page',
		type: 'number',
		label: 'Posts',
		target: { kind: 'setting', id: 'posts_per_page' },
		operation: 'setTemplateSetting',
		defaultValue: 10,
	},
	sidebarToggle: {
		id: 'sidebar',
		type: 'toggle',
		label: 'Sidebar',
		target: { kind: 'layout', id: LAYOUT_ID },
		operation: 'transplantLayout',
		onValue: 'sidebar-right',
		offValue: 'no-sidebar',
		variants: LAYOUT_VARIANTS,
	},
	postsTemplate: {
		id: 'posts-template',
		type: 'layout-picker',
		label: 'Posts Template',
		target: { kind: 'section', id: 'posts-listing' },
		operation: 'swapSection',
		variants: LISTING_VARIANTS,
		swapHints: {
			preserveQuery: true,
			reapplyControls: [
				'pagination',
				'pagination-previous',
				'pagination-numbers',
				'pagination-next',
			],
		},
	},
	pagination: {
		id: 'pagination',
		type: 'toggle',
		label: 'Pagination',
		target: { kind: 'section', id: 'pagination' },
		operation: 'toggleSection',
		variants: PAGINATION_VARIANTS,
		insert: { relativeTo: 'posts-listing', position: 'inside-end' },
	},
	paginationDesign: {
		id: 'pagination-design',
		type: 'layout-picker',
		label: 'Pagination Design',
		target: { kind: 'section', id: 'pagination' },
		operation: 'swapSection',
		variants: PAGINATION_VARIANTS,
	},
	paginationPrevious: {
		id: 'pagination-previous',
		type: 'toggle',
		label: 'Previous Page',
		target: { kind: 'section', id: 'pagination-previous' },
		operation: 'toggleSection',
		catalogPool: 'pagination-previous',
		variants: [
			{ id: 'default', label: 'Previous', html: 'pagination-previous' },
		],
		insert: { relativeTo: 'pagination', position: 'inside-start' },
		innerOrder: {
			parentId: 'pagination',
			ids: [
				'pagination-previous',
				'pagination-numbers',
				'pagination-next',
			],
		},
		requireAtLeastOneOf: [
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		],
	},
	paginationNumbers: {
		id: 'pagination-numbers',
		type: 'toggle',
		label: 'Numbers',
		target: { kind: 'section', id: 'pagination-numbers' },
		operation: 'toggleSection',
		variants: [
			{ id: 'default', label: 'Numbers', html: 'pagination-numbers' },
		],
		insert: { relativeTo: 'pagination', position: 'inside-start' },
		innerOrder: {
			parentId: 'pagination',
			ids: [
				'pagination-previous',
				'pagination-numbers',
				'pagination-next',
			],
		},
		requireAtLeastOneOf: [
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		],
	},
	paginationNext: {
		id: 'pagination-next',
		type: 'toggle',
		label: 'Next Page',
		target: { kind: 'section', id: 'pagination-next' },
		operation: 'toggleSection',
		variants: [{ id: 'default', label: 'Next', html: 'pagination-next' }],
		insert: { relativeTo: 'pagination', position: 'inside-end' },
		innerOrder: {
			parentId: 'pagination',
			ids: [
				'pagination-previous',
				'pagination-numbers',
				'pagination-next',
			],
		},
		requireAtLeastOneOf: [
			'pagination-previous',
			'pagination-numbers',
			'pagination-next',
		],
	},
	headerDesign: {
		id: 'header-design',
		type: 'layout-picker',
		label: 'Header',
		target: { kind: 'section', id: 'header' },
		operation: 'swapTemplatePart',
		variants: [
			{ id: 'header-large', label: 'Large', html: 'header-large' },
		],
	},
	headerToggle: {
		id: 'header-toggle',
		type: 'toggle',
		label: 'Header',
		target: { kind: 'section', id: 'header' },
		operation: 'toggleSection',
	},
	queryPerPage: {
		id: 'query-per-page',
		type: 'number',
		label: 'Per page',
		target: { kind: 'section', id: 'posts-listing' },
		operation: 'setSectionAttribute',
		attributePath: 'query.perPage',
	},
};

const CONFIG = {
	type: 'archive',
	filters: ['archive'],
	layoutId: LAYOUT_ID,
	groups: [
		{
			id: 'main',
			title: 'Main',
			controls: Object.values(CONTROLS),
		},
	],
};

function makeBlocks() {
	return [
		stamped('core/template-part', 'section/header:header-default', {
			slug: 'header-default',
			area: 'header',
		}),
		stamped(
			'core/group',
			`layout/${LAYOUT_ID}:no-sidebar`,
			{ tagName: 'main' },
			[
				stamped('core/group', 'area/content', {}, [
					stamped(
						'core/query',
						'section/posts-listing:list',
						{ query: { inherit: true, perPage: 10 } },
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
						]
					),
				]),
			]
		),
	];
}

function apply(control, nextValue, overrides = {}) {
	return applyOperation({
		blocks: makeBlocks(),
		control,
		nextValue,
		config: CONFIG,
		settings: { posts_per_page: { archive: 12 } },
		settingBucket: 'archive',
		needsConfirm: false,
		...overrides,
	});
}

function findStamp(blocks, id) {
	return findByStamp(blocks, (stamp) => stamp?.id === id);
}

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

describe('transplantLayout', () => {
	it('maps toggle on/off to the onValue/offValue variants', () => {
		const on = apply(CONTROLS.sidebarToggle, true);
		expect(on.kind).toBe('blocks');
		expect(getStamp(findStamp(on.blocks, LAYOUT_ID).block).variant).toBe(
			'sidebar-right'
		);
		// Area content survives the toggle.
		expect(findStamp(on.blocks, 'posts-listing')).not.toBeNull();

		const off = apply(CONTROLS.sidebarToggle, false);
		expect(getStamp(findStamp(off.blocks, LAYOUT_ID).block).variant).toBe(
			'no-sidebar'
		);
	});

	it('supports non-toggle layout pickers and rejects unknown variants', () => {
		const picker = {
			...CONTROLS.sidebarToggle,
			type: 'layout-picker',
			onValue: undefined,
			offValue: undefined,
		};
		const result = apply(picker, 'sidebar-right');
		expect(
			getStamp(findStamp(result.blocks, LAYOUT_ID).block).variant
		).toBe('sidebar-right');

		expect(apply(picker, 'does-not-exist')).toBeNull();
	});
});

describe('swapSection', () => {
	it('swaps the listing and re-applies pagination elements', () => {
		// Grid markup ships an empty pagination wrapper; the hint restores
		// the user's previous / numbers / next inner blocks.
		const result = apply(CONTROLS.postsTemplate, 'grid-2');

		const listing = findStamp(result.blocks, 'posts-listing');
		expect(getStamp(listing.block).variant).toBe('grid-2');

		const pagination = findStamp(result.blocks, 'pagination');
		expect(getStamp(pagination.block).variant).toBe('standard');
		expect(findStamp(result.blocks, 'pagination-previous')).not.toBeNull();
		expect(findStamp(result.blocks, 'pagination-numbers')).not.toBeNull();
		expect(findStamp(result.blocks, 'pagination-next')).not.toBeNull();
	});

	it('does not swap a disabled catalog tile', () => {
		expect(apply(CONTROLS.paginationDesign, 'load-more')).toBeNull();
	});

	it('skips the re-apply when the dependent already uses its default', () => {
		const blocks = makeBlocks();
		const listing = findStamp(blocks, 'posts-listing');
		listing.block.innerBlocks[0].attributes.metadata.blockeraOne =
			'section/pagination:standard';

		const result = apply(CONTROLS.postsTemplate, 'grid-2', { blocks });
		const pagination = findStamp(result.blocks, 'pagination');
		expect(getStamp(pagination.block).variant).toBe('standard');
	});

	it('returns null for an unknown variant id', () => {
		expect(apply(CONTROLS.postsTemplate, 'nope')).toBeNull();
	});

	it('does not carry previous blockera* attrs onto the new pattern by default', () => {
		__setMarkup('page-header-banner', [
			stamped('core/group', 'section/page-header:banner', {
				blockeraFlexLayout: {
					value: {
						direction: 'column',
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
			}),
		]);
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {
				blockeraFlexLayout: {
					value: {
						direction: 'column',
						alignItems: 'flex-start',
						justifyContent: 'center',
					},
				},
				blockeraFontColor: { value: '#abc' },
			}),
		];
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-simple' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [design],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraFlexLayout
		).toEqual({
			value: {
				direction: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			},
		});
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraFontColor
		).toBeUndefined();
	});
});

describe('swapTemplatePart', () => {
	it('delegates to the chrome swap (slug + stamp forced to the variant)', () => {
		const result = apply(CONTROLS.headerDesign, 'header-large');
		const header = findStamp(result.blocks, 'header');

		expect(header.block.attributes.slug).toBe('header-large');
		expect(getStamp(header.block).variant).toBe('header-large');
	});

	it('returns null for an unknown variant id', () => {
		expect(apply(CONTROLS.headerDesign, 'nope')).toBeNull();
	});
});

describe('toggleSection', () => {
	it('removes the section when toggled off (with chrome unwrap preparation)', () => {
		// Header inside a vertical rail: hiding must unwrap the rail first so
		// the layout is not left trapped inside columns.
		const rail = [
			stamped('core/columns', 'container/chrome-rail:vertical-rail', {}, [
				block('core/column', {}, [
					stamped('core/template-part', 'section/header:vertical', {
						slug: 'header-vertical',
					}),
				]),
				block('core/column', {}, [
					stamped(
						'core/group',
						`layout/${LAYOUT_ID}:no-sidebar`,
						{},
						[stamped('core/group', 'area/content')]
					),
				]),
			]),
		];

		const result = apply(CONTROLS.headerToggle, false, { blocks: rail });
		expect(findStamp(result.blocks, 'header')).toBeNull();
		expect(findStamp(result.blocks, 'chrome-rail')).toBeNull();
		expect(findStamp(result.blocks, LAYOUT_ID).path).toEqual([0]);
	});

	it('honors invertPresence (true means remove)', () => {
		const control = { ...CONTROLS.headerToggle, invertPresence: true };
		const result = apply(control, true);
		expect(findStamp(result.blocks, 'header')).toBeNull();
	});

	it('appends a restored title after present children when no stored order exists', () => {
		__setMarkup('page-header-title', [
			stamped('core/query-title', 'section/page-header-title:default'),
		]);
		const innerOrder = {
			parentId: 'page-header',
			ids: [
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
		};
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/breadcrumbs',
					'section/page-header-breadcrumbs:default'
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		];
		const control = {
			id: 'page-header-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-header-title' },
			],
			insert: { relativeTo: 'page-header', position: 'inside-start' },
			innerOrder,
		};

		const result = apply(control, true, { blocks });
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/breadcrumbs',
			'core/term-description',
			'core/query-title',
		]);
	});

	it('persists pre-toggle order so a hidden title keeps its list slot', () => {
		const innerOrder = {
			parentId: 'page-header',
			ids: [
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
		};
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		];
		const control = {
			id: 'page-header-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-header-title' },
			],
			insert: { relativeTo: 'page-header', position: 'inside-start' },
			innerOrder,
		};

		const result = apply(control, false, { blocks });
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/term-description',
		]);
		expect(
			result.blocks[0].attributes.metadata[INNER_ORDER_META_KEY]
		).toEqual([
			'page-header-title',
			'page-header-description',
			'page-header-breadcrumbs',
		]);
	});

	it('restores a toggled-on title at its stored list slot', () => {
		__setMarkup('page-header-title', [
			stamped('core/query-title', 'section/page-header-title:default'),
		]);
		const innerOrder = {
			parentId: 'page-header',
			ids: [
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
		};
		const blocks = [
			stamped(
				'core/group',
				'section/page-header:default',
				{
					metadata: {
						blockeraOne: 'section/page-header:default',
						[INNER_ORDER_META_KEY]: [
							'page-header-breadcrumbs',
							'page-header-title',
							'page-header-description',
						],
					},
				},
				[
					stamped(
						'core/breadcrumbs',
						'section/page-header-breadcrumbs:default'
					),
					stamped(
						'core/term-description',
						'section/page-header-description:default'
					),
				]
			),
		];
		const control = {
			id: 'page-header-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-header-title' },
			],
			insert: { relativeTo: 'page-header', position: 'inside-start' },
			innerOrder,
		};

		const result = apply(control, true, { blocks });
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/breadcrumbs',
			'core/query-title',
			'core/term-description',
		]);
	});
});

describe('reorderInnerSections', () => {
	it('writes stored order and reorders present children', () => {
		const innerOrder = {
			parentId: 'page-header',
			ids: [
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
		};
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		];
		const control = {
			id: 'reorder-page-header',
			type: 'button',
			label: '',
			target: { kind: 'section', id: 'page-header' },
			operation: 'reorderInnerSections',
			innerOrder,
		};

		const result = apply(
			control,
			[
				'page-header-breadcrumbs',
				'page-header-description',
				'page-header-title',
			],
			{ blocks }
		);
		expect(
			result.blocks[0].attributes.metadata[INNER_ORDER_META_KEY]
		).toEqual([
			'page-header-breadcrumbs',
			'page-header-description',
			'page-header-title',
		]);
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/term-description',
			'core/query-title',
		]);
	});
});

describe('setSectionAttribute', () => {
	it('sets the nested attribute on the detected section', () => {
		const result = apply(CONTROLS.queryPerPage, 24);
		const listing = findStamp(result.blocks, 'posts-listing');
		expect(listing.block.attributes.query.perPage).toBe(24);
	});

	it('writes object values onto the nested attribute path', () => {
		const gapValue = {
			lock: true,
			gap: '24px',
			columns: '',
			rows: '',
		};
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}),
		];
		const control = {
			id: 'page-header-gap',
			type: 'input',
			label: 'Items Spacing',
			target: { kind: 'section', id: 'page-header' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes.blockeraGap
				.value
		).toEqual(gapValue);
	});

	it('also writes the same attribute onto alsoSetOn stamps', () => {
		const gapValue = {
			lock: true,
			gap: '24px',
			columns: '',
			rows: '',
		};
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped('core/group', 'container/elements', {}),
			]),
		];
		const control = {
			id: 'page-header-gap',
			type: 'input',
			label: 'Items Spacing',
			target: { kind: 'section', id: 'page-header' },
			alsoSetOn: ['elements'],
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes.blockeraGap
				.value
		).toEqual(gapValue);
		expect(
			findStamp(result.blocks, 'elements').block.attributes.blockeraGap
				.value
		).toEqual(gapValue);
	});

	it('skips a missing alsoSetOn stamp without changing the primary write', () => {
		const gapValue = {
			lock: true,
			gap: '24px',
			columns: '',
			rows: '',
		};
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}),
		];
		const control = {
			id: 'page-header-gap',
			type: 'input',
			label: 'Items Spacing',
			target: { kind: 'section', id: 'page-header' },
			alsoSetOn: ['elements'],
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes.blockeraGap
				.value
		).toEqual(gapValue);
		expect(findStamp(result.blocks, 'elements')).toBeNull();
	});

	it('merges spacing sides into the current object without wiping siblings', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {
				blockeraSpacing: {
					value: {
						padding: {
							top: '60px',
							right: '50px',
							bottom: '60px',
							left: '50px',
						},
						margin: {
							top: '',
							right: '',
							bottom: '40px',
							left: '',
						},
					},
				},
			}),
		];
		const control = {
			id: 'page-header-padding',
			type: 'input',
			label: 'Container Padding',
			target: { kind: 'section', id: 'page-header' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraSpacing.value',
			attributeMergeKeys: ['padding.top', 'padding.bottom'],
		};
		const result = apply(control, '80px', { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraSpacing.value
		).toEqual({
			padding: {
				top: '80px',
				right: '50px',
				bottom: '80px',
				left: '50px',
			},
			margin: {
				top: '',
				right: '',
				bottom: '40px',
				left: '',
			},
		});
	});

	it('writes flex layout onto alsoSetOn stamps', () => {
		const layout = {
			direction: 'column',
			alignItems: 'center',
			justifyContent: 'flex-end',
		};
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped('core/group', 'container/elements', {}),
			]),
		];
		const control = {
			id: 'page-header-align',
			type: 'layout-matrix',
			label: 'Items alignment',
			target: { kind: 'section', id: 'page-header' },
			alsoSetOn: ['elements'],
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFlexLayout.value',
		};
		const result = apply(control, layout, { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraFlexLayout.value
		).toEqual(layout);
		expect(
			findStamp(result.blocks, 'elements').block.attributes
				.blockeraFlexLayout.value
		).toEqual(layout);
	});

	it('writes banner items alignment only onto the elements container', () => {
		const layout = {
			direction: 'column',
			alignItems: 'flex-end',
			justifyContent: 'center',
		};
		const sectionLayout = {
			direction: 'column',
			alignItems: 'center',
			justifyContent: 'center',
		};
		const blocks = [
			stamped(
				'core/group',
				'section/page-header:banner',
				{ blockeraFlexLayout: { value: sectionLayout } },
				[stamped('core/group', 'container/elements', {})]
			),
		];
		const control = {
			id: 'page-header-align-banner',
			type: 'layout-matrix',
			label: 'Items alignment',
			target: { kind: 'container', id: 'elements' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFlexLayout.value',
		};
		const result = apply(control, layout, { blocks });
		expect(
			findStamp(result.blocks, 'elements').block.attributes
				.blockeraFlexLayout.value
		).toEqual(layout);
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraFlexLayout.value
		).toEqual(sectionLayout);
	});

	it('also writes a fixed attribute on the same target', () => {
		const blocks = [
			stamped('core/group', 'container/elements', {
				blockeraWidth: { value: '100%' },
			}),
		];
		const control = {
			id: 'page-header-elements-width',
			type: 'input',
			label: 'Elements Container Width',
			target: { kind: 'container', id: 'elements' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraMaxWidth.value',
			alsoWrite: [
				{
					attributePath: 'blockeraWidth.value',
					value: 'stretch',
				},
			],
		};
		const result = apply(control, '720px', { blocks });
		const attrs = findStamp(result.blocks, 'elements').block.attributes;
		expect(attrs.blockeraMaxWidth.value).toBe('720px');
		expect(attrs.blockeraWidth.value).toBe('stretch');
	});

	it('persists blockera-block className for style-engine selectors', () => {
		const gapValue = {
			lock: true,
			gap: '24px',
			columns: '',
			rows: '',
		};
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default',
				{ className: 'is-style-underline' }
			),
		];
		const control = {
			id: 'breadcrumbs-gap',
			type: 'input',
			label: 'Gap',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		const attrs = findStamp(result.blocks, 'page-header-breadcrumbs').block
			.attributes;
		expect(attrs.blockeraGap.value).toEqual(gapValue);
		expect(attrs.blockeraPropsId).toBeTruthy();
		expect(attrs.blockeraCompatId).toBeTruthy();
		expect(attrs.className).toContain('is-style-underline');
		expect(attrs.className).toContain('blockera-block');
		expect(attrs.className).toContain(
			`blockera-block-${attrs.blockeraCompatId}`
		);
	});

	it('writes Blockera color and font-size values through the inspector path', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		];
		const color = {
			id: 'breadcrumbs-color',
			type: 'color',
			label: 'Text Color',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
		};
		const fontSize = {
			id: 'breadcrumbs-font-size',
			type: 'input',
			label: 'Font Size',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
		};

		const withColor = apply(color, '#111111', { blocks });
		const colorAttrs = findStamp(
			withColor.blocks,
			'page-header-breadcrumbs'
		).block.attributes;
		expect(colorAttrs.blockeraFontColor).toEqual({ value: '#111111' });
		expect(colorAttrs.className).toContain('blockera-block');

		const withSize = apply(fontSize, '18px', { blocks: withColor.blocks });
		expect(
			findStamp(withSize.blocks, 'page-header-breadcrumbs').block
				.attributes.blockeraFontSize
		).toEqual({ value: '18px' });

		const cleared = apply(color, '', { blocks: withSize.blocks });
		expect(
			findStamp(cleared.blocks, 'page-header-breadcrumbs').block
				.attributes.blockeraFontColor
		).toEqual({ value: '' });
	});

	it('writes color variable objects onto the Blockera attribute', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		];
		const bg = {
			id: 'breadcrumbs-bg-color',
			type: 'color',
			label: 'BG Color',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraBackgroundColor.value',
		};
		const variable = {
			name: 'primary',
			id: 'primary',
			value: '#00ba88',
			type: 'variable',
			var: '--wp--preset--color--primary',
		};
		const result = apply(bg, variable, { blocks });
		expect(
			findStamp(result.blocks, 'page-header-breadcrumbs').block.attributes
				.blockeraBackgroundColor
		).toEqual({ value: variable });
	});

	it('returns null when the control lacks an attributePath', () => {
		const control = { ...CONTROLS.queryPerPage, attributePath: undefined };
		expect(apply(control, 24)).toBeNull();
	});

	it('sets native breadcrumbs attributes (separator and visibility toggles)', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		];
		const separator = {
			id: 'breadcrumbs-separator',
			type: 'input',
			label: 'Separator',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'separator',
			defaultValue: '/',
		};
		const showHome = {
			id: 'breadcrumbs-show-home',
			type: 'toggle',
			label: 'Show home breadcrumb',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'showHomeItem',
			defaultValue: true,
		};

		const withSep = apply(separator, '>', { blocks });
		expect(
			findStamp(withSep.blocks, 'page-header-breadcrumbs').block
				.attributes.separator
		).toBe('>');

		const cleared = apply(separator, '', { blocks: withSep.blocks });
		expect(
			findStamp(cleared.blocks, 'page-header-breadcrumbs').block
				.attributes.separator
		).toBe('');

		const hiddenHome = apply(showHome, false, { blocks: withSep.blocks });
		expect(
			findStamp(hiddenHome.blocks, 'page-header-breadcrumbs').block
				.attributes.showHomeItem
		).toBe(false);
	});
});

describe('setBlockStyle', () => {
	it('swaps is-style-* and preserves other class names', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default',
				{ className: 'blockera-block blockera-block-z3' }
			),
		];
		const control = {
			id: 'breadcrumbs-style',
			type: 'select',
			label: 'Style variation',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const result = apply(control, 'underline', { blocks });
		expect(
			findStamp(result.blocks, 'page-header-breadcrumbs').block.attributes
				.className
		).toBe('blockera-block blockera-block-z3 is-style-underline');
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

describe('placeSection', () => {
	it('moves the inner section using the variant placement', () => {
		const breadcrumb = stamped(
			'core/breadcrumbs',
			'section/page-header-breadcrumbs:default'
		);
		const title = stamped(
			'core/query-title',
			'section/page-header-title:default'
		);
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				title,
				breadcrumb,
			]),
		];
		const control = {
			id: 'breadcrumbs-position',
			type: 'select',
			label: 'Position',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'placeSection',
			defaultValue: 'bottom',
			innerOrder: {
				parentId: 'page-header',
				ids: ['page-header-title', 'page-header-breadcrumbs'],
				leadId: 'page-header-breadcrumbs',
			},
			variants: [
				{
					id: 'top',
					label: 'Top',
					placement: {
						relativeTo: 'page-header',
						position: 'inside-start',
					},
				},
				{
					id: 'bottom',
					label: 'Bottom',
					placement: {
						relativeTo: 'page-header',
						position: 'inside-end',
					},
				},
			],
		};

		const top = apply(control, 'top', { blocks });
		expect(top.blocks[0].innerBlocks[0].name).toBe('core/breadcrumbs');
		expect(top.blocks[0].innerBlocks[1].name).toBe('core/query-title');

		const bottom = apply(control, 'bottom', { blocks: top.blocks });
		expect(bottom.blocks[0].innerBlocks[1].name).toBe('core/breadcrumbs');
	});
});

describe('swapSection reapply toggles', () => {
	beforeAll(() => {
		__setMarkup('page-header-banner', [
			stamped('core/group', 'section/page-header:banner', {}, [
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		]);
		__setMarkup('page-header-title', [
			stamped('core/query-title', 'section/page-header-title:default'),
		]);
	});

	it('re-applies an inner title toggle-off after a design swap', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		];
		const titleToggle = {
			id: 'page-header-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'toggleSection',
			catalogPool: 'page-header-title',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-header-title' },
			],
			insert: { relativeTo: 'page-header', position: 'inside-start' },
		};
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-default' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
			swapHints: { reapplyControls: ['page-header-title'] },
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [design, titleToggle],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		expect(findStamp(result.blocks, 'page-header-title')).toBeNull();
		expect(
			findStamp(result.blocks, 'page-header-description')
		).not.toBeNull();
	});

	it('re-applies breadcrumbs on-state after a design swap using the new pattern order', () => {
		__setMarkup('page-header-breadcrumbs', [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		]);

		const innerOrder = {
			parentId: 'page-header',
			ids: [
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
		};
		const blocks = [
			stamped(
				'core/group',
				'section/page-header:default',
				{
					metadata: {
						blockeraOne: 'section/page-header:default',
						[INNER_ORDER_META_KEY]: [
							'page-header-breadcrumbs',
							'page-header-title',
							'page-header-description',
						],
					},
				},
				[
					stamped(
						'core/breadcrumbs',
						'section/page-header-breadcrumbs:default'
					),
					stamped(
						'core/query-title',
						'section/page-header-title:default'
					),
					stamped(
						'core/term-description',
						'section/page-header-description:default'
					),
				]
			),
		];
		const breadcrumbToggle = {
			id: 'page-header-breadcrumbs',
			type: 'toggle',
			label: 'Breadcrumbs',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'toggleSection',
			variants: [
				{
					id: 'default',
					label: 'Breadcrumbs',
					html: 'page-header-breadcrumbs',
				},
			],
			insert: { relativeTo: 'page-header', position: 'inside-end' },
			innerOrder,
		};
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-default' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
			swapHints: {
				reapplyControls: ['page-header-breadcrumbs'],
			},
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [design, breadcrumbToggle],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		expect(
			result.blocks[0].attributes.metadata[INNER_ORDER_META_KEY]
		).toBeUndefined();
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/query-title',
			'core/term-description',
			'core/breadcrumbs',
		]);
	});

	it('re-applies breadcrumbs attributes and style after a design swap', () => {
		__setMarkup('page-header-breadcrumbs', [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		]);

		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/breadcrumbs',
					'section/page-header-breadcrumbs:default',
					{
						separator: '>',
						showHomeItem: false,
						className: 'blockera-block is-style-underline',
						blockeraFontColor: { value: '#111111' },
						blockeraFontSize: { value: '14px' },
					}
				),
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
			]),
		];
		const breadcrumbToggle = {
			id: 'page-header-breadcrumbs',
			type: 'toggle',
			label: 'Breadcrumbs',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'toggleSection',
			variants: [
				{
					id: 'default',
					label: 'Breadcrumbs',
					html: 'page-header-breadcrumbs',
				},
			],
			insert: { relativeTo: 'page-header', position: 'inside-end' },
		};
		const separator = {
			id: 'breadcrumbs-separator',
			type: 'input',
			label: 'Separator',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'separator',
			defaultValue: '/',
		};
		const showHome = {
			id: 'breadcrumbs-show-home',
			type: 'toggle',
			label: 'Show home',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'showHomeItem',
			defaultValue: true,
		};
		const style = {
			id: 'breadcrumbs-style',
			type: 'select',
			label: 'Style variation',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const color = {
			id: 'breadcrumbs-color',
			type: 'color',
			label: 'Text Color',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
		};
		const fontSize = {
			id: 'breadcrumbs-font-size',
			type: 'input',
			label: 'Font Size',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
		};
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-default' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
			swapHints: {
				reapplyControls: [
					'page-header-breadcrumbs',
					'breadcrumbs-separator',
					'breadcrumbs-show-home',
					'breadcrumbs-style',
					'breadcrumbs-color',
					'breadcrumbs-font-size',
				],
			},
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [
						design,
						breadcrumbToggle,
						separator,
						showHome,
						style,
						color,
						fontSize,
					],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		const crumb = findStamp(result.blocks, 'page-header-breadcrumbs').block;
		expect(crumb.attributes.separator).toBe('>');
		expect(crumb.attributes.showHomeItem).toBe(false);
		expect(crumb.attributes.className).toContain('is-style-underline');
		expect(crumb.attributes.blockeraFontColor).toEqual({
			value: '#111111',
		});
		expect(crumb.attributes.blockeraFontSize).toEqual({ value: '14px' });
	});

	it('re-applies title and description attributes and style after a design swap', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/query-title',
					'section/page-header-title:default',
					{
						className: 'blockera-block is-style-underline',
						blockeraFontColor: { value: '#111111' },
						blockeraBackgroundColor: { value: '#eeeeee' },
						blockeraFontSize: { value: '32px' },
					}
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default',
					{
						className: 'blockera-block is-style-plain',
						blockeraFontColor: { value: '#333333' },
						blockeraBackgroundColor: { value: '#fafafa' },
						blockeraFontSize: { value: '16px' },
					}
				),
			]),
		];
		const titleColor = {
			id: 'title-color',
			type: 'color',
			label: 'Text Color',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
		};
		const titleBg = {
			id: 'title-bg-color',
			type: 'color',
			label: 'BG Color',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraBackgroundColor.value',
		};
		const titleSize = {
			id: 'title-font-size',
			type: 'input',
			label: 'Font Size',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
		};
		const titleStyle = {
			id: 'title-style',
			type: 'select',
			label: 'Style',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const descriptionColor = {
			id: 'description-color',
			type: 'color',
			label: 'Text Color',
			target: { kind: 'section', id: 'page-header-description' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
		};
		const descriptionBg = {
			id: 'description-bg-color',
			type: 'color',
			label: 'BG Color',
			target: { kind: 'section', id: 'page-header-description' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraBackgroundColor.value',
		};
		const descriptionSize = {
			id: 'description-font-size',
			type: 'input',
			label: 'Font Size',
			target: { kind: 'section', id: 'page-header-description' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
		};
		const descriptionStyle = {
			id: 'description-style',
			type: 'select',
			label: 'Style',
			target: { kind: 'section', id: 'page-header-description' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-default' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
			swapHints: {
				reapplyControls: [
					'title-color',
					'title-bg-color',
					'title-font-size',
					'title-style',
					'description-color',
					'description-bg-color',
					'description-font-size',
					'description-style',
				],
			},
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [
						design,
						titleColor,
						titleBg,
						titleSize,
						titleStyle,
						descriptionColor,
						descriptionBg,
						descriptionSize,
						descriptionStyle,
					],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		const title = findStamp(result.blocks, 'page-header-title').block;
		expect(title.attributes.className).toContain('is-style-underline');
		expect(title.attributes.blockeraFontColor).toEqual({
			value: '#111111',
		});
		expect(title.attributes.blockeraBackgroundColor).toEqual({
			value: '#eeeeee',
		});
		expect(title.attributes.blockeraFontSize).toEqual({ value: '32px' });

		const description = findStamp(
			result.blocks,
			'page-header-description'
		).block;
		expect(description.attributes.className).toContain('is-style-plain');
		expect(description.attributes.blockeraFontColor).toEqual({
			value: '#333333',
		});
		expect(description.attributes.blockeraBackgroundColor).toEqual({
			value: '#fafafa',
		});
		expect(description.attributes.blockeraFontSize).toEqual({
			value: '16px',
		});
	});
});

function paginationTree(children) {
	return [
		stamped(
			'core/query-pagination',
			'section/pagination:standard',
			{},
			children
		),
	];
}

function elementsConfig() {
	return {
		type: 'archive',
		filters: ['archive'],
		layoutId: LAYOUT_ID,
		groups: [
			{
				id: 'elements',
				title: 'Elements',
				controls: [
					CONTROLS.paginationPrevious,
					CONTROLS.paginationNumbers,
					CONTROLS.paginationNext,
				],
			},
		],
	};
}

describe('pagination elements and requireAtLeastOneOf', () => {
	it('removes previous without touching next', () => {
		const blocks = paginationTree([
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
		]);
		const result = apply(CONTROLS.paginationPrevious, false, {
			blocks,
			config: elementsConfig(),
		});
		expect(findStamp(result.blocks, 'pagination-previous')).toBeNull();
		expect(findStamp(result.blocks, 'pagination-next')).not.toBeNull();
		expect(findStamp(result.blocks, 'pagination-numbers')).not.toBeNull();
	});

	it('refuses to turn off the last required element', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
		]);
		const result = apply(CONTROLS.paginationNumbers, false, {
			blocks,
			config: elementsConfig(),
		});
		expect(findStamp(result.blocks, 'pagination-numbers')).not.toBeNull();
	});

	it('inserts previous independently of next', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
		]);
		const result = apply(CONTROLS.paginationPrevious, true, {
			blocks,
			config: elementsConfig(),
		});
		expect(findStamp(result.blocks, 'pagination-previous')).not.toBeNull();
		expect(findStamp(result.blocks, 'pagination-next')).toBeNull();
		expect(findStamp(result.blocks, 'pagination-numbers')).not.toBeNull();
	});

	it('writes style onto alsoSetOn companions', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-previous',
				'section/pagination-previous:default',
				{ className: 'blockera-block' }
			),
			stamped(
				'core/query-pagination-next',
				'section/pagination-next:default',
				{ className: 'blockera-block' }
			),
		]);
		const style = {
			id: 'pagination-prev-style',
			type: 'select',
			label: 'Style',
			target: { kind: 'section', id: 'pagination-previous' },
			operation: 'setBlockStyle',
			alsoSetOn: ['pagination-next'],
		};
		const result = apply(style, 'underline', { blocks });
		expect(
			findStamp(result.blocks, 'pagination-previous').block.attributes
				.className
		).toContain('is-style-underline');
		expect(
			findStamp(result.blocks, 'pagination-next').block.attributes
				.className
		).toContain('is-style-underline');
	});
});

describe('mirrorMergeWhen', () => {
	const divider = {
		id: 'pagination-top-divider',
		type: 'border',
		label: 'Top Divider',
		target: { kind: 'section', id: 'pagination' },
		operation: 'setSectionAttribute',
		attributePath: 'blockeraBorder.value',
		borderSide: 'top',
		mirrorMergeWhen: {
			whenControlId: 'pagination-top-spacing',
			mergeKeys: ['padding.top'],
			role: 'divider',
			attributePath: 'blockeraSpacing.value',
		},
	};
	const spacing = {
		id: 'pagination-top-spacing',
		type: 'input',
		label: 'Top Spacing',
		target: { kind: 'section', id: 'pagination' },
		operation: 'setSectionAttribute',
		attributePath: 'blockeraSpacing.value',
		attributeMergeKeys: ['margin.top'],
		mirrorMergeWhen: {
			whenControlId: 'pagination-top-divider',
			mergeKeys: ['padding.top'],
			role: 'spacing',
		},
	};
	const pairConfig = {
		type: 'archive',
		filters: ['archive'],
		layoutId: LAYOUT_ID,
		groups: [
			{
				id: 'design',
				title: 'Design',
				controls: [divider, spacing],
			},
		],
	};

	it('copies spacing into padding.top when a divider is assigned', () => {
		const blocks = [
			stamped('core/query-pagination', 'section/pagination:standard', {
				blockeraBorder: {
					value: {
						type: 'custom',
						top: { width: '1px', style: 'solid', color: '#111' },
					},
				},
			}),
		];
		const result = apply(spacing, '24px', { blocks, config: pairConfig });
		expect(
			findStamp(result.blocks, 'pagination').block.attributes
				.blockeraSpacing.value
		).toEqual(
			expect.objectContaining({
				margin: expect.objectContaining({ top: '24px' }),
				padding: expect.objectContaining({ top: '24px' }),
			})
		);
	});

	it('clears padding.top when the divider is removed', () => {
		const blocks = [
			stamped('core/query-pagination', 'section/pagination:standard', {
				blockeraBorder: {
					value: {
						type: 'custom',
						top: { width: '1px', style: 'solid', color: '#111' },
					},
				},
				blockeraSpacing: {
					value: {
						margin: { top: '24px' },
						padding: { top: '24px' },
					},
				},
			}),
		];
		const result = apply(
			divider,
			{ width: '', style: 'solid', color: '' },
			{ blocks, config: pairConfig }
		);
		expect(
			findStamp(result.blocks, 'pagination').block.attributes
				.blockeraSpacing.value.padding.top
		).toBe('');
	});

	it('does not nest the spacing box into margin.top on listing swap reapply', () => {
		const spacingControl = {
			...spacing,
			id: 'pagination-top-spacing',
		};
		const listing = {
			...CONTROLS.postsTemplate,
			swapHints: {
				preserveQuery: true,
				reapplyControls: ['pagination-top-spacing'],
			},
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'main',
					title: 'Main',
					controls: [listing, spacingControl],
				},
			],
		};
		const blocks = makeBlocks();
		const pagination = findStamp(blocks, 'pagination');
		pagination.block.attributes.blockeraSpacing = {
			value: {
				margin: { top: '24px' },
				padding: { top: '24px' },
			},
		};

		const result = apply(listing, 'grid-2', { blocks, config });
		expect(
			findStamp(result.blocks, 'pagination').block.attributes
				.blockeraSpacing.value.margin.top
		).toBe('24px');
	});
});

describe('pagination labels and midSize', () => {
	it('writes previous and next labels onto the matching inner blocks', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-previous',
				'section/pagination-previous:default'
			),
			stamped(
				'core/query-pagination-next',
				'section/pagination-next:default'
			),
		]);
		const previousLabel = {
			id: 'pagination-previous-label',
			type: 'input',
			label: 'Previous Label',
			target: { kind: 'section', id: 'pagination-previous' },
			operation: 'setSectionAttribute',
			attributePath: 'label',
			defaultValue: '',
		};
		const nextLabel = {
			id: 'pagination-next-label',
			type: 'input',
			label: 'Next Label',
			target: { kind: 'section', id: 'pagination-next' },
			operation: 'setSectionAttribute',
			attributePath: 'label',
			defaultValue: '',
		};

		const withPrev = apply(previousLabel, 'Back', { blocks });
		expect(
			findStamp(withPrev.blocks, 'pagination-previous').block.attributes
				.label
		).toBe('Back');

		const withNext = apply(nextLabel, 'Forward', {
			blocks: withPrev.blocks,
		});
		expect(
			findStamp(withNext.blocks, 'pagination-next').block.attributes.label
		).toBe('Forward');
	});

	it('writes numbers midSize including zero', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
		]);
		const midSize = {
			id: 'pagination-numbers-mid-size',
			type: 'number',
			label: 'Number of links',
			target: { kind: 'section', id: 'pagination-numbers' },
			operation: 'setSectionAttribute',
			attributePath: 'midSize',
			defaultValue: 2,
			min: 0,
			max: 5,
		};

		const result = apply(midSize, 0, { blocks });
		expect(
			findStamp(result.blocks, 'pagination-numbers').block.attributes
				.midSize
		).toBe(0);
	});
});

const LOOP_ITEM_ORDER = {
	parentId: 'loop-item-content',
	bucketParents: ['loop-item-media', 'loop-item-content'],
	ids: [
		'post-featured-image',
		'post-title',
		'post-excerpt',
		'post-content',
		'post-read-more',
		'post-meta',
		'post-meta-2',
	],
};

function fullWidthListing() {
	return [
		stamped('core/query', 'section/posts-listing:full-width', {}, [
			block('core/post-template', {}, [
				block('core/columns', {}, [
					stamped('core/column', 'container/loop-item-media', {}, [
						stamped(
							'core/post-featured-image',
							'section/post-featured-image:default'
						),
					]),
					stamped('core/column', 'container/loop-item-content', {}, [
						stamped(
							'core/post-title',
							'section/post-title:default'
						),
						stamped('core/group', 'section/post-meta:default', {}, [
							stamped(
								'core/post-date',
								'section/post-meta-post-date:default'
							),
						]),
					]),
				]),
			]),
		]),
	];
}

describe('reorderInnerSections buckets', () => {
	it('moves a loop-item across parents and persists both orders', () => {
		const result = apply(
			{
				id: 'reorder-loop-item-content',
				type: 'button',
				label: '',
				target: { kind: 'section', id: 'loop-item-content' },
				operation: 'reorderInnerSections',
				innerOrder: LOOP_ITEM_ORDER,
			},
			{
				move: {
					sectionId: 'post-featured-image',
					toParentId: 'loop-item-content',
					index: 0,
				},
				buckets: [
					{ parentId: 'loop-item-media', ids: [] },
					{
						parentId: 'loop-item-content',
						ids: ['post-featured-image', 'post-title', 'post-meta'],
					},
				],
			},
			{ blocks: fullWidthListing() }
		);
		const media = findStamp(result.blocks, 'loop-item-media').block;
		const content = findStamp(result.blocks, 'loop-item-content').block;
		expect(media.innerBlocks).toEqual([]);
		expect(content.innerBlocks.map((b) => getStamp(b)?.id)).toEqual([
			'post-featured-image',
			'post-title',
			'post-meta',
		]);
		expect(media.attributes.metadata[INNER_ORDER_META_KEY]).toEqual([]);
		expect(content.attributes.metadata[INNER_ORDER_META_KEY]).toEqual([
			'post-featured-image',
			'post-title',
			'post-meta',
		]);
	});
});

describe('toggleSection bucket home', () => {
	it('toggles a media-column item back into media, not content', () => {
		__setMarkup('listing-featured-image', [
			stamped(
				'core/post-featured-image',
				'section/post-featured-image:default'
			),
		]);
		const control = {
			id: 'post-featured-image',
			type: 'toggle',
			label: 'Featured Image',
			target: { kind: 'section', id: 'post-featured-image' },
			operation: 'toggleSection',
			variants: [
				{
					id: 'default',
					label: 'Featured Image',
					html: 'listing-featured-image',
				},
			],
			insert: {
				relativeTo: 'loop-item-content',
				position: 'inside-end',
			},
			innerOrder: LOOP_ITEM_ORDER,
		};
		const off = apply(control, false, { blocks: fullWidthListing() });
		expect(findStamp(off.blocks, 'post-featured-image')).toBeNull();
		const on = apply(control, true, { blocks: off.blocks });
		expect(
			getStamp(findStamp(on.blocks, 'post-featured-image').block)
		).toEqual({
			role: 'section',
			id: 'post-featured-image',
			variant: 'default',
		});
		expect(
			getStamp(
				findStamp(on.blocks, 'loop-item-media').block.innerBlocks[0]
			)?.id
		).toBe('post-featured-image');
	});
});

describe('independent Post Meta instances', () => {
	it('toggling a Meta 2 child does not remove Meta 1 children', () => {
		__setMarkup('meta-2-author', [
			stamped(
				'core/post-author-name',
				'section/post-meta-2-author-name:default'
			),
		]);
		const blocks = [
			stamped('core/group', 'section/post-meta:default', {}, [
				stamped(
					'core/post-date',
					'section/post-meta-post-date:default'
				),
				stamped(
					'core/post-author-name',
					'section/post-meta-author-name:default'
				),
			]),
			stamped('core/group', 'section/post-meta-2:default', {}, [
				stamped(
					'core/post-date',
					'section/post-meta-2-post-date:default'
				),
			]),
		];
		const result = apply(
			{
				id: 'post-meta-2-author-name',
				type: 'toggle',
				label: 'Author Name',
				target: { kind: 'section', id: 'post-meta-2-author-name' },
				operation: 'toggleSection',
				variants: [
					{
						id: 'default',
						label: 'Author',
						html: 'meta-2-author',
					},
				],
				insert: {
					relativeTo: 'post-meta-2',
					position: 'inside-end',
				},
				innerOrder: {
					parentId: 'post-meta-2',
					ids: ['post-meta-2-author-name', 'post-meta-2-post-date'],
				},
			},
			true,
			{ blocks }
		);
		expect(
			findStamp(result.blocks, 'post-meta-author-name')
		).not.toBeNull();
		expect(findStamp(result.blocks, 'post-meta-post-date')).not.toBeNull();
		expect(
			findStamp(result.blocks, 'post-meta-2-author-name')
		).not.toBeNull();
		expect(
			findStamp(result.blocks, 'post-meta-2').block.innerBlocks.map(
				(b) => getStamp(b)?.id
			)
		).toEqual(['post-meta-2-post-date', 'post-meta-2-author-name']);
	});
});
