/**
 * Global header template-part module for Templates Builder.
 *
 * Theme files (WordPress paths — do not move):
 * - `parts/header.html`
 */

import type { BuilderTypeRegistration } from '../shared/types';
import { GLOBAL_HEADER_OPTIONS_CONFIG } from './config';
import { GLOBAL_HEADER_STAMPS } from './stamps';

export const globalHeaderRegistration: BuilderTypeRegistration = {
	config: GLOBAL_HEADER_OPTIONS_CONFIG,
	stamps: GLOBAL_HEADER_STAMPS,
};
