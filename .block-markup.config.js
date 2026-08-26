/**
 * Block-markup pipeline for Blockera One.
 *
 * Merged onto the GP base at
 * `packages/global-packages/packages/dev-tools/js/block-markup/base-config.js`.
 * Consumed by:
 * - `npm run block-markup:normalize` / `block-markup:check` / `block-markup:prettier`
 * - NormalizeBlockMarkupWebpackPlugin during `npm run start`
 */

module.exports = {
	textDomain: 'blockera-one',
	uriPhpExpression: 'get_template_directory_uri()',
	imagePathRoots: ['assets', 'patterns/images'],
	patternsDirs: ['patterns', 'patterns-woocommerce'],
	templatesDirs: ['templates'],
	webpack: true,
};
