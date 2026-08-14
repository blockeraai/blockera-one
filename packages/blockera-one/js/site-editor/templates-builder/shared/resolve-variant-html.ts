/**
 * Resolve variant markup at runtime. Pattern variants read `content` from
 * the core patterns store payload (`getBlockPatterns()`); templatePart
 * variants generate a stamped `wp:template-part` comment. The ops engine
 * stays sync and pure — it only ever sees `variant.html`.
 */

import { buildTemplatePartHtml } from './template-part-html';
import type {
	ControlDef,
	PanelGroupDef,
	TemplateOptionsConfig,
	VariantDef,
} from './types';

/** Minimal shape of a `getBlockPatterns()` record we rely on. */
export type PatternRecord = {
	name: string;
	content?: string;
};

/**
 * Resolve one variant's markup.
 *
 * @param variant   Variant to resolve.
 * @param sectionId Stamp id of the section the control targets.
 * @param patterns  Core patterns store payload (undefined while loading).
 * @return HTML or null when the pattern is not (yet) available.
 */
export function resolveVariantHtml(
	variant: VariantDef,
	sectionId: string,
	patterns: PatternRecord[] | null | undefined
): string | null {
	// Pre-resolved (unit tests inject html directly to stay WP-free).
	if (variant.html) {
		return variant.html;
	}

	if (variant.kind === 'templatePart') {
		return buildTemplatePartHtml(variant, sectionId);
	}

	if (variant.patternSlug) {
		const pattern = patterns?.find((p) => p.name === variant.patternSlug);
		return pattern?.content || null;
	}

	return null;
}

/**
 * Whether a control still has pattern-kind variants without resolved HTML
 * (used to disable pickers while the patterns REST request is in flight —
 * never swap in empty markup).
 */
export function hasUnresolvedVariants(control: ControlDef): boolean {
	return !!control.variants?.some(
		(variant) => variant.kind !== 'templatePart' && !variant.html
	);
}

function resolveControl(
	control: ControlDef,
	patterns: PatternRecord[] | null | undefined,
	patternsResolved: boolean
): ControlDef {
	if (!control.variants?.length) {
		return control;
	}

	let variants = control.variants.map((variant) => {
		const html = resolveVariantHtml(variant, control.target.id, patterns);
		return html ? { ...variant, html } : variant;
	});

	// Pattern missing after resolution finished (unregistered slug): drop the
	// tile instead of offering a swap that would produce an empty section.
	if (patternsResolved) {
		variants = variants.filter(
			(variant) => variant.kind === 'templatePart' || !!variant.html
		);
	}

	return { ...control, variants };
}

function resolveGroups(
	groups: PanelGroupDef[],
	patterns: PatternRecord[] | null | undefined,
	patternsResolved: boolean
): PanelGroupDef[] {
	return groups.map((group) => ({
		...group,
		headerToggle: group.headerToggle
			? resolveControl(group.headerToggle, patterns, patternsResolved)
			: group.headerToggle,
		controls: group.controls.map((control) =>
			resolveControl(control, patterns, patternsResolved)
		),
		nestedPanel: group.nestedPanel
			? {
					...group.nestedPanel,
					groups: resolveGroups(
						group.nestedPanel.groups,
						patterns,
						patternsResolved
					),
				}
			: group.nestedPanel,
	}));
}

/**
 * Return a config copy whose variants carry resolved `html`. Pure — never
 * mutates the input config.
 */
export function resolveConfigVariantsHtml(
	config: TemplateOptionsConfig,
	patterns: PatternRecord[] | null | undefined,
	patternsResolved: boolean
): TemplateOptionsConfig {
	return {
		...config,
		groups: resolveGroups(config.groups, patterns, patternsResolved),
	};
}
