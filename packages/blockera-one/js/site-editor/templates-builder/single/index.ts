/**
 * Single template-type module for Templates Builder.
 *
 * Theme files (WordPress paths — do not move):
 * - `templates/single.html`
 * - `patterns/single/builder-*.php` (slugs `blockera-one/builder-single-*`)
 */

import type { BuilderTypeRegistration } from '../shared/types';
import { SINGLE_OPTIONS_CONFIG } from './config';

export const singleRegistration: BuilderTypeRegistration = {
	config: SINGLE_OPTIONS_CONFIG,
	stamps: [],
};
