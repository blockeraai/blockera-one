/**
 * Internal dependencies
 */
const {
	createPluginCliConfig,
} = require('../../packages/global-packages/packages/dev-tools/bin/plugin/create-config');

const gitRepoOwner = 'blockeraai';

module.exports = createPluginCliConfig({
	slug: 'blockera-one',
	name: 'Blockera One',
	team: 'Blockeraai',
	githubRepositoryOwner: gitRepoOwner,
	githubRepositoryName: 'blockera-one',
	pluginEntryPoint: 'style.css',
	buildZipCommand: '/bin/bash bin/build-theme-zip.temp.sh',
	githubRepositoryURL:
		'https://github.com/' + gitRepoOwner + '/blockera-one/',
	wpRepositoryReleasesURL:
		'https://github.com/' + gitRepoOwner + '/blockera-one/releases/',
	gitRepositoryURL:
		'https://github.com/' + gitRepoOwner + '/blockera-one.git',
	svnRepositoryURL: '',
	changelog: {
		archiveUrl:
			'https://github.com/' + gitRepoOwner + '/blockera-one/releases',
		archiveLabel: 'Blockera One',
		includeCommitCount: true,
	},
});
