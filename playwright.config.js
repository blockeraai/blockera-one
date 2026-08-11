const createPlaywrightConfig = require('./packages/global-packages/packages/dev-tools/js/playwright/config');

export default createPlaywrightConfig({
	rootDir: __dirname,
	// Theme has no tests/performance Playwright suite.
	testIgnoreDefaults: [],
});
