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
});

describe('setSectionAttribute', () => {
	it('sets the nested attribute on the detected section', () => {
		const result = apply(CONTROLS.queryPerPage, 24);
		const listing = findStamp(result.blocks, 'posts-listing');
		expect(listing.block.attributes.query.perPage).toBe(24);
	});

	it('returns null when the control lacks an attributePath', () => {
		const control = { ...CONTROLS.queryPerPage, attributePath: undefined };
		expect(apply(control, 24)).toBeNull();
	});
});

describe('unknown operations', () => {
	it('returns null so callers can ignore the change', () => {
		expect(
			apply({ ...CONTROLS.queryPerPage, operation: 'unsupported' }, 1)
		).toBeNull();
	});
});
