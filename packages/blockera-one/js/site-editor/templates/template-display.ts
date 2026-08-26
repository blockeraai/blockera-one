/**
 * Template record shape and display strings.
 */

export type TemplateLike = {
	id?: string | number;
	slug?: string;
	is_custom?: boolean;
	meta?: { is_wp_suggestion?: boolean };
	author_text?: string;
	original_source?: string;
	source?: string;
	plugin?: string;
	theme?: string;
	area?: string;
	title?: string | { rendered?: string; raw?: string };
	description?: string | { raw?: string; rendered?: string };
	content?: { raw?: string; rendered?: string; block_version?: number };
};

/**
 * Active template parts for the current theme: one per slug, custom overrides theme.
 */
export function getActiveTemplateParts(
	parts: TemplateLike[],
	stylesheet?: string
): TemplateLike[] {
	const bySlug = new Map<string, TemplateLike>();

	for (const part of parts) {
		const slug = part.slug || '';
		if (!slug) {
			continue;
		}

		// Skip parts owned by another theme when stylesheet is known.
		if (stylesheet && part.theme && part.theme !== stylesheet) {
			continue;
		}

		const existing = bySlug.get(slug);
		if (!existing) {
			bySlug.set(slug, part);
			continue;
		}

		const existingSource = existing.original_source || existing.source;
		const nextSource = part.original_source || part.source;
		if (nextSource === 'custom' && existingSource !== 'custom') {
			bySlug.set(slug, part);
		}
	}

	return Array.from(bySlug.values());
}

export function getTemplateTitle(template: TemplateLike): string {
	const { title, slug } = template;
	if (typeof title === 'string' && title && title !== slug) {
		return title;
	}
	if (title && typeof title === 'object' && title.rendered) {
		return title.rendered;
	}
	return slug || String(template.id ?? '');
}

export function getTemplateDescription(template: TemplateLike): string {
	const { description } = template;
	if (typeof description === 'string') {
		return description;
	}
	if (description && typeof description === 'object') {
		return description.raw || description.rendered || '';
	}
	return '';
}
