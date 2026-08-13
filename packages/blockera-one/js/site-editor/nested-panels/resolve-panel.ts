/**
 * Resolve the active nested panel from a root title + child tree + URL stack.
 */

import type { NestedPanelNode, ResolvedNestedPanel } from './types';

type ResolveArgs = {
	/** Host screen title (e.g. "All Archives", "Homepage Settings"). */
	rootTitle: string;
	/** Gateway panels available on the root screen. */
	tree: NestedPanelNode[];
	/** Current URL stack segments. */
	stack: string[];
};

/**
 * Walk `tree` by `stack`. Unknown segments → valid:false (caller resets to root).
 */
export function resolveNestedPanel({
	rootTitle,
	tree,
	stack,
}: ResolveArgs): ResolvedNestedPanel {
	if (!stack.length) {
		return {
			title: rootTitle,
			stack: [],
			parentStack: [],
			breadcrumbs: [],
			children: tree,
			valid: true,
		};
	}

	const breadcrumbs: string[] = [rootTitle];
	let children = tree;
	let current: NestedPanelNode | null = null;

	for (let i = 0; i < stack.length; i++) {
		const segment = stack[i];
		const next = children.find((n) => n.id === segment) || null;
		if (!next) {
			return {
				title: rootTitle,
				stack: [],
				parentStack: [],
				breadcrumbs: [],
				children: tree,
				valid: false,
			};
		}
		if (i > 0 && current) {
			breadcrumbs.push(current.title);
		}
		current = next;
		children = next.children || [];
	}

	return {
		title: current?.title || rootTitle,
		stack: [...stack],
		parentStack: stack.slice(0, -1),
		breadcrumbs,
		children,
		valid: true,
	};
}
