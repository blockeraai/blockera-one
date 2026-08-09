/**
 * WooCommerce wp_template detection + curated nav order.
 * Aligned with WC BlockTemplatesRegistry (wp_template only — not parts).
 *
 * Labels match WC template titles (e.g. Products by Category).
 * Icons: WC SVGs where distinctive; WP `category` / `post-categories` for taxonomy rows.
 */

import { __ } from '@wordpress/i18n';

import type { NavIcon } from './templates-nav-config';

type WooTemplateLike = {
	slug?: string;
	author_text?: string;
	plugin?: string;
	title?: string | { rendered?: string; raw?: string };
};

export type WooCommerceNavMeta = {
	label: string;
	icon: NavIcon;
};

/** Nested under Shop Page (browse / discovery templates). */
const WOOCOMMERCE_SHOP_CHILD_SLUGS = [
	'taxonomy-product_cat',
	'taxonomy-product_tag',
	'taxonomy-product_brand',
	'taxonomy-product_attribute',
	'product-search-results',
] as const;

/** Top-level WooCommerce Templates nav order (shop journey). */
const WOOCOMMERCE_TOP_LEVEL_SLUG_ORDER = [
	'archive-product',
	'single-product',
	'page-cart',
	'page-checkout',
	'order-confirmation',
	'coming-soon',
] as const;

/** Known WC slugs for detection (top-level + shop children). */
const WOOCOMMERCE_TEMPLATE_SLUG_ORDER = [
	'archive-product',
	...WOOCOMMERCE_SHOP_CHILD_SLUGS,
	'single-product',
	'page-cart',
	'page-checkout',
	'order-confirmation',
	'coming-soon',
] as const;

const WOOCOMMERCE_SLUG_SET = new Set<string>(WOOCOMMERCE_TEMPLATE_SLUG_ORDER);

const WOOCOMMERCE_SHOP_CHILD_SLUG_SET = new Set<string>(
	WOOCOMMERCE_SHOP_CHILD_SLUGS
);

const WOOCOMMERCE_TOP_LEVEL_RANK = new Map<string, number>(
	WOOCOMMERCE_TOP_LEVEL_SLUG_ORDER.map((slug, index) => [slug, index])
);

const WOOCOMMERCE_SHOP_CHILD_RANK = new Map<string, number>(
	WOOCOMMERCE_SHOP_CHILD_SLUGS.map((slug, index) => [slug, index])
);

export function isWooCommerceShopChildSlug(slug: string): boolean {
	return WOOCOMMERCE_SHOP_CHILD_SLUG_SET.has(slug);
}

/**
 * Purpose-nav labels + icons for known WC templates.
 */
const WOOCOMMERCE_NAV_META: Record<string, WooCommerceNavMeta> = {
	'archive-product': {
		label: __('Shop Page', 'blockera'),
		icon: 'store',
	},
	'single-product': {
		label: __('Single Product', 'blockera'),
		icon: 'product',
	},
	/*
	 * Taxonomy templates: WC titles (`Products by %s`). Categories use the same
	 * Archive → Categories icon; Tag / Brand / Attribute use core post-terms
	 * (`postCategories`).
	 */
	'taxonomy-product_cat': {
		label: __('Products by Category', 'blockera'),
		icon: 'category',
	},
	'taxonomy-product_tag': {
		label: __('Products by Tag', 'blockera'),
		icon: 'post-categories',
	},
	'taxonomy-product_brand': {
		label: __('Products by Brand', 'blockera'),
		icon: 'post-categories',
	},
	'taxonomy-product_attribute': {
		label: __('Products by Attribute', 'blockera'),
		icon: 'post-categories',
	},
	'product-search-results': {
		label: __('Product Search Page', 'blockera'),
		icon: 'product-search',
	},
	'page-cart': {
		label: __('Cart Page', 'blockera'),
		icon: 'cart',
	},
	'page-checkout': {
		label: __('Checkout Page', 'blockera'),
		icon: 'checkout',
	},
	'order-confirmation': {
		label: __('Order Confirmation', 'blockera'),
		icon: 'order',
	},
	'coming-soon': {
		label: __('Coming Soon Page', 'blockera'),
		icon: 'coming-soon',
	},
};

/**
 * Nav label + icon for a WC template slug (curated, else undefined).
 */
export function getWooCommerceNavMeta(
	slug: string
): WooCommerceNavMeta | undefined {
	return WOOCOMMERCE_NAV_META[slug];
}

function titleForSort(template: WooTemplateLike): string {
	const { title, slug } = template;
	if (typeof title === 'string' && title && title !== slug) {
		return title;
	}
	if (title && typeof title === 'object' && title.rendered) {
		return title.rendered;
	}
	return slug || '';
}

/**
 * Whether a wp_template belongs to WooCommerce (for nav grouping / exclusion).
 */
export function isWooCommerceTemplate(template: WooTemplateLike): boolean {
	const slug = template.slug || '';
	if (slug && WOOCOMMERCE_SLUG_SET.has(slug)) {
		return true;
	}

	if ((template.author_text || '') === 'WooCommerce') {
		return true;
	}

	const plugin = (template.plugin || '').toLowerCase();
	if (plugin.includes('woocommerce')) {
		return true;
	}

	return false;
}

function compareByRankThenTitle<T extends WooTemplateLike>(
	a: T,
	b: T,
	rankMap: Map<string, number>
): number {
	const slugA = a.slug || '';
	const slugB = b.slug || '';
	const rankA = rankMap.get(slugA);
	const rankB = rankMap.get(slugB);

	if (rankA !== undefined && rankB !== undefined) {
		return rankA - rankB;
	}
	if (rankA !== undefined) {
		return -1;
	}
	if (rankB !== undefined) {
		return 1;
	}

	return titleForSort(a).localeCompare(titleForSort(b));
}

/** Sort top-level WC nav templates (excludes shop children). */
export function sortWooCommerceTopLevelTemplates<T extends WooTemplateLike>(
	templates: T[]
): T[] {
	return [...templates].sort((a, b) =>
		compareByRankThenTitle(a, b, WOOCOMMERCE_TOP_LEVEL_RANK)
	);
}

/** Sort templates nested under Shop Page. */
export function sortWooCommerceShopChildTemplates<T extends WooTemplateLike>(
	templates: T[]
): T[] {
	return [...templates].sort((a, b) =>
		compareByRankThenTitle(a, b, WOOCOMMERCE_SHOP_CHILD_RANK)
	);
}
