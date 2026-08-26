/**
 * Internal dependencies
 */
const fs = require('fs');
const path = require('path');
const { dependencies } = require('./package');
const packagesConfig = require('./packages/global-packages/packages/dev-tools/js/webpack/packages');
const createRootWebpackConfig = require('./packages/global-packages/packages/dev-tools/js/webpack/create-root-config');

/**
 * Prefer Composer path-repo symlinks, then local theme packages, then submodule.
 *
 * @param {string} packageName Canonical package slug.
 * @return {string} Relative package directory from the theme root.
 */
function resolvePackageDir(packageName) {
	const candidates = [
		`./vendor/blockera/${packageName}`,
		`./packages/${packageName}`,
		`./packages/global-packages/packages/${packageName}`,
	];

	if (packageName.startsWith('feature-')) {
		candidates.push(
			`./packages/global-packages/packages/features-library/${packageName.replace(
				'feature-',
				''
			)}`
		);
	}
	if (packageName.startsWith('block-')) {
		candidates.push(
			`./packages/global-packages/packages/blocks-library/${packageName.replace(
				'block-',
				''
			)}`
		);
	}

	for (const candidate of candidates) {
		if (
			fs.existsSync(
				path.resolve(process.cwd(), candidate, 'package.json')
			)
		) {
			return candidate;
		}
	}

	throw new Error(
		`Cannot find Blockera package "${packageName}" under vendor/blockera, packages/, or packages/global-packages/packages/`
	);
}

module.exports = createRootWebpackConfig({
	dependencies,
	packagesConfig,
	resolvePackageDir,
	getExternals: (blockeraPackagesVersion) => ({
		'@blockera/icons': 'blockeraIcons',
		'@blockera/blockera-one':
			'blockeraBlockeraOne_' + blockeraPackagesVersion['blockera-one'],
		'@blockera/env': 'blockeraEnv_' + blockeraPackagesVersion.env,
		'@blockera/telemetry':
			'blockeraTelemetry_' + blockeraPackagesVersion.telemetry,
		'@blockera/storage':
			'blockeraStorage_' + blockeraPackagesVersion.storage,
		'@blockera/products':
			'blockeraProducts_' + blockeraPackagesVersion.products,
		'@blockera/data': 'blockeraData_' + blockeraPackagesVersion.data,
		'@blockera/utils': 'blockeraUtils_' + blockeraPackagesVersion.utils,
		'@blockera/editor': 'blockeraEditor_' + blockeraPackagesVersion.editor,
		'@blockera/global-styles-ui':
			'blockeraGlobalStylesUi_' +
			blockeraPackagesVersion['global-styles-ui'],
		'@blockera/blocks-core':
			'blockeraBlocksCore_' + blockeraPackagesVersion['blocks-core'],
		'@blockera/feature-icon':
			'blockeraFeatureIcon_' + blockeraPackagesVersion['feature-icon'],
		'@blockera/features-core':
			'blockeraFeaturesCore_' + blockeraPackagesVersion['features-core'],
		'@blockera/controls':
			'blockeraControls_' + blockeraPackagesVersion.controls,
		'@blockera/bootstrap':
			'blockeraBootstrap_' + blockeraPackagesVersion.bootstrap,
		'@blockera/wordpress':
			'blockeraWordpress_' + blockeraPackagesVersion.wordpress,
		'@blockera/classnames':
			'blockeraClassnames_' + blockeraPackagesVersion.classnames,
		'@blockera/data-editor':
			'blockeraDataEditor_' + blockeraPackagesVersion['data-editor'],
	}),
});
