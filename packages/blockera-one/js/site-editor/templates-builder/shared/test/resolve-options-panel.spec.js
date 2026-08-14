/**
 * resolve-options-panel.ts: nested-panel tree building, stack walking, and
 * control flattening over an inline config.
 */

import {
	buildNestedPanelTree,
	flattenPanelControls,
	resolveOptionsPanelGroups,
} from '../resolve-options-panel';

function control(id) {
	return {
		id,
		type: 'toggle',
		label: id,
		target: { kind: 'section', id },
		operation: 'toggleSection',
	};
}

const SIDEBAR_LAYOUT_GROUP = {
	id: 'sidebar-layout',
	title: 'Layout',
	controls: [control('sidebar-position')],
};

const SIDEBAR_ADVANCED_GROUP = {
	id: 'sidebar-advanced',
	title: 'Advanced',
	controls: [control('sidebar-width')],
	nestedPanel: {
		id: 'sidebar-advanced',
		title: 'Advanced',
		groups: [
			{
				id: 'sidebar-advanced-inner',
				title: 'Inner',
				controls: [control('sidebar-sticky')],
			},
		],
	},
};

const CONFIG = {
	type: 'archive',
	filters: ['archive'],
	layoutId: 'archive-body',
	groups: [
		{
			id: 'layout',
			title: 'Layout',
			headerToggle: control('sidebar'),
			controls: [control('posts-template')],
			nestedPanel: {
				id: 'sidebar',
				title: 'Sidebar',
				groups: [SIDEBAR_LAYOUT_GROUP, SIDEBAR_ADVANCED_GROUP],
			},
		},
		{
			id: 'footer',
			title: 'Footer',
			controls: [control('footer-design')],
		},
	],
};

describe('buildNestedPanelTree', () => {
	it('builds the tree from groups that declare nestedPanel (recursively)', () => {
		expect(buildNestedPanelTree(CONFIG.groups)).toEqual([
			{
				id: 'sidebar',
				title: 'Sidebar',
				children: [
					{ id: 'sidebar-advanced', title: 'Advanced', children: [] },
				],
			},
		]);
	});

	it('returns an empty tree when no group nests', () => {
		expect(
			buildNestedPanelTree([{ id: 'x', title: 'X', controls: [] }])
		).toEqual([]);
	});
});

describe('resolveOptionsPanelGroups', () => {
	it('returns root groups for an empty stack', () => {
		const resolved = resolveOptionsPanelGroups(CONFIG, []);
		expect(resolved.valid).toBe(true);
		expect(resolved.groups).toBe(CONFIG.groups);
		expect(resolved.tree).toHaveLength(1);
	});

	it('walks multi-segment stacks to the nested groups', () => {
		const oneLevel = resolveOptionsPanelGroups(CONFIG, ['sidebar']);
		expect(oneLevel.valid).toBe(true);
		expect(oneLevel.groups.map((g) => g.id)).toEqual([
			'sidebar-layout',
			'sidebar-advanced',
		]);

		const twoLevels = resolveOptionsPanelGroups(CONFIG, [
			'sidebar',
			'sidebar-advanced',
		]);
		expect(twoLevels.valid).toBe(true);
		expect(twoLevels.groups.map((g) => g.id)).toEqual([
			'sidebar-advanced-inner',
		]);
	});

	it('falls back to root groups with valid:false for unknown segments', () => {
		const invalid = resolveOptionsPanelGroups(CONFIG, ['nope']);
		expect(invalid.valid).toBe(false);
		expect(invalid.groups).toBe(CONFIG.groups);

		const invalidDeep = resolveOptionsPanelGroups(CONFIG, [
			'sidebar',
			'nope',
		]);
		expect(invalidDeep.valid).toBe(false);
		expect(invalidDeep.groups).toBe(CONFIG.groups);
	});
});

describe('flattenPanelControls', () => {
	it('collects headerToggles and controls from every nesting level', () => {
		expect(flattenPanelControls(CONFIG.groups).map((c) => c.id)).toEqual([
			'sidebar',
			'posts-template',
			'sidebar-position',
			'sidebar-width',
			'sidebar-sticky',
			'footer-design',
		]);
	});

	it('returns an empty list for empty groups', () => {
		expect(flattenPanelControls([])).toEqual([]);
	});
});
