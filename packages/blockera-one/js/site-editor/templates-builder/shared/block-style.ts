/**
 * Gutenberg-compatible `is-style-*` className helpers.
 *
 * Reimplemented from block-editor `block-styles/utils` (private) using a
 * whitespace tokenizer so unit tests stay WP-free and Blockera classes
 * (`blockera-block`, `blockera-block-*`) are preserved.
 */

function tokenizeClassName(className: string | undefined): string[] {
	if (!className) {
		return [];
	}
	const parts = className.split(/\s+/);
	const tokens: string[] = [];
	for (let i = 0; i < parts.length; i++) {
		if (parts[i]) {
			tokens.push(parts[i]);
		}
	}
	return tokens;
}

/**
 * Active block-style slug from `className`, or `default` when none is set.
 */
export function getActiveBlockStyleName(className?: string): string {
	const tokens = tokenizeClassName(className);
	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i].indexOf('is-style-') === 0) {
			return tokens[i].slice(9);
		}
	}
	return 'default';
}

/**
 * Replace the active `is-style-*` token. Always writes `is-style-{name}`
 * (including Default → `is-style-default`), matching Gutenberg.
 */
export function replaceBlockStyleClassName(
	className: string | undefined,
	styleName: string
): string {
	const nextName = styleName || 'default';
	const kept: string[] = [];
	const tokens = tokenizeClassName(className);
	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i].indexOf('is-style-') !== 0) {
			kept.push(tokens[i]);
		}
	}
	kept.push('is-style-' + nextName);
	return kept.join(' ');
}
