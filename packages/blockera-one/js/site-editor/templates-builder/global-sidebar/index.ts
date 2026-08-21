/**
 * Global sidebar template-part module for Templates Builder.
 *
 * Theme files (WordPress paths — do not move):
 * - `parts/sidebar.html`
 */

import type { BuilderTypeRegistration } from '../shared/types';
import { GLOBAL_SIDEBAR_OPTIONS_CONFIG } from './config';
import { GLOBAL_SIDEBAR_STAMPS } from './stamps';

export const globalSidebarRegistration: BuilderTypeRegistration = {
	config: GLOBAL_SIDEBAR_OPTIONS_CONFIG,
	stamps: GLOBAL_SIDEBAR_STAMPS,
};
