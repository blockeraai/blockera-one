/**
 * Resolve variant markup at runtime. Pattern variants read `content` from
 * the core patterns store payload (`getBlockPatterns()`); templatePart
 * variants generate a stamped `wp:template-part` comment. The ops engine
 * stays sync and pure — it only ever sees `variant.html`.
 */

import { buildTemplatePartHtml } from '../template-part-html';
import type {
	ControlDef,
	PanelGroupDef,
	TemplateOptionsConfig,
	VariantDef,
} from '../types';

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
 * Whether a variant needs pattern-store HTML. Position-only variants
 * (placeSection) have neither a pattern slug nor a template-part kind.
 */
export function variantNeedsPatternHtml(variant: VariantDef): boolean {
	if (variant.disabled || variant.kind === 'templatePart') {
		return false;
	}
	return variant.kind === 'pattern' || !!variant.patternSlug;
}

/**
 * Whether a control still has pattern-kind variants without resolved HTML
 * (used to disable pickers while the patterns REST request is in flight —
 * never swap in empty markup).
 */
export function hasUnresolvedVariants(control: ControlDef): boolean {
	if (
		control.variants?.some(
			(variant) => variantNeedsPatternHtml(variant) && !variant.html
		)
	) {
		return true;
	}
	const extras = control.alsoToggle;
	if (!extras?.length) {
		return false;
	}
	for (let i = 0; i < extras.length; i++) {
		if (
			extras[i].variants?.some(
				(variant) => variantNeedsPatternHtml(variant) && !variant.html
			)
		) {
			return true;
		}
	}
	return false;
}

function resolveControl(
	control: ControlDef,
	patterns: PatternRecord[] | null | undefined,
	patternsResolved: boolean
): ControlDef {
	let next = control;
	if (control.variants?.length) {
		let variants = control.variants.map((variant) => {
			const html = resolveVariantHtml(
				variant,
				control.target.id,
				patterns
			);
			return html ? { ...variant, html } : variant;
		});

		// Pattern missing after resolution finished (unregistered slug): drop
		// the tile instead of offering a swap that would produce empty HTML.
		// Position-only variants have no pattern slug and must be kept.
		if (patternsResolved) {
			variants = variants.filter(
				(variant) => !variantNeedsPatternHtml(variant) || !!variant.html
			);
		}

		next = { ...control, variants };
	}

	if (next.alsoToggle?.length) {
		next = {
			...next,
			alsoToggle: next.alsoToggle.map((item) => {
				if (!item.variants?.length) {
					return item;
				}
				let variants = item.variants.map((variant) => {
					const html = resolveVariantHtml(variant, item.id, patterns);
					return html ? { ...variant, html } : variant;
				});
				if (patternsResolved) {
					variants = variants.filter(
						(variant) =>
							!variantNeedsPatternHtml(variant) || !!variant.html
					);
				}
				return { ...item, variants };
			}),
		};
	}

	if (!next.nestedPanel?.groups?.length) {
		return next;
	}
	return {
		...next,
		nestedPanel: {
			...next.nestedPanel,
			groups: resolveGroups(
				next.nestedPanel.groups,
				patterns,
				patternsResolved
			),
		},
	};
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
