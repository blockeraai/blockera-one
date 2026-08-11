module.exports =
	require('./packages/global-packages/packages/dev-tools/js/cypress/config')({
		rootDir: __dirname,
		projectId: 'blockera',
		e2eSpecPattern: [
			'packages/**-one/**/*.e2e.cy.js',
			'tests/**-one/**/*.e2e.cy.js',
			'packages/**-one/**/*.visual.cy.js',
			'tests/**-one/**/*.visual.cy.js',
		],
		e2eExcludeSpecPattern: ['packages/**-one/**/*.build.e2e.js'],
		alwaysExcludeSpecPattern: ['packages/**/*.build.e2e.js'],
		componentSpecPattern: 'packages/**-one/**/test/*.cy.js',
		componentExcludeSpecPattern: [
			'**-one/**/*.e2e.cy.js',
			'**-one/**/*.visual.cy.js',
		],
	});
