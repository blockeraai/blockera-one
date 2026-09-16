// Edit packages/global-packages/packages/dev-tools/root-configs/jest.config.blockera-one.js
// project:bootstrap copies this to the host repo root for --project=blockera-one.
/**
 * Theme Jest: shared GP packages, excluding Pro and toolkit overlays.
 */
const base = require('./packages/global-packages/packages/dev-jest/js/jest.config.js');

module.exports = {
	...base,
	testPathIgnorePatterns: [
		...(base.testPathIgnorePatterns || []),
		'/packages/[^/]*-pro(/|-)',
		'/packages/[^/]*-toolkit(/|-)',
	],
};
