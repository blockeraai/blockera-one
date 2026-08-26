/**
 * Generic nested-panel tree for Site Editor drill-downs.
 * Feature-specific controls (Templates Builder ops, Homepage settings) stay
 * in their own packages; this layer only describes navigation structure.
 */

export type NestedPanelNode = {
	/** URL stack segment (slash path). */
	id: string;
	/** Screen title when this panel is active. */
	title: string;
	/** Child panels reachable from this node (gateways on this screen). */
	children?: NestedPanelNode[];
};

export type ResolvedNestedPanel = {
	/** Active panel title (root uses the host screen title). */
	title: string;
	/** Stack used to reach this panel (empty = root). */
	stack: string[];
	/** Parent stack after Back (one level up). */
	parentStack: string[];
	/**
	 * Parent trail for the heading breadcrumb (does not include the current
	 * panel title). Empty at root.
	 */
	breadcrumbs: string[];
	/** Child gateway nodes defined on this panel (empty at leaf). */
	children: NestedPanelNode[];
	/** False when the stack pointed at an unknown segment (caller should reset). */
	valid: boolean;
};
