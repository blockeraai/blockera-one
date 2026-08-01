/**
 * Pattern localization config for Blockera One.
 *
 * Consumed by:
 * - `npm run patterns:localize` / `patterns:check`
 * - LocalizePatternsWebpackPlugin during `npm run start`
 */

module.exports = {
	textDomain: 'blockera-one',
	uriPhpExpression: 'get_template_directory_uri()',
	imagePathRoots: ['assets', 'patterns/images'],
	/** Relative to the product (theme) root. */
	patternsDir: 'patterns',
};
