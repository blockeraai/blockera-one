/**
 * tree.ts + op-context.ts: immutable block-tree helpers and the placement
 * helpers built on them. All fixtures are internal — no theme content.
 */

import {
	cloneTree,
	findByStamp,
	findByStampWithin,
	findBlockByClientId,
	getAtPath,
	insertRelative,
	mergeUserAttributes,
	pickBlockeraExtensionAttributes,
	pickUserAttributes,
	removeAtPath,
	replaceAtPath,
	replaceNodeWithBlocks,
	walkBlocks,
} from '../tree';
import {
	ensureInnerContainer,
	insertAtPlacement,
	replaceSectionAtPath,
} from '../op-context';
import { block, stamped } from './helpers/block-fixtures';

/** [group[p1, group[p2]], p3] — small nested tree reused across cases. */
function makeTree() {
	return [
		block('core/group', { tagName: 'main' }, [
			block('core/paragraph', { content: 'p1' }),
			block('core/group', { className: 'inner' }, [
				block('core/paragraph', { content: 'p2' }),
			]),
		]),
		block('core/paragraph', { content: 'p3' }),
	];
}

describe('cloneTree', () => {
	it('deep clones blocks so mutations never leak back', () => {
		const original = makeTree();
		const clone = cloneTree(original);

		expect(clone).toEqual(original);
		clone[0].attributes.tagName = 'div';
		clone[0].innerBlocks[0].attributes.content = 'mutated';
		clone[0].innerBlocks.push(block('core/spacer'));

		expect(original[0].attributes.tagName).toBe('main');
		expect(original[0].innerBlocks[0].attributes.content).toBe('p1');
		expect(original[0].innerBlocks).toHaveLength(2);
	});

	it('normalizes missing attributes/innerBlocks to empty containers', () => {
		const clone = cloneTree([{ name: 'core/spacer' }]);
		expect(clone[0].attributes).toEqual({});
		expect(clone[0].innerBlocks).toEqual([]);
	});
});

describe('getAtPath', () => {
	const tree = makeTree();

	it('resolves root and nested paths', () => {
		expect(getAtPath(tree, [1]).attributes.content).toBe('p3');
		expect(getAtPath(tree, [0, 1, 0]).attributes.content).toBe('p2');
	});

	it('returns null for empty or out-of-range paths', () => {
		expect(getAtPath(tree, [])).toBeNull();
		expect(getAtPath(tree, [5])).toBeNull();
		expect(getAtPath(tree, [0, 9])).toBeNull();
		expect(getAtPath(tree, [1, 0])).toBeNull();
	});
});

describe('replaceAtPath', () => {
	it('replaces at the root level and keeps sibling references', () => {
		const tree = makeTree();
		const next = block('core/spacer');
		const result = replaceAtPath(tree, [1], next);

		expect(result[1]).toBe(next);
		// Untouched siblings keep identity (no needless re-allocation).
		expect(result[0]).toBe(tree[0]);
		expect(tree[1].name).toBe('core/paragraph');
	});

	it('replaces nested nodes without mutating the input', () => {
		const tree = makeTree();
		const result = replaceAtPath(
			tree,
			[0, 1, 0],
			block('core/heading', { content: 'h' })
		);

		expect(getAtPath(result, [0, 1, 0]).name).toBe('core/heading');
		expect(getAtPath(tree, [0, 1, 0]).name).toBe('core/paragraph');
	});

	it('returns [next] for an empty path', () => {
		const next = block('core/spacer');
		expect(replaceAtPath(makeTree(), [], next)).toEqual([next]);
	});
});

describe('removeAtPath', () => {
	it('removes root and nested nodes immutably', () => {
		const tree = makeTree();

		const rootRemoved = removeAtPath(tree, [0]);
		expect(rootRemoved).toHaveLength(1);
		expect(rootRemoved[0].attributes.content).toBe('p3');

		const nestedRemoved = removeAtPath(tree, [0, 1, 0]);
		expect(getAtPath(nestedRemoved, [0, 1]).innerBlocks).toHaveLength(0);
		expect(getAtPath(tree, [0, 1]).innerBlocks).toHaveLength(1);
	});

	it('is a no-op for an empty path', () => {
		const tree = makeTree();
		expect(removeAtPath(tree, [])).toBe(tree);
	});
});

describe('replaceNodeWithBlocks', () => {
	it('replaces one node with several siblings at root level', () => {
		const tree = makeTree();
		const result = replaceNodeWithBlocks(
			tree,
			[1],
			[block('core/spacer'), block('core/separator')]
		);

		expect(result.map((b) => b.name)).toEqual([
			'core/group',
			'core/spacer',
			'core/separator',
		]);
	});

	it('replaces nested nodes and returns replacements for empty path', () => {
		const tree = makeTree();
		const result = replaceNodeWithBlocks(
			tree,
			[0, 0],
			[block('core/heading'), block('core/quote')]
		);
		expect(getAtPath(result, [0]).innerBlocks.map((b) => b.name)).toEqual([
			'core/heading',
			'core/quote',
			'core/group',
		]);

		const swap = [block('core/spacer')];
		expect(replaceNodeWithBlocks(tree, [], swap)).toBe(swap);
	});
});

describe('insertRelative', () => {
	const inserted = [block('core/spacer', { id: 'new' })];

	it('inserts before/after a root-level node', () => {
		const before = insertRelative(makeTree(), [1], 'before', inserted);
		expect(before.map((b) => b.name)).toEqual([
			'core/group',
			'core/spacer',
			'core/paragraph',
		]);

		const after = insertRelative(makeTree(), [0], 'after', inserted);
		expect(after.map((b) => b.name)).toEqual([
			'core/group',
			'core/spacer',
			'core/paragraph',
		]);
	});

	it('inserts before/after a nested node', () => {
		const result = insertRelative(makeTree(), [0, 1], 'before', inserted);
		expect(getAtPath(result, [0]).innerBlocks.map((b) => b.name)).toEqual([
			'core/paragraph',
			'core/spacer',
			'core/group',
		]);
	});

	it('inserts inside-start / inside-end of the target', () => {
		const start = insertRelative(makeTree(), [0], 'inside-start', inserted);
		expect(getAtPath(start, [0, 0]).name).toBe('core/spacer');

		const end = insertRelative(makeTree(), [0], 'inside-end', inserted);
		expect(getAtPath(end, [0, 2]).name).toBe('core/spacer');
	});

	it('prepends/appends at the root for an empty path', () => {
		expect(insertRelative(makeTree(), [], 'before', inserted)[0].name).toBe(
			'core/spacer'
		);
		expect(insertRelative(makeTree(), [], 'after', inserted)[2].name).toBe(
			'core/spacer'
		);
	});

	it('returns the tree unchanged when the inside target is missing', () => {
		const tree = makeTree();
		expect(insertRelative(tree, [9], 'inside-end', inserted)).toBe(tree);
	});
});

describe('walkBlocks', () => {
	it('visits blocks depth-first pre-order with absolute paths', () => {
		const visited = [];
		walkBlocks(makeTree(), (node, path) => {
			visited.push([node.name, path.join('.')]);
		});

		expect(visited).toEqual([
			['core/group', '0'],
			['core/paragraph', '0.0'],
			['core/group', '0.1'],
			['core/paragraph', '0.1.0'],
			['core/paragraph', '1'],
		]);
	});

	it('stops the whole traversal when the visitor returns false', () => {
		const visited = [];
		walkBlocks(makeTree(), (node, path) => {
			visited.push(path.join('.'));
			return path.join('.') !== '0.0';
		});

		expect(visited).toEqual(['0', '0.0']);
	});
});

describe('findByStamp', () => {
	const tree = [
		stamped('core/group', 'layout/main:no-sidebar', [
			stamped('core/group', 'area/content', [
				stamped('core/query', 'section/posts-listing:list'),
			]),
		]),
	];

	it('returns the first match with its path', () => {
		const match = findByStamp(tree, (stamp) => stamp?.id === 'content');
		expect(match.path).toEqual([0, 0]);
		expect(match.block.name).toBe('core/group');
	});

	it('exposes the raw block to the predicate and misses return null', () => {
		const byName = findByStamp(tree, (_s, b) => b.name === 'core/query');
		expect(byName.path).toEqual([0, 0, 0]);

		expect(findByStamp(tree, (stamp) => stamp?.id === 'nope')).toBeNull();
	});
});

describe('findByStampWithin', () => {
	const tree = [
		stamped('core/query', 'section/posts-listing:list', [
			stamped('core/column', 'container/media'),
		]),
		stamped('core/group', 'section/page-header:simple', [
			stamped('core/group', 'container/body', [
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
			]),
		]),
	];

	it('matches the ancestor itself', () => {
		const body = findByStamp(tree, (stamp) => stamp?.id === 'body');
		const match = findByStampWithin(
			tree,
			body.path,
			(stamp) => stamp?.id === 'body'
		);
		expect(match.path).toEqual(body.path);
	});

	it('walks only descendants of the ancestor', () => {
		const listing = findByStamp(
			tree,
			(stamp) => stamp?.id === 'posts-listing'
		);
		expect(
			findByStampWithin(
				tree,
				listing.path,
				(stamp) => stamp?.id === 'media'
			).path
		).toEqual([0, 0]);
		expect(
			findByStampWithin(
				tree,
				listing.path,
				(stamp) => stamp?.id === 'page-header-title'
			)
		).toBeNull();
	});
});

describe('findBlockByClientId', () => {
	it('returns the path for a clientId', () => {
		const tree = [
			{
				name: 'core/group',
				clientId: 'root',
				attributes: {},
				innerBlocks: [
					{
						name: 'core/paragraph',
						clientId: 'p1',
						attributes: {},
						innerBlocks: [],
					},
				],
			},
		];
		expect(findBlockByClientId(tree, 'p1').path).toEqual([0, 0]);
		expect(findBlockByClientId(tree, 'missing')).toBeNull();
	});
});

describe('attribute pickers', () => {
	const attrs = {
		style: { spacing: {} },
		className: 'x',
		align: 'wide',
		blockeraFontColor: '#111',
		blockeraSpacing: { value: 1 },
		content: 'text',
		tagName: 'main',
	};

	it('pickUserAttributes keeps styling keys + blockera extensions only', () => {
		expect(pickUserAttributes(attrs)).toEqual({
			style: { spacing: {} },
			className: 'x',
			align: 'wide',
			blockeraFontColor: '#111',
			blockeraSpacing: { value: 1 },
		});
		expect(pickUserAttributes()).toEqual({});
	});

	it('pickBlockeraExtensionAttributes keeps blockera* keys only', () => {
		expect(pickBlockeraExtensionAttributes(attrs)).toEqual({
			blockeraFontColor: '#111',
			blockeraSpacing: { value: 1 },
		});
		expect(pickBlockeraExtensionAttributes()).toEqual({});
	});
});

describe('mergeUserAttributes', () => {
	it('overlays source user styling onto target attributes', () => {
		const merged = mergeUserAttributes(
			{ tagName: 'main', className: 'target' },
			{ className: 'user', content: 'ignored', blockeraX: 1 }
		);

		expect(merged.tagName).toBe('main');
		expect(merged.className).toBe('user');
		expect(merged.blockeraX).toBe(1);
		// Non-user source keys never migrate.
		expect(merged.content).toBeUndefined();
	});

	it('merges metadata shallowly with the target stamp winning', () => {
		const merged = mergeUserAttributes(
			{ metadata: { blockeraOne: 'section/target-stamp' } },
			{
				metadata: {
					blockeraOne: 'section/source-stamp',
					name: 'Custom name',
				},
			}
		);

		expect(merged.metadata).toEqual({
			blockeraOne: 'section/target-stamp',
			name: 'Custom name',
		});
	});
});

describe('insertAtPlacement', () => {
	const tree = [
		stamped('core/group', 'area/content', [
			stamped('core/query', 'section/posts-listing'),
		]),
	];
	const nodes = [block('core/spacer')];

	it('inserts relative to the anchor stamp', () => {
		const placed = insertAtPlacement(
			tree,
			{ relativeTo: 'posts-listing', position: 'before' },
			nodes
		);
		expect(getAtPath(placed, [0, 0]).name).toBe('core/spacer');
	});

	it('returns null when the anchor stamp is missing', () => {
		expect(
			insertAtPlacement(
				tree,
				{ relativeTo: 'missing', position: 'after' },
				nodes
			)
		).toBeNull();
	});

	it('creates a missing inner container before inserting', () => {
		const article = [
			stamped('core/group', 'section/article', {}, [
				stamped('core/post-content', 'section/post-content'),
			]),
		];
		const placed = insertAtPlacement(
			article,
			{
				relativeTo: 'comments',
				position: 'inside-end',
				ensureContainerOwner: 'article',
			},
			[stamped('core/comments', 'section/post-comments')]
		);
		expect(placed).not.toBeNull();
		const comments = findByStamp(
			placed,
			(stamp) => stamp.role === 'container' && stamp.id === 'comments'
		);
		expect(comments).not.toBeNull();
		expect(comments.block.innerBlocks[0].name).toBe('core/comments');
	});
});

describe('replaceSectionAtPath', () => {
	const tree = [
		stamped('core/group', 'area/content', []),
		stamped('core/group', 'section/page-header:banner', []),
	];
	const replacement = [stamped('core/group', 'section/page-header:simple')];

	it('relocates to the placement anchor (old node removed first)', () => {
		const result = replaceSectionAtPath(
			tree,
			[1],
			{ relativeTo: 'content', position: 'inside-start' },
			replacement
		);

		expect(result).toHaveLength(1);
		expect(getAtPath(result, [0, 0]).attributes.metadata.blockeraOne).toBe(
			'section/page-header:simple'
		);
	});

	it('replaces in place when the placement anchor is missing', () => {
		const result = replaceSectionAtPath(
			tree,
			[1],
			{ relativeTo: 'missing', position: 'after' },
			replacement
		);

		expect(result).toHaveLength(2);
		expect(result[1].attributes.metadata.blockeraOne).toBe(
			'section/page-header:simple'
		);
	});

	it('replaces in place without a placement', () => {
		const result = replaceSectionAtPath(tree, [1], undefined, replacement);
		expect(result[1].attributes.metadata.blockeraOne).toBe(
			'section/page-header:simple'
		);
	});
});
