const base = require('./packages/global-packages/packages/dev-tools/js/eslint/config');

const ignorePatterns = base.ignorePatterns.concat(['/bin/**']);

module.exports = {
	...base,
	ignorePatterns,
	rules: {
		...base.rules,
		'@wordpress/i18n-text-domain': [
			'error',
			{
				allowedTextDomain: ['blockera', 'blockera-one'],
			},
		],
	},
};
