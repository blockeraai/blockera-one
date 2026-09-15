// Edit packages/global-packages/packages/dev-tools/root-configs/eslint.config.blockera-one.cjs
// project:bootstrap copies this to the host repo root for --project=blockera-one.
const {
	createConfig,
} = require( './packages/global-packages/packages/dev-tools/js/eslint/config' );

module.exports = createConfig( {
	extraIgnores: [
		'/bin/**',
		'packages/*-pro/**',
		'packages/*-pro-*/**',
		'packages/global-packages/packages/**/*-pro/**',
		'packages/global-packages/packages/**/*-pro-*/**',
	],
	allowedTextDomains: [ 'blockera', 'blockera-one' ],
} );
