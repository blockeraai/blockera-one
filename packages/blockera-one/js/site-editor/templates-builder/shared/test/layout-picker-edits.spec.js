/**
 * Selected layout tiles stay clean after Save: catalog mismatch is not
 * enough without unsaved entity edits. Parked session snapshots still mark
 * non-current tiles.
 */

jest.mock('../blocks-adapter', () => {
	const catalog = [
		{
			name: 'core/group',
			attributes: { layout: 'catalog' },
			innerBlocks: [],
		},
	];
	return {
		defaultOpsContext: {
			parse: (html) =>
				html === 'catalog-html'
					? JSON.parse(JSON.stringify(catalog))
					: [],
			serialize: () => '',
		},
	};
});

import {
	createSessionBag,
	sessionSwapKey,
	sessionSwapCleanCurrentKey,
	wrapSwapSnapshot,
} from '../../../session';
import { editedVariantIds } from '../panel/layout-picker-edits';

const ENTITY = 'wp_template:blockera-one//archive';
const CATALOG_NODE = {
	name: 'core/group',
	attributes: { layout: 'catalog' },
	innerBlocks: [],
};
const DIRTY_NODE = {
	name: 'core/group',
	attributes: { layout: 'custom' },
	innerBlocks: [],
};

const CONTROL = {
	id: 'posts-template',
	type: 'layout-picker',
	operation: 'swapSection',
	target: { kind: 'section', id: 'posts-listing' },
	innerOrder: { within: 'content' },
	variants: [
		{ id: 'list', label: 'List', html: 'catalog-html' },
		{ id: 'grid-2', label: '2 Columns', html: 'catalog-html' },
	],
};

const STATE = { kind: 'value', value: 'list', path: [0] };

function ids({ blocks, session, entityDirty, value = 'list' } = {}) {
	return editedVariantIds(
		CONTROL,
		value,
		STATE,
		session,
		ENTITY,
		blocks,
		entityDirty
	);
}

describe('layout picker editedVariantIds', () => {
	it('marks the selected tile only while the entity is dirty vs catalog', () => {
		expect(
			ids({
				blocks: [DIRTY_NODE],
				session: createSessionBag(),
				entityDirty: true,
			})
		).toEqual(['list']);

		expect(
			ids({
				blocks: [DIRTY_NODE],
				session: createSessionBag(),
				entityDirty: false,
			})
		).toEqual([]);
	});

	it('does not mark the selected tile when live matches catalog', () => {
		expect(
			ids({
				blocks: [CATALOG_NODE],
				session: createSessionBag(),
				entityDirty: true,
			})
		).toEqual([]);
	});

	it('still marks a parked non-current variant from the session bag', () => {
		const session = createSessionBag();
		session.set(
			sessionSwapKey(ENTITY, 'content', 'posts-listing', 'grid-2'),
			wrapSwapSnapshot([DIRTY_NODE], true)
		);
		expect(
			ids({
				blocks: [CATALOG_NODE],
				session,
				entityDirty: false,
			})
		).toEqual(['grid-2']);
	});

	it('does not mark a parked variant that was saved before the swap', () => {
		const session = createSessionBag();
		session.set(
			sessionSwapKey(ENTITY, 'content', 'posts-listing', 'grid-2'),
			wrapSwapSnapshot([DIRTY_NODE], false)
		);
		expect(
			ids({
				blocks: [CATALOG_NODE],
				session,
				entityDirty: false,
			})
		).toEqual([]);
	});

	it('does not mark the selected tile after restoring a saved (clean) snapshot while the entity is dirty', () => {
		const session = createSessionBag();
		session.set(sessionSwapCleanCurrentKey(ENTITY), {
			sectionId: 'posts-listing',
			variantId: 'list',
		});
		expect(
			ids({
				blocks: [DIRTY_NODE],
				session,
				entityDirty: true,
			})
		).toEqual([]);
	});

	it('still marks the selected tile when the clean marker is for another variant', () => {
		const session = createSessionBag();
		session.set(sessionSwapCleanCurrentKey(ENTITY), {
			sectionId: 'posts-listing',
			variantId: 'grid-2',
		});
		expect(
			ids({
				blocks: [DIRTY_NODE],
				session,
				entityDirty: true,
			})
		).toEqual(['list']);
	});
});
