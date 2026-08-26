#!/usr/bin/env php
<?php

/**
 * Generates the production (theme build) version of `./bin/build-theme-zip.sh`,
 * containing alternate `define` statements from the development version.
 *
 * Package discovery mirrors the Blockera plugin zip generator: shared packages live
 * under `packages/global-packages/packages`, plus theme-local packages under `packages/`
 * (excluding the submodule checkout itself).
 *
 * @package blockera-build
 */

$f = fopen(dirname(__DIR__) . '/bin/build-theme-zip.sh', 'r');
$repo_root = dirname(__DIR__);
$packages_root = $repo_root . '/packages/global-packages/packages';
$local_packages_root = $repo_root . '/packages';

/**
 * Collect package directories from a root, expanding blocks-library / features-library.
 *
 * @param string $root Absolute packages root.
 * @return array<int, string>
 */
$collect_package_dirs = static function (string $root): array {
	$all_dirs = glob($root . '/*') ?: [];
	$result = [];

	foreach ($all_dirs as $dir) {
		if (! is_dir($dir)) {
			continue;
		}

		// Skip the global-packages submodule checkout when scanning theme-local packages/.
		if (basename($dir) === 'global-packages') {
			continue;
		}

		if (substr($dir, -strlen('/blocks-library')) === '/blocks-library') {
			foreach (glob($dir . '/*', GLOB_ONLYDIR) as $subdir) {
				$result[] = $subdir;
			}
		} elseif (substr($dir, -strlen('/features-library')) === '/features-library') {
			foreach (glob($dir . '/*', GLOB_ONLYDIR) as $subdir) {
				$result[] = $subdir;
			}
		} else {
			$result[] = $dir;
		}
	}

	return $result;
};

$filtered_packages = array_filter(
	array_merge(
		$collect_package_dirs($packages_root),
		$collect_package_dirs($local_packages_root)
	),
	function (string $package_name): string {

		// filter dev tools packages.
		if (preg_match('/dev-(.*)/', $package_name)) {

			return false;
		}

		// filter invalid packages.
		if (! is_dir($package_name . '/php') &&
			! is_dir($package_name . '/core/php') &&
			! is_dir($package_name . '/src')
		) {
			return false;
		}

		return true;
	}
);

$packages = array_map(
	function (string $package_name) use ($packages_root, $local_packages_root) {

		$package_name = str_replace('\\', '/', $package_name);
		$global_root = (realpath($packages_root) ?: $packages_root) . '/';
		$local_root = (realpath($local_packages_root) ?: $local_packages_root) . '/';

		if (0 === strpos($package_name, $global_root) || false !== strpos($package_name, '/packages/global-packages/packages/')) {
			$package_name = str_replace($global_root, '', $package_name);
			$package_name = preg_replace('#^.*/packages/global-packages/packages/#', '', $package_name);
			$composer_root = $global_root;
		} else {
			$package_name = str_replace($local_root, '', $package_name);
			$package_name = preg_replace('#^.*/packages/#', '', $package_name);
			$composer_root = $local_root;
		}

		if (preg_match('/\bblocks-library\b/', $package_name) || preg_match('/\bfeatures-library\b/', $package_name)) {
			ob_start();
			include $composer_root . $package_name . '/composer.json';
			$composer_package_name = str_replace('blockera/', '', json_decode(ob_get_clean(), true)['name']);

			$package_name = $composer_package_name;
		}

		return $package_name;
	},
	$filtered_packages
);

// Keep a stable unique list (local blockera-one + shared packages).
$packages = array_values(array_unique($packages));

$internal_packages = array_filter(
	$packages,
	function (string $package_name): string {

		if (preg_match('/-sdk$/', $package_name)) {
			return false;
		}

		return true;
	}
);

$sdks = array_diff($packages, $internal_packages);

$inside_pattern_block = false;

while (true) {
	$line = fgets($f);
	if (false === $line) {
		break;
	}

	switch (trim($line)) {

		case '### END AUTO-GENERATED VENDOR PACKAGES PATH PATTERN':
			$inside_pattern_block = false;
			break;

		case '### BEGIN AUTO-GENERATED VENDOR PACKAGES PATH PATTERN':
			$inside_pattern_block = true;

			echo implode(PHP_EOL, array_map(function (string $name): string {

				return sprintf(
					'	$(find ./vendor/blockera/%1$s/ -type f ! -path "*/tests/*" \( -name "*.php" -o -name "*.json" -o -name "*.css" \)) \\',
					$name
				);
			}, $internal_packages));

			if (! empty($sdks)) {
				echo PHP_EOL;
			}

			echo implode(
				PHP_EOL,
				array_map(function (string $name): string {

					return sprintf(
						'	$(find ./vendor/blockera/%1$s/ ! -path "*/tests/*") \\',
						$name
					);
				}, $sdks)
			);

			echo PHP_EOL;

			break;

		default:
			if (! $inside_pattern_block) {

				echo $line;
			}
			break;
	}
}

fclose($f);
