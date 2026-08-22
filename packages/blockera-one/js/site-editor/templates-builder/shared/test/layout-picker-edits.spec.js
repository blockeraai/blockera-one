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

jest.mock('../controls/layout-picker', () => {
	const { createElement } = require('@wordpress/element');
	return {
		__esModule: true,
		default: ({ editedVariantIds = [] }) =>
			createElement('div', {
				'data-test': 'captured-edits',
				'data-ids': editedVariantIds.join(','),
			}),
	};
});

import { createElement } from '@wordpress/element';
import { render } from '@testing-library/react';

import {
	createSessionBag,
	sessionSwapKey,
	sessionSwapCleanCurrentKey,
	wrapSwapSnapshot,
} from '../../../session';
import { renderControl } from '../panel/render-control';

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

function renderEdits({ blocks, session, entityDirty, value = 'list' } = {}) {
	return render(
		createElement(renderControl, {
			control: CONTROL,
			state: { kind: 'value', value, path: [0] },
			value,
			commonDisabled: false,
			onChangeControl: jest.fn(),
			session,
			entityKey: ENTITY,
			blocks,
			entityDirty,
		})
	);
}

function capturedIds(container) {
	const node = container.querySelector('[data-test="captured-edits"]');
	const raw = node?.getAttribute('data-ids') || '';
	return raw ? raw.split(',') : [];
}

describe('layout picker editedVariantIds', () => {
	it('marks the selected tile only while the entity is dirty vs catalog', () => {
		const { container, rerender } = renderEdits({
			blocks: [DIRTY_NODE],
			session: createSessionBag(),
			entityDirty: true,
		});
		expect(capturedIds(container)).toEqual(['list']);

		rerender(
			createElement(renderControl, {
				control: CONTROL,
				state: { kind: 'value', value: 'list', path: [0] },
				value: 'list',
				commonDisabled: false,
				onChangeControl: jest.fn(),
				session: createSessionBag(),
				entityKey: ENTITY,
				blocks: [DIRTY_NODE],
				entityDirty: false,
			})
		);
		expect(capturedIds(container)).toEqual([]);
	});

	it('does not mark the selected tile when live matches catalog', () => {
		const { container } = renderEdits({
			blocks: [CATALOG_NODE],
			session: createSessionBag(),
			entityDirty: true,
		});
		expect(capturedIds(container)).toEqual([]);
	});

	it('still marks a parked non-current variant from the session bag', () => {
		const session = createSessionBag();
		session.set(
			sessionSwapKey(ENTITY, 'content', 'posts-listing', 'grid-2'),
			wrapSwapSnapshot([DIRTY_NODE], true)
		);
		const { container } = renderEdits({
			blocks: [CATALOG_NODE],
			session,
			entityDirty: false,
		});
		expect(capturedIds(container)).toEqual(['grid-2']);
	});

	it('does not mark a parked variant that was saved before the swap', () => {
		const session = createSessionBag();
		session.set(
			sessionSwapKey(ENTITY, 'content', 'posts-listing', 'grid-2'),
			wrapSwapSnapshot([DIRTY_NODE], false)
		);
		const { container } = renderEdits({
			blocks: [CATALOG_NODE],
			session,
			entityDirty: false,
		});
		expect(capturedIds(container)).toEqual([]);
	});

	it('does not mark the selected tile after restoring a saved (clean) snapshot while the entity is dirty', () => {
		const session = createSessionBag();
		session.set(sessionSwapCleanCurrentKey(ENTITY), {
			sectionId: 'posts-listing',
			variantId: 'list',
		});
		const { container } = renderEdits({
			blocks: [DIRTY_NODE],
			session,
			entityDirty: true,
		});
		expect(capturedIds(container)).toEqual([]);
	});

	it('still marks the selected tile when the clean marker is for another variant', () => {
		const session = createSessionBag();
		session.set(sessionSwapCleanCurrentKey(ENTITY), {
			sectionId: 'posts-listing',
			variantId: 'grid-2',
		});
		const { container } = renderEdits({
			blocks: [DIRTY_NODE],
			session,
			entityDirty: true,
		});
		expect(capturedIds(container)).toEqual(['list']);
	});
});
