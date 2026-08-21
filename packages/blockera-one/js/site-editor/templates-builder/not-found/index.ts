/**
 * 404 template-type module for Templates Builder.
 *
 * Theme files (WordPress paths — do not move):
 * - `templates/404.html`
 * - `patterns/404/builder-*.php` (slugs `blockera-one/builder-404-*`)
 */

import type { BuilderTypeRegistration } from '../shared/types';
import { NOT_FOUND_OPTIONS_CONFIG } from './config';

export const notFoundRegistration: BuilderTypeRegistration = {
	config: NOT_FOUND_OPTIONS_CONFIG,
	stamps: [],
};
