// Edit packages/global-packages/packages/dev-tools/root-configs/cypress.config.blockera-one.js
// project:bootstrap copies this to the host repo root for --project=blockera-one.
const ONE_PACKAGE_GLOBS = [
	'packages/*-one/**',
	'packages/*-one-*/**',
	'packages/global-packages/packages/**/*-one/**',
	'packages/global-packages/packages/**/*-one-*/**',
];

const ONE_TEST_GLOBS = [ 'tests/**/*-one/**', 'tests/**/*-one-*/**' ];

module.exports =
	require( './packages/global-packages/packages/dev-tools/js/cypress/config' )(
		{
			rootDir: __dirname,
			projectId: 'blockera',
			e2eSpecPattern: [
				...ONE_PACKAGE_GLOBS.flatMap( ( glob ) => [
					`${ glob }*.e2e.cy.js`,
					`${ glob }*.visual.cy.js`,
				] ),
				...ONE_TEST_GLOBS.flatMap( ( glob ) => [
					`${ glob }*.e2e.cy.js`,
					`${ glob }*.visual.cy.js`,
				] ),
			],
			e2eExcludeSpecPattern: ONE_PACKAGE_GLOBS.map(
				( glob ) => `${ glob }*.build.e2e.js`
			),
			alwaysExcludeSpecPattern: [ 'packages/**/*.build.e2e.js' ],
			componentSpecPattern: ONE_PACKAGE_GLOBS.map(
				( glob ) => `${ glob }/test/*.cy.js`
			),
			componentExcludeSpecPattern: [
				'**/*-one/**/*.e2e.cy.js',
				'**/*-one-*/**/*.e2e.cy.js',
				'**/*-one/**/*.visual.cy.js',
				'**/*-one-*/**/*.visual.cy.js',
			],
		}
	);
