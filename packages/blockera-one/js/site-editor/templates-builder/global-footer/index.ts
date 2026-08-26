/**
 * Global footer template-part module for Templates Builder.
 *
 * Theme files (WordPress paths — do not move):
 * - `parts/footer.html`
 */

import type { BuilderTypeRegistration } from '../shared/types';
import { GLOBAL_FOOTER_OPTIONS_CONFIG } from './config';
import { GLOBAL_FOOTER_STAMPS } from './stamps';

export const globalFooterRegistration: BuilderTypeRegistration = {
	config: GLOBAL_FOOTER_OPTIONS_CONFIG,
	stamps: GLOBAL_FOOTER_STAMPS,
};
