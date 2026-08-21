/**
 * Shared editor contracts for Templates Builder: the window payload printed
 * by `Theme\TemplateBuilder` and the JS `applyFilters` ids.
 *
 * This is the only `declare global` for `window.blockeraOneTemplateBuilder`.
 */

import type { MetaItemsDesignPayload } from './ops/meta';
import type { CatalogPayload } from './types';

export const JS_FILTER_CATALOG = 'blockeraOne.templatesBuilder.catalog';

export const JS_FILTER_META_ITEMS_DESIGN =
	'blockeraOne.templatesBuilder.metaItemsDesign';

declare global {
	interface Window {
		blockeraOneTemplateBuilder?: {
			catalog?: CatalogPayload;
			metaItemsDesign?: MetaItemsDesignPayload;
		};
	}
}

export {};
