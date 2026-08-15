/**
 * element-order.ts: derive list order from the live parent, stored
 * metadata, and remaining config ids.
 */

import {
	INNER_ORDER_META_KEY,
	clearStoredElementOrder,
	getGroupInnerOrder,
	isSortableElementControl,
	normalizeElementOrder,
	persistElementOrder,
	resolveElementOrder,
} from '../element-order';

const RULE = {
	parentId: 'page-title',
	ids: [
		'page-title-title',
		'page-title-description',
		'page-title-breadcrumbs',
	],
};

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

function header(children, extraMeta = {}) {
	return [
		stamped(
			'core/group',
			'section/page-title:default',
			{ metadata: extraMeta },
			children
		),
	];
}

describe('resolveElementOrder', () => {
	it('reads live child stamps and appends missing config ids', () => {
		const blocks = header([
			stamped('core/query-title', 'section/page-title-title:default'),
			stamped(
				'core/term-description',
				'section/page-title-description:default'
			),
		]);
		expect(resolveElementOrder(blocks, RULE)).toEqual([
			'page-title-title',
			'page-title-description',
			'page-title-breadcrumbs',
		]);
	});

	it('follows a custom live order (canvas / previous drag in the tree)', () => {
		const blocks = header([
			stamped(
				'core/breadcrumbs',
				'section/page-title-breadcrumbs:default'
			),
			stamped('core/query-title', 'section/page-title-title:default'),
			stamped(
				'core/term-description',
				'section/page-title-description:default'
			),
		]);
		expect(resolveElementOrder(blocks, RULE)).toEqual([
			'page-title-breadcrumbs',
			'page-title-title',
			'page-title-description',
		]);
	});

	it('prefers stored metadata over the live child order', () => {
		const blocks = header(
			[
				stamped('core/query-title', 'section/page-title-title:default'),
				stamped(
					'core/term-description',
					'section/page-title-description:default'
				),
			],
			{
				[INNER_ORDER_META_KEY]: [
					'page-title-breadcrumbs',
					'page-title-title',
					'page-title-description',
				],
			}
		);
		expect(resolveElementOrder(blocks, RULE)).toEqual([
			'page-title-breadcrumbs',
			'page-title-title',
			'page-title-description',
		]);
	});

	it('falls back to config ids when the parent is missing', () => {
		expect(resolveElementOrder([], RULE)).toEqual(RULE.ids);
	});
});

describe('normalizeElementOrder', () => {
	it('dedupes, drops unknown ids, and appends missing config ids', () => {
		expect(
			normalizeElementOrder(
				['page-title-breadcrumbs', 'page-title-breadcrumbs', 'nope'],
				RULE.ids
			)
		).toEqual([
			'page-title-breadcrumbs',
			'page-title-title',
			'page-title-description',
		]);
	});
});

describe('persistElementOrder / clearStoredElementOrder', () => {
	it('writes and clears metadata.blockeraOneInnerOrder on the parent', () => {
		const blocks = header([
			stamped('core/query-title', 'section/page-title-title:default'),
		]);
		const ordered = [
			'page-title-description',
			'page-title-title',
			'page-title-breadcrumbs',
		];
		const persisted = persistElementOrder(blocks, 'page-title', ordered);
		expect(persisted[0].attributes.metadata[INNER_ORDER_META_KEY]).toEqual(
			ordered
		);
		expect(resolveElementOrder(persisted, RULE)).toEqual(ordered);

		const cleared = clearStoredElementOrder(persisted, 'page-title');
		expect(
			cleared[0].attributes.metadata[INNER_ORDER_META_KEY]
		).toBeUndefined();
		expect(resolveElementOrder(cleared, RULE)).toEqual([
			'page-title-title',
			'page-title-description',
			'page-title-breadcrumbs',
		]);
	});
});

describe('group helpers', () => {
	it('reads innerOrder from the first sortable control', () => {
		expect(
			getGroupInnerOrder({
				id: 'elements',
				title: 'Elements',
				sortable: true,
				controls: [
					{
						id: 'page-title-title',
						type: 'toggle',
						label: 'Title',
						target: { kind: 'section', id: 'page-title-title' },
						operation: 'toggleSection',
						innerOrder: RULE,
						nestedPanel: {
							id: 'title',
							title: 'Title',
							groups: [],
						},
					},
				],
			})
		).toEqual(RULE);
	});

	it('detects toggle + nestedPanel + innerOrder rows', () => {
		expect(
			isSortableElementControl({
				id: 'page-title-title',
				type: 'toggle',
				label: 'Title',
				target: { kind: 'section', id: 'page-title-title' },
				operation: 'toggleSection',
				innerOrder: RULE,
				nestedPanel: { id: 'title', title: 'Title', groups: [] },
			})
		).toBe(true);
		expect(
			isSortableElementControl({
				id: 'page-header-gap',
				type: 'input',
				label: 'Gap',
				target: { kind: 'section', id: 'page-title' },
				operation: 'setSectionAttribute',
			})
		).toBe(false);
	});
});
