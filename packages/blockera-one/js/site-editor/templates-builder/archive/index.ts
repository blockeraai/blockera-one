/**
 * Archive template-type module for Templates Builder.
 *
 * Theme files (WordPress paths — do not move):
 * - `templates/archive.html`
 * - `patterns/archive/builder-*.php` (slugs `blockera-one/builder-archive-*`)
 * - `patterns/post-meta/builder-*.php` (shared Post Meta item/row patterns)
 *
 * Default variant pools live in PHP
 * (`php/Theme/TemplateBuilder/ArchiveCatalog.php`).
 */

import type { BuilderTypeRegistration } from '../shared/types';
import { ARCHIVE_OPTIONS_CONFIG } from './config';

export const archiveRegistration: BuilderTypeRegistration = {
	config: ARCHIVE_OPTIONS_CONFIG,
	stamps: [],
};
