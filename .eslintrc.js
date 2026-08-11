const base = require('./packages/global-packages/packages/dev-tools/js/eslint/config');

module.exports = {
	...base,
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
