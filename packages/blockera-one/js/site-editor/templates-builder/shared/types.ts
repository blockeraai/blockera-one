/**
 * Shared types for the Templates Builder options engine.
 */

export type BlockNode = {
	clientId?: string;
	name: string;
	attributes?: Record<string, unknown>;
	innerBlocks?: BlockNode[];
};

export type OptionStateKind =
	'value' | 'missing' | 'customized' | 'unrecognized';

export type ResolvedOptionState = {
	kind: OptionStateKind;
	/** Current value when kind is value or customized. */
	value?: string | number | boolean | null;
	/** Path indices from root to the matched block. */
	path?: number[];
	/** For layouts: area name → path + attributes snapshot. */
	areaMap?: Record<
		string,
		{
			path: number[];
			attributes: Record<string, unknown>;
			innerBlocks: BlockNode[];
		}
	>;
	/** For layouts: container id → path + attributes. */
	containerMap?: Record<
		string,
		{
			path: number[];
			attributes: Record<string, unknown>;
		}
	>;
};

export type ControlType =
	'layout-picker' | 'toggle' | 'segmented-choice' | 'number';

/**
 * Declarative fallback matcher used when a section block lost its stamp
 * (user rebuilt it by hand). Declared per section id in each template-type
 * config so the shared engine stays template-agnostic.
 */
export type SectionHeuristic =
	| {
			/** Match the first block with this name. */
			kind: 'blockName';
			name: string;
	  }
	| {
			/** Match a core/template-part by area and/or slug shape. */
			kind: 'templatePart';
			area?: string;
			slugPrefix?: string;
			slugIncludes?: string;
	  }
	| {
			/**
			 * Match the nearest core/group ancestor directly wrapping a child
			 * with this block name (e.g. page-title group around query-title).
			 */
			kind: 'groupWrapping';
			childName: string;
	  };

export type OperationKind =
	| 'transplantLayout'
	| 'swapSection'
	| 'swapTemplatePart'
	| 'toggleSection'
	| 'setSectionAttribute'
	| 'setTemplateSetting';

/** Where to insert a block, relative to another stamped block. */
export type InsertRule = {
	relativeTo: string;
	position: 'before' | 'after' | 'inside-end' | 'inside-start';
};

/** Chrome (header/footer) page-frame layout when swapping template parts. */
export type ChromeLayout = 'stacked' | 'vertical-rail';

export type VariantDef = {
	id: string;
	label: string;
	/**
	 * Markup source. `pattern` (default) resolves `patternSlug` from the core
	 * patterns store; `templatePart` builds a self-closing wp:template-part
	 * comment from `slug`/`area`/`tagName`.
	 */
	kind?: 'pattern' | 'templatePart';
	/** Registered pattern slug (pattern kind). */
	patternSlug?: string;
	/** Theme template part slug (templatePart kind). */
	slug?: string;
	/** Template part area (templatePart kind). */
	area?: string;
	/** Template part HTML tag (templatePart kind). */
	tagName?: string;
	/**
	 * Resolved markup for operations. Filled at runtime by
	 * `resolve-variant-html.ts` (never authored in configs — tests may
	 * inject it directly to stay WP-free).
	 */
	html?: string;
	thumbnail?: string;
	/** Areas this layout variant exposes. */
	areas?: string[];
	/**
	 * Per-design placement. When set, swapping to this variant relocates the
	 * section here, and toggling the section on inserts it here. Variants
	 * without a placement swap in place (control-level `insert` is the
	 * toggle-on fallback).
	 */
	placement?: InsertRule;
	/**
	 * Site header/footer frame layout. `vertical-rail` wraps the layout in
	 * columns (narrow header | body); `stacked` is the default top/bottom part.
	 */
	chromeLayout?: ChromeLayout;
};

export type ControlDef = {
	id: string;
	type: ControlType;
	label: string;
	/** Section or layout id this control binds to. */
	target: {
		kind: 'layout' | 'section' | 'setting';
		id: string;
	};
	operation: OperationKind;
	/**
	 * PHP catalog pool that fills `variants` (see `hydrate-config.ts`).
	 * Configs never inline variant lists — the catalog is the child-theme
	 * API (`blockera-one/template-builder/catalog/{type}` filter).
	 */
	catalogPool?: string;
	/** Variant ids hidden from this control's picker (e.g. `no-sidebar`). */
	catalogExclude?: string[];
	variants?: VariantDef[];
	/** For toggles: on/off map to layout or section variants. */
	onValue?: string | boolean;
	offValue?: string | boolean;
	/** Attribute path for setSectionAttribute (dot path). */
	attributePath?: string;
	/** Setting nested path under blockera_one_template_settings. */
	settingPath?: string;
	defaultValue?: string | number | boolean;
	min?: number;
	max?: number;
	step?: number;
	/** Show when another control has one of these values. */
	conditions?: Array<{
		controlId: string;
		equals?: string | number | boolean;
		notEquals?: string | number | boolean;
	}>;
	/** Insertion rule for restore (fallback when the variant has no placement). */
	insert?: InsertRule;
	/** Render a horizontal rule above this control inside the group. */
	separatorBefore?: boolean;
	/**
	 * Hide toggles: UI checked when the section is missing (invert presence).
	 * On change, toggleSection is called with enabled = !nextValue.
	 */
	invertPresence?: boolean;
	/** Engine hints for swapSection controls. */
	swapHints?: {
		/** Preserve query.* attributes across the swap (posts listings). */
		preserveQuery?: boolean;
		/**
		 * Controls whose section variant is re-applied after this swap —
		 * for dependent sections nested inside the swapped markup (e.g.
		 * pagination inside a posts listing). Skipped when the dependent
		 * section already uses its default (first) variant.
		 */
		reapplyControls?: string[];
	};
};

export type PanelGroupDef = {
	id: string;
	title: string;
	/**
	 * Optional master toggle in the group header. When off, body controls are
	 * hidden (header-only card). Reusable for Sidebar, Pagination, etc.
	 */
	headerToggle?: ControlDef;
	controls: ControlDef[];
	/**
	 * When set, the group is a compact gateway: body controls live on a nested
	 * DrillDown screen (URL stack). Nested groups may also declare nestedPanel.
	 */
	nestedPanel?: {
		/** URL stack segment. */
		id: string;
		/** Nested DrillDownScreen title. */
		title: string;
		groups: PanelGroupDef[];
	};
};

/**
 * Catalog payload printed by PHP (`Theme\TemplateBuilder`):
 * template type → pool id → Variant[]. Contract:
 * `packages/blockera-one/schemas/template-builder-catalog.schema.json`.
 */
export type CatalogPools = Record<string, VariantDef[]>;
export type CatalogPayload = Record<string, CatalogPools>;

export type TemplateOptionsConfig = {
	/** Template type id — key into the PHP catalog payload (e.g. `archive`). */
	type: string;
	/** Template purpose filter ids this config applies to. */
	filters: string[];
	/** Fallback filter when a child falls back to archive.html. */
	fallbackFilter?: string;
	layoutId: string;
	/**
	 * Section id → stampless fallback matcher. Aggregated into the global
	 * heuristic registry by `registry.ts` (same uniqueness rule as roles).
	 */
	sectionHeuristics?: Record<string, SectionHeuristic>;
	/**
	 * Sections that live as full-width layout siblings (above the
	 * content/sidebar columns) and must be carried across transplants.
	 */
	layoutSiblingSections?: string[];
	groups: PanelGroupDef[];
};
