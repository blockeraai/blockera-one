// Edit packages/global-packages/packages/dev-tools/root-configs/.stylelintrc.blockera-one.js
// project:bootstrap copies this to the host repo root for --project=blockera-one.
const shared = require('./packages/global-packages/packages/dev-tools/js/stylelint/config');

module.exports = {
	...shared,
	ignoreFiles: [
		...(shared.ignoreFiles || []),
		'packages/*-pro/**',
		'packages/*-pro-*/**',
		'packages/global-packages/packages/**/*-pro/**',
		'packages/global-packages/packages/**/*-pro-*/**',
		'packages/*-toolkit/**',
		'packages/*-toolkit-*/**',
		'packages/global-packages/packages/**/*-toolkit/**',
		'packages/global-packages/packages/**/*-toolkit-*/**',
	],
};
