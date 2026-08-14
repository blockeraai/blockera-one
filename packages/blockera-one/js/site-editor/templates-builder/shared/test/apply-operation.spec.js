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
import { getStamp } from '../metadata';
import { findByStamp } from '../tree';

const LAYOUT_ID = 'archive-body';

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
	__setMarkup('pagination-next-prev', [
		stamped('core/query-pagination', 'section/pagination:next-prev'),
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
	{ id: 'next-prev', label: 'Next/Prev', html: 'pagination-next-prev' },
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
			reapplyControls: ['pagination-type'],
		},
	},
	paginationType: {
		id: 'pagination-type',
		type: 'segmented',
		label: 'Pagination',
		target: { kind: 'section', id: 'pagination' },
		operation: 'swapSection',
		variants: PAGINATION_VARIANTS,
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
								'section/pagination:next-prev'
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
	it('swaps the listing and re-applies dependent non-default sections', () => {
		// Pagination currently uses next-prev (non-default); the grid markup
		// ships with standard pagination inside — the hint restores it.
		const result = apply(CONTROLS.postsTemplate, 'grid-2');

		const listing = findStamp(result.blocks, 'posts-listing');
		expect(getStamp(listing.block).variant).toBe('grid-2');

		const pagination = findStamp(result.blocks, 'pagination');
		expect(getStamp(pagination.block).variant).toBe('next-prev');
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

	it('reorders inner sections so a restored title stays after top breadcrumbs', () => {
		__setMarkup('page-title-title', [
			stamped('core/query-title', 'section/page-title-title:default'),
		]);
		const blocks = [
			stamped('core/group', 'section/page-title:default', {}, [
				stamped(
					'core/breadcrumbs',
					'section/page-title-breadcrumbs:default'
				),
				stamped(
					'core/term-description',
					'section/page-title-description:default'
				),
			]),
		];
		const control = {
			id: 'page-title-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-title-title' },
			operation: 'toggleSection',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-title-title' },
			],
			insert: { relativeTo: 'page-title', position: 'inside-start' },
			innerOrder: {
				parentId: 'page-title',
				ids: [
					'page-title-title',
					'page-title-description',
					'page-title-breadcrumbs',
				],
				leadId: 'page-title-breadcrumbs',
			},
		};

		const result = apply(control, true, { blocks });
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/breadcrumbs',
			'core/query-title',
			'core/term-description',
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
			stamped('core/group', 'section/page-title:default', {}),
		];
		const control = {
			id: 'page-header-gap',
			type: 'input',
			label: 'Items Spacing',
			target: { kind: 'section', id: 'page-title' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		expect(
			findStamp(result.blocks, 'page-title').block.attributes.blockeraGap
				.value
		).toEqual(gapValue);
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
				'section/page-title-breadcrumbs:default',
				{ className: 'is-style-underline' }
			),
		];
		const control = {
			id: 'breadcrumbs-gap',
			type: 'input',
			label: 'Gap',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		const attrs = findStamp(result.blocks, 'page-title-breadcrumbs').block
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
				'section/page-title-breadcrumbs:default'
			),
		];
		const color = {
			id: 'breadcrumbs-color',
			type: 'color',
			label: 'Text Color',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
		};
		const fontSize = {
			id: 'breadcrumbs-font-size',
			type: 'input',
			label: 'Font Size',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
		};

		const withColor = apply(color, '#111111', { blocks });
		const colorAttrs = findStamp(withColor.blocks, 'page-title-breadcrumbs')
			.block.attributes;
		expect(colorAttrs.blockeraFontColor).toEqual({ value: '#111111' });
		expect(colorAttrs.className).toContain('blockera-block');

		const withSize = apply(fontSize, '18px', { blocks: withColor.blocks });
		expect(
			findStamp(withSize.blocks, 'page-title-breadcrumbs').block
				.attributes.blockeraFontSize
		).toEqual({ value: '18px' });

		const cleared = apply(color, '', { blocks: withSize.blocks });
		expect(
			findStamp(cleared.blocks, 'page-title-breadcrumbs').block.attributes
				.blockeraFontColor
		).toEqual({ value: '' });
	});

	it('writes color variable objects onto the Blockera attribute', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-title-breadcrumbs:default'
			),
		];
		const bg = {
			id: 'breadcrumbs-bg-color',
			type: 'color',
			label: 'BG Color',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
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
			findStamp(result.blocks, 'page-title-breadcrumbs').block.attributes
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
				'section/page-title-breadcrumbs:default'
			),
		];
		const separator = {
			id: 'breadcrumbs-separator',
			type: 'input',
			label: 'Separator',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'separator',
			defaultValue: '/',
		};
		const showHome = {
			id: 'breadcrumbs-show-home',
			type: 'toggle',
			label: 'Show home breadcrumb',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'showHomeItem',
			defaultValue: true,
		};

		const withSep = apply(separator, '>', { blocks });
		expect(
			findStamp(withSep.blocks, 'page-title-breadcrumbs').block.attributes
				.separator
		).toBe('>');

		const cleared = apply(separator, '', { blocks: withSep.blocks });
		expect(
			findStamp(cleared.blocks, 'page-title-breadcrumbs').block.attributes
				.separator
		).toBe('');

		const hiddenHome = apply(showHome, false, { blocks: withSep.blocks });
		expect(
			findStamp(hiddenHome.blocks, 'page-title-breadcrumbs').block
				.attributes.showHomeItem
		).toBe(false);
	});
});

describe('setBlockStyle', () => {
	it('swaps is-style-* and preserves other class names', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-title-breadcrumbs:default',
				{ className: 'blockera-block blockera-block-z3' }
			),
		];
		const control = {
			id: 'breadcrumbs-style',
			type: 'select',
			label: 'Style variation',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const result = apply(control, 'underline', { blocks });
		expect(
			findStamp(result.blocks, 'page-title-breadcrumbs').block.attributes
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
					target: { kind: 'section', id: 'page-title-breadcrumbs' },
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
			'section/page-title-breadcrumbs:default'
		);
		const title = stamped(
			'core/query-title',
			'section/page-title-title:default'
		);
		const blocks = [
			stamped('core/group', 'section/page-title:default', {}, [
				title,
				breadcrumb,
			]),
		];
		const control = {
			id: 'breadcrumbs-position',
			type: 'segmented-choice',
			label: 'Position',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'placeSection',
			defaultValue: 'bottom',
			innerOrder: {
				parentId: 'page-title',
				ids: ['page-title-title', 'page-title-breadcrumbs'],
				leadId: 'page-title-breadcrumbs',
			},
			variants: [
				{
					id: 'top',
					label: 'Top',
					placement: {
						relativeTo: 'page-title',
						position: 'inside-start',
					},
				},
				{
					id: 'bottom',
					label: 'Bottom',
					placement: {
						relativeTo: 'page-title',
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
		__setMarkup('page-title-banner', [
			stamped('core/group', 'section/page-title:banner', {}, [
				stamped('core/query-title', 'section/page-title-title:default'),
				stamped(
					'core/term-description',
					'section/page-title-description:default'
				),
			]),
		]);
		__setMarkup('page-title-title', [
			stamped('core/query-title', 'section/page-title-title:default'),
		]);
	});

	it('re-applies an inner title toggle-off after a design swap', () => {
		const blocks = [
			stamped('core/group', 'section/page-title:default', {}, [
				stamped(
					'core/term-description',
					'section/page-title-description:default'
				),
			]),
		];
		const titleToggle = {
			id: 'page-title-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-title-title' },
			operation: 'toggleSection',
			catalogPool: 'page-title-title',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-title-title' },
			],
			insert: { relativeTo: 'page-title', position: 'inside-start' },
		};
		const design = {
			id: 'page-title-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-title' },
			operation: 'swapSection',
			variants: [
				{ id: 'default', label: 'Simple', html: 'page-title-default' },
				{ id: 'banner', label: 'Banner', html: 'page-title-banner' },
			],
			swapHints: { reapplyControls: ['page-title-title'] },
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
		expect(findStamp(result.blocks, 'page-title-title')).toBeNull();
		expect(
			findStamp(result.blocks, 'page-title-description')
		).not.toBeNull();
	});

	it('re-applies breadcrumbs on-state and top position after a design swap', () => {
		__setMarkup('page-title-breadcrumbs', [
			stamped(
				'core/breadcrumbs',
				'section/page-title-breadcrumbs:default'
			),
		]);

		const blocks = [
			stamped('core/group', 'section/page-title:default', {}, [
				stamped(
					'core/breadcrumbs',
					'section/page-title-breadcrumbs:default'
				),
				stamped('core/query-title', 'section/page-title-title:default'),
				stamped(
					'core/term-description',
					'section/page-title-description:default'
				),
			]),
		];
		const innerOrder = {
			parentId: 'page-title',
			ids: [
				'page-title-title',
				'page-title-description',
				'page-title-breadcrumbs',
			],
			leadId: 'page-title-breadcrumbs',
		};
		const breadcrumbToggle = {
			id: 'page-title-breadcrumbs',
			type: 'toggle',
			label: 'Breadcrumbs',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'toggleSection',
			variants: [
				{
					id: 'default',
					label: 'Breadcrumbs',
					html: 'page-title-breadcrumbs',
				},
			],
			insert: { relativeTo: 'page-title', position: 'inside-end' },
			innerOrder,
		};
		const position = {
			id: 'breadcrumbs-position',
			type: 'segmented-choice',
			label: 'Position',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'placeSection',
			defaultValue: 'bottom',
			innerOrder,
			variants: [
				{
					id: 'top',
					label: 'Top',
					placement: {
						relativeTo: 'page-title',
						position: 'inside-start',
					},
				},
				{
					id: 'bottom',
					label: 'Bottom',
					placement: {
						relativeTo: 'page-title',
						position: 'inside-end',
					},
				},
			],
		};
		const design = {
			id: 'page-title-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-title' },
			operation: 'swapSection',
			variants: [
				{ id: 'default', label: 'Simple', html: 'page-title-default' },
				{ id: 'banner', label: 'Banner', html: 'page-title-banner' },
			],
			swapHints: {
				reapplyControls: [
					'page-title-breadcrumbs',
					'breadcrumbs-position',
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
					controls: [design, breadcrumbToggle, position],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		const names = result.blocks[0].innerBlocks.map((b) => b.name);
		expect(names[0]).toBe('core/breadcrumbs');
		expect(names).toContain('core/query-title');
		expect(names).toContain('core/term-description');
	});

	it('re-applies breadcrumbs attributes and style after a design swap', () => {
		__setMarkup('page-title-breadcrumbs', [
			stamped(
				'core/breadcrumbs',
				'section/page-title-breadcrumbs:default'
			),
		]);

		const blocks = [
			stamped('core/group', 'section/page-title:default', {}, [
				stamped(
					'core/breadcrumbs',
					'section/page-title-breadcrumbs:default',
					{
						separator: '>',
						showHomeItem: false,
						className: 'blockera-block is-style-underline',
						blockeraFontColor: { value: '#111111' },
						blockeraFontSize: { value: '14px' },
					}
				),
				stamped('core/query-title', 'section/page-title-title:default'),
			]),
		];
		const breadcrumbToggle = {
			id: 'page-title-breadcrumbs',
			type: 'toggle',
			label: 'Breadcrumbs',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'toggleSection',
			variants: [
				{
					id: 'default',
					label: 'Breadcrumbs',
					html: 'page-title-breadcrumbs',
				},
			],
			insert: { relativeTo: 'page-title', position: 'inside-end' },
		};
		const separator = {
			id: 'breadcrumbs-separator',
			type: 'input',
			label: 'Separator',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'separator',
			defaultValue: '/',
		};
		const showHome = {
			id: 'breadcrumbs-show-home',
			type: 'toggle',
			label: 'Show home',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'showHomeItem',
			defaultValue: true,
		};
		const style = {
			id: 'breadcrumbs-style',
			type: 'select',
			label: 'Style variation',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const color = {
			id: 'breadcrumbs-color',
			type: 'color',
			label: 'Text Color',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
		};
		const fontSize = {
			id: 'breadcrumbs-font-size',
			type: 'input',
			label: 'Font Size',
			target: { kind: 'section', id: 'page-title-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
		};
		const design = {
			id: 'page-title-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-title' },
			operation: 'swapSection',
			variants: [
				{ id: 'default', label: 'Simple', html: 'page-title-default' },
				{ id: 'banner', label: 'Banner', html: 'page-title-banner' },
			],
			swapHints: {
				reapplyControls: [
					'page-title-breadcrumbs',
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
		const crumb = findStamp(result.blocks, 'page-title-breadcrumbs').block;
		expect(crumb.attributes.separator).toBe('>');
		expect(crumb.attributes.showHomeItem).toBe(false);
		expect(crumb.attributes.className).toContain('is-style-underline');
		expect(crumb.attributes.blockeraFontColor).toEqual({
			value: '#111111',
		});
		expect(crumb.attributes.blockeraFontSize).toEqual({ value: '14px' });
	});
});
