/**
 * Site Editor session bag, keys, tree compare, and id remap.
 */

import {
	createSessionBag,
	clearSwapCleanCurrent,
	getVisitSession,
	readSwapCleanCurrent,
	remapVolatileIds,
	resetVisitSession,
	sessionEntityKey,
	sessionSwapKey,
	setSwapCleanCurrent,
	swapCleanCurrentMatches,
	treesMatchIgnoringVolatileIds,
} from '..';

describe('createSessionBag', () => {
	it('clones on write and read and delete removes the key', () => {
		const bag = createSessionBag();
		const tree = [
			{ name: 'core/group', attributes: { x: 1 }, innerBlocks: [] },
		];
		bag.set('k', tree);
		tree[0].attributes.x = 2;
		expect(bag.get('k')[0].attributes.x).toBe(1);
		const read = bag.get('k');
		read[0].attributes.x = 3;
		expect(bag.get('k')[0].attributes.x).toBe(1);
		bag.delete('k');
		expect(bag.get('k')).toBeUndefined();
	});

	it('ensure does not overwrite', () => {
		const bag = createSessionBag();
		bag.ensure('k', [1]);
		bag.ensure('k', [2]);
		expect(bag.get('k')).toEqual([1]);
	});
});

describe('getVisitSession', () => {
	afterEach(() => {
		resetVisitSession();
	});

	it('persists without a React provider', () => {
		const a = getVisitSession();
		a.set('k', { n: 1 });
		expect(getVisitSession().get('k')).toEqual({ n: 1 });
		resetVisitSession();
		expect(getVisitSession().get('k')).toBeUndefined();
	});
});

describe('sessionEntityKey', () => {
	it('isolates template ids', () => {
		expect(sessionEntityKey('wp_template', 10)).toBe('wp_template:10');
		expect(sessionEntityKey('wp_template', 11)).toBe('wp_template:11');
		expect(
			sessionSwapKey(
				'wp_template:10',
				'page-header',
				'page-header',
				'banner'
			)
		).not.toBe(
			sessionSwapKey(
				'wp_template:11',
				'page-header',
				'page-header',
				'banner'
			)
		);
	});
});

describe('treesMatchIgnoringVolatileIds', () => {
	it('ignores clientId and Blockera instance ids', () => {
		const a = [
			{
				name: 'core/group',
				clientId: 'a',
				attributes: {
					blockeraPropsId: '1',
					blockeraCompatId: '1',
					className: 'blockera-block blockera-block-1 wp-block-group',
					layout: { type: 'flex' },
				},
				innerBlocks: [],
			},
		];
		const b = [
			{
				name: 'core/group',
				clientId: 'b',
				attributes: {
					blockeraPropsId: '2',
					blockeraCompatId: '2',
					className: 'wp-block-group',
					layout: { type: 'flex' },
				},
				innerBlocks: [],
			},
		];
		expect(treesMatchIgnoringVolatileIds(a, b)).toBe(true);
		b[0].attributes.layout = { type: 'constrained' };
		expect(treesMatchIgnoringVolatileIds(a, b)).toBe(false);
	});

	it('ignores pattern metadata and empty style collections', () => {
		const live = [
			{
				name: 'core/group',
				attributes: {
					metadata: {
						name: 'Single Page Header',
						patternName:
							'blockera-one/builder-single-page-header-simple',
						categories: ['blockera-one/template-builder'],
						description:
							'Simple single page header with post title and excerpt.',
						blockeraOne: { stamp: 'section/page-header:simple' },
					},
					layout: { type: 'flex' },
				},
				innerBlocks: [
					{
						name: 'core/post-title',
						attributes: { style: { color: {}, typography: {} } },
						innerBlocks: [],
					},
				],
			},
		];
		const catalog = [
			{
				name: 'core/group',
				attributes: {
					metadata: {
						name: 'Page Header',
						blockeraOne: { stamp: 'section/page-header:simple' },
					},
					layout: { type: 'flex' },
				},
				innerBlocks: [
					{
						name: 'core/post-title',
						attributes: { style: { color: [], typography: [] } },
						innerBlocks: [],
					},
				],
			},
		];
		expect(treesMatchIgnoringVolatileIds(live, catalog)).toBe(true);
		live[0].attributes.layout = { type: 'constrained' };
		expect(treesMatchIgnoringVolatileIds(live, catalog)).toBe(false);
	});

	it('ignores query loop envelope differences', () => {
		const live = [
			{
				name: 'core/query',
				attributes: {
					query: { perPage: 9, inherit: true },
					queryId: 3,
					align: 'full',
				},
				innerBlocks: [],
			},
		];
		const catalog = [
			{
				name: 'core/query',
				attributes: {
					query: { perPage: 10, inherit: true },
					queryId: 1,
					align: 'full',
				},
				innerBlocks: [],
			},
		];
		expect(treesMatchIgnoringVolatileIds(live, catalog)).toBe(true);
		live[0].attributes.align = 'wide';
		expect(treesMatchIgnoringVolatileIds(live, catalog)).toBe(false);
	});

	it('ignores reapplied pagination wrappers', () => {
		const pagination = {
			name: 'core/query-pagination',
			attributes: {
				metadata: {
					blockeraOne: { stamp: 'section/pagination:standard' },
				},
			},
			innerBlocks: [],
		};
		const live = [
			{
				name: 'core/query',
				attributes: { align: 'wide' },
				innerBlocks: [
					{
						name: 'core/post-template',
						attributes: {},
						innerBlocks: [],
					},
					{
						name: 'core/group',
						attributes: {
							style: { spacing: { padding: { top: '60px' } } },
						},
						innerBlocks: [pagination],
					},
				],
			},
		];
		const catalog = [
			{
				name: 'core/query',
				attributes: { align: 'wide' },
				innerBlocks: [
					{
						name: 'core/post-template',
						attributes: {},
						innerBlocks: [],
					},
					{
						name: 'core/group',
						attributes: {
							style: { spacing: { padding: { top: '40px' } } },
						},
						innerBlocks: [pagination],
					},
				],
			},
		];
		expect(treesMatchIgnoringVolatileIds(live, catalog)).toBe(false);
		expect(
			treesMatchIgnoringVolatileIds(live, catalog, {
				ignoreStampIds: ['pagination'],
			})
		).toBe(true);
	});
});

describe('remapVolatileIds', () => {
	it('assigns new clientIds and Blockera ids', () => {
		const tree = [
			{
				name: 'core/group',
				clientId: 'old',
				attributes: {
					blockeraPropsId: 'old',
					blockeraCompatId: 'old',
					className: 'blockera-block blockera-block-old',
				},
				innerBlocks: [
					{
						name: 'core/paragraph',
						clientId: 'child',
						attributes: {},
						innerBlocks: [],
					},
				],
			},
		];
		const next = remapVolatileIds(tree);
		expect(next[0].clientId).not.toBe('old');
		expect(next[0].attributes.blockeraPropsId).not.toBe('old');
		expect(next[0].innerBlocks[0].clientId).not.toBe('child');
		expect(next[0].clientId).not.toBe(next[0].innerBlocks[0].clientId);
	});
});

describe('swap clean-current marker', () => {
	it('stores, matches, and clears the current clean restore', () => {
		const session = createSessionBag();
		setSwapCleanCurrent(session, 'ent', 'posts-listing', 'list', false);
		expect(readSwapCleanCurrent(session, 'ent')).toEqual({
			sectionId: 'posts-listing',
			variantId: 'list',
		});
		expect(
			swapCleanCurrentMatches(
				readSwapCleanCurrent(session, 'ent'),
				'posts-listing',
				'list'
			)
		).toBe(true);
		expect(
			swapCleanCurrentMatches(
				readSwapCleanCurrent(session, 'ent'),
				'posts-listing',
				'grid-2'
			)
		).toBe(false);
		setSwapCleanCurrent(session, 'ent', 'posts-listing', 'list', true);
		expect(readSwapCleanCurrent(session, 'ent')).toBeUndefined();
		setSwapCleanCurrent(session, 'ent', 'posts-listing', 'list', false);
		clearSwapCleanCurrent(session, 'ent');
		expect(readSwapCleanCurrent(session, 'ent')).toBeUndefined();
	});
});
