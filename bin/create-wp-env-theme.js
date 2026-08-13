#!/usr/bin/env node
/**
 * Theme wp-env builder: category config from `.github/wp-env-configs/{category}.json`
 * with optional `.pr-env.json` overlay (same idea as Blockera Pro).
 *
 * `.pr-env.json` `plugins` replaces the category plugins list (does not merge),
 * so a PR can pin the companion Blockera plugin to a branch, tree URL, or
 * Actions artifact. Zip/HTTP sources are used as-is; GitHub tree/artifact/branch
 * refs are downloaded via download-artifact.sh.
 *
 * Usage: node bin/create-wp-env-theme.js <category>
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [category] = process.argv.slice(2);

if (!category) {
	console.error('create-wp-env-theme: category argument is required');
	process.exit(1);
}

const ARTIFACT_URL_PATTERN =
	/^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/\d+\/artifacts\/\d+\/?$/;

const GITHUB_TREE_URL_PATTERN =
	/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/(.+?)\/?$/;

const DEFAULT_FREE_REPO = {
	owner: 'blockeraai',
	repo: 'blockera',
	branch: 'master',
};

const FREE_EXTRACT_DIR = '.github/cache/blockera-free';
const DOWNLOAD_SCRIPT = path.join(
	__dirname,
	'../packages/global-packages/packages/dev-tools/github/scripts/download-artifact.sh'
);

function requireGitHubToken() {
	if (!process.env.GITHUB_TOKEN) {
		throw new Error(
			'GITHUB_TOKEN is required to download GitHub Actions artifacts for wp-env. ' +
				'Set secrets.BLOCKERABOT_PAT on the Cypress E2E workflow job.'
		);
	}
}

function isLocalOrDotSource(pluginSource) {
	return (
		pluginSource === '.' ||
		pluginSource.startsWith('./') ||
		pluginSource.startsWith('../') ||
		pluginSource.startsWith('/')
	);
}

function isHttpUrl(pluginSource) {
	return /^https?:\/\//.test(pluginSource);
}

function isBranchName(pluginSource) {
	return !isLocalOrDotSource(pluginSource) && !isHttpUrl(pluginSource);
}

function parseGitHubTreeUrl(pluginSource) {
	const match = pluginSource.match(GITHUB_TREE_URL_PATTERN);
	if (!match) {
		return null;
	}

	return {
		owner: match[1],
		repo: match[2],
		branch: decodeURIComponent(match[3]),
	};
}

function downloadFreeArtifact(args, label) {
	requireGitHubToken();

	const resolvedPath = execFileSync(
		'bash',
		[DOWNLOAD_SCRIPT, ...args, '--extract-dir', FREE_EXTRACT_DIR],
		{
			encoding: 'utf8',
			env: process.env,
			stdio: ['ignore', 'pipe', 'inherit'],
		}
	).trim();

	if (!resolvedPath) {
		throw new Error(
			`Failed to download Blockera plugin artifact: ${label}`
		);
	}

	console.log(
		`Resolved Blockera companion (${label}) to local wp-env source: ${resolvedPath}`
	);
	return resolvedPath;
}

function downloadFreeBranch({ owner, repo, branch }, label) {
	return downloadFreeArtifact(
		['--owner', owner, '--repo', repo, '--branch', branch],
		label
	);
}

function resolvePluginSource(pluginSource) {
	if (ARTIFACT_URL_PATTERN.test(pluginSource)) {
		return downloadFreeArtifact(['--url', pluginSource], pluginSource);
	}

	const treeRef = parseGitHubTreeUrl(pluginSource);
	if (treeRef) {
		return downloadFreeBranch(
			treeRef,
			`${treeRef.owner}/${treeRef.repo}@${treeRef.branch}`
		);
	}

	if (isBranchName(pluginSource)) {
		return downloadFreeBranch(
			{ ...DEFAULT_FREE_REPO, branch: pluginSource },
			`blockeraai/blockera@${pluginSource}`
		);
	}

	return pluginSource;
}

function resolvePlugins(plugins) {
	return plugins
		.filter((pluginSource) => pluginSource && pluginSource !== '.')
		.map(resolvePluginSource);
}

function getPlugins(categoryConfig, prEnv) {
	if (Array.isArray(prEnv.plugins) && prEnv.plugins.length) {
		console.log('create-wp-env-theme: using plugins from .pr-env.json');
		return prEnv.plugins;
	}

	return Array.isArray(categoryConfig.plugins) ? categoryConfig.plugins : [];
}

let prEnv = {};
if (fs.existsSync('.pr-env.json')) {
	prEnv = JSON.parse(fs.readFileSync('.pr-env.json', 'utf-8'));
	console.log('create-wp-env-theme: overlay .pr-env.json');
}

let wpEnvFilePath = `.github/wp-env-configs/${category}.json`;
if (!fs.existsSync(wpEnvFilePath)) {
	wpEnvFilePath = '.github/wp-env-configs/base.json';
}

console.log(`create-wp-env-theme: base config ${wpEnvFilePath}`);
const categoryConfig = JSON.parse(fs.readFileSync(wpEnvFilePath, 'utf-8'));

const core = prEnv.core || categoryConfig.core;
const wpEnvContent = {
	...(core ? { core } : {}),
	themes: categoryConfig.themes || ['.'],
	plugins: [...new Set(resolvePlugins(getPlugins(categoryConfig, prEnv)))],
	config: {
		WP_DEBUG: false,
		SCRIPT_DEBUG: false,
		BLOCKERA_TELEMETRY_OPT_IN_OFF: true,
		...(categoryConfig.config || {}),
		...(prEnv.config || {}),
	},
	...(categoryConfig.lifecycleScripts || prEnv.lifecycleScripts
		? {
				lifecycleScripts:
					prEnv.lifecycleScripts || categoryConfig.lifecycleScripts,
			}
		: {}),
};

fs.writeFileSync(
	'.wp-env.json',
	JSON.stringify(wpEnvContent, null, 2),
	'utf-8'
);
