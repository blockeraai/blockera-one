#!/bin/bash

# Exit if any command fails.
set -e

# Change to the expected directory.
cd "$(dirname "$0")"
cd ..

# Enable nicer messaging for build status.
BLUE_BOLD='\033[1;34m';
GREEN_BOLD='\033[1;32m';
RED_BOLD='\033[1;31m';
YELLOW_BOLD='\033[1;33m';
COLOR_RESET='\033[0m';
error () {
	echo -e "\n${RED_BOLD}$1${COLOR_RESET}\n"
}
status () {
	echo -e "\n${BLUE_BOLD}$1${COLOR_RESET}\n"
}
success () {
	echo -e "\n${GREEN_BOLD}$1${COLOR_RESET}\n"
}
warning () {
	echo -e "\n${YELLOW_BOLD}$1${COLOR_RESET}\n"
}

status "💃 Time to build the Blockera One theme ZIP file 🕺"

if [ -z "$NO_CHECKS" ]; then
	# Make sure there are no changes in the working tree. Release builds should be
	# traceable to a particular commit and reliably reproducible.
	changed=
	if ! git diff --exit-code > /dev/null; then
		changed="file(s) modified"
	elif ! git diff --cached --exit-code > /dev/null; then
		changed="file(s) staged"
	fi
	if [ ! -z "$changed" ]; then
		git status
		error "ERROR: Cannot build theme zip with dirty working tree. ☝️
		Commit your changes and try again."
		exit 1
	fi

	# Do a dry run of the repository reset. Prompting the user for a list of all
	# files that will be removed should prevent them from losing important files!
	status "Resetting the repository to pristine condition. ✨"
	git_clean_excludes=(
		--exclude=packages/global-packages
		--exclude=packages/global-packages/**
	)
	to_clean=$(git clean -xdf --dry-run "${git_clean_excludes[@]}")
	if [ ! -z "$to_clean" ]; then
		echo $to_clean
		warning "🚨 About to delete everything above! Is this okay? 🚨"
		echo -n "[y]es/[N]o: "
		read answer
		if [ "$answer" != "${answer#[Yy]}" ]; then
			# Remove ignored files to reset repository to pristine condition. Previous
			# test ensures that changed files abort the theme build.
			status "Cleaning working directory... 🛀"
			git clean -xdf "${git_clean_excludes[@]}"
		else
			error "Fair enough; aborting. Tidy up your repo and try again. 🙂"
			exit 1
		fi
	fi
fi

# Clean old and extra files
status "Cleaning build files... 🗂"
rm -r -f dist

# Run the build.
status "Installing dependencies... 📦"
if [ -z "$NO_INSTALL_COMPOSER" ]; then
  composer install --no-dev -o --apcu-autoloader -a
fi
if [ -z "$NO_INSTALL_NPM" ]; then
  npm i
fi

status "Generating build... 🗂"
npm run build


# Temporarily modify `blockera.php` with production constants defined.
# Use a temp file because `bin/generate-blockera-php.php` reads from `blockera.php`
# so we need to avoid writing to that file at the same time.
status "Generating blockera.php 📝"
php bin/generate-blockera-php.php > blockera.tmp.php
mv blockera.tmp.php blockera.php


# Temporarily modify `readme.txt`.
# Use a temp file because `bin/generate-readme-txt.php` reads from `readme.txt`
# so we need to avoid writing to that file at the same time.
status "Generating readme.txt 📝"
php bin/generate-readme-txt.php > readme.tmp.txt
mv readme.tmp.txt readme.txt

strip_dev_only_local_experimental_config () {
  local input_file="$1"
  local output_file="$2"

  php -r '
    $in = $argv[1];
    $out = $argv[2];
    $c = file_get_contents($in);
    if ($c === false) { fwrite(STDERR, "Failed to read: $in\n"); exit(1); }
    $re = "/^[ \\t]*### BEGIN DEV-ONLY LOCAL EXPERIMENTAL CONFIG\\R[\\s\\S]*?^[ \\t]*### END DEV-ONLY LOCAL EXPERIMENTAL CONFIG\\R?/m";
    $c2 = preg_replace($re, "", $c);
    if ($c2 === null) { fwrite(STDERR, "preg_replace failed for: $in\n"); exit(1); }
    if (file_put_contents($out, $c2) === false) { fwrite(STDERR, "Failed to write: $out\n"); exit(1); }
  ' "$input_file" "$output_file"
}

# Shared packages live in packages/global-packages/packages and are consumed via
# Composer path repos (vendor/blockera/*). Prefer vendor, then submodule checkout.
resolve_shared_package_file () {
	local relative_path="$1"
	local candidates=(
		"vendor/blockera/${relative_path}"
		"packages/global-packages/packages/${relative_path}"
	)
	local candidate
	for candidate in "${candidates[@]}"; do
		if [ -f "${candidate}" ]; then
			printf '%s\n' "${candidate}"
			return 0
		fi
	done
	return 1
}

# Temporary copy some PHP files into "inc" directory.
status "Stripping dev-only local experimental config 🧽"
strip_dev_only_local_experimental_config "config/panel.php" "config/panel.tmp.php"
mv "config/panel.tmp.php" "config/panel.php"

ENV_FUNCTIONS_FILE="$(resolve_shared_package_file "env/php/functions.php" || true)"
if [ -z "${ENV_FUNCTIONS_FILE}" ]; then
	error "ERROR: Could not find env/php/functions.php under vendor/blockera or packages/global-packages/packages."
fi
strip_dev_only_local_experimental_config "${ENV_FUNCTIONS_FILE}" "${ENV_FUNCTIONS_FILE}.tmp"
mv "${ENV_FUNCTIONS_FILE}.tmp" "${ENV_FUNCTIONS_FILE}"



status "Generating inc/app.php 📝"
mkdir -p "inc"
APP_PHP_FILE="$(resolve_shared_package_file "blockera/php/app.php" || true)"
if [ -z "${APP_PHP_FILE}" ]; then
	error "ERROR: Could not find blockera/php/app.php under vendor/blockera or packages/global-packages/packages."
fi
cp "${APP_PHP_FILE}" inc/app.php
COORDINATOR_BOOTSTRAP="$(resolve_shared_package_file "autoloader-coordinator/bootstrap.php" || true)"
COORDINATOR_CLASS="$(resolve_shared_package_file "autoloader-coordinator/class-shared-autoload-coordinator.php" || true)"
if [ -z "${COORDINATOR_BOOTSTRAP}" ] || [ -z "${COORDINATOR_CLASS}" ]; then
	error "ERROR: Could not find autoloader-coordinator under vendor/blockera or packages/global-packages/packages."
fi
cp "${COORDINATOR_CLASS}" inc/class-shared-autoload-coordinator.php
cp "${COORDINATOR_BOOTSTRAP}" inc/bootstrap.php

build_files=$(
	ls dist/*/*.{min.js,min.css,asset.php} \
)

vendor_without_blockera=$(
  find ./vendor -type f -not -path "./vendor/blockera" \
);

# Generate the theme zip file.
status "Creating archive... 🎁"
zip -r -q blockera-one.zip \
	style.css \
	style.min.css \
	functions.php \
	index.php \
	theme.json \
	screenshot.png \
	templates \
	parts \
	patterns \
	styles \
	images \
	inc \
	config \
	assets \
	bootstrap \
	blockera.php \
	readme.txt \
	languages \
	$build_files \
	changelog.txt \
	composer.json \
	experimental.config.json \
	$vendor_without_blockera \
  ### BEGIN AUTO-GENERATED VENDOR PACKAGES PATH PATTERN
  ### END AUTO-GENERATED VENDOR PACKAGES PATH PATTERN
  && echo "blockera-one.zip created successfully ✅" || echo "blockera-one.zip creation failed ❌"

# Guard against incomplete shared-package packaging (causes WP Playground fatals on activate).
if [ ! -f blockera-one.zip ]; then
	error "ERROR: blockera-one.zip was not created."
	exit 1
fi
if ! zipinfo -1 blockera-one.zip | grep -qx 'vendor/blockera/blockera/php/functions.php'; then
	error "ERROR: blockera-one.zip is missing vendor/blockera/blockera/php/functions.php.
Shared packages under packages/global-packages/packages were not packed. Check bin/generate-build-theme-zip-sh.php."
	exit 1
fi

status "Cleaning up... 🧹"

# Reset `blockera.php`.
git checkout blockera.php

# Reset `readme.txt`.
git checkout readme.txt

# Reset stripped files.
git checkout config/panel.php
# Shared env package lives in the submodule (or vendor symlink into it).
if [ -n "${ENV_FUNCTIONS_FILE:-}" ]; then
	if [[ "${ENV_FUNCTIONS_FILE}" == packages/global-packages/* ]]; then
		git -C packages/global-packages checkout -- "${ENV_FUNCTIONS_FILE#packages/global-packages/}"
	elif [[ "${ENV_FUNCTIONS_FILE}" == vendor/blockera/* ]] && [ -L vendor/blockera/env ]; then
		git -C packages/global-packages checkout -- packages/env/php/functions.php
	fi
fi

success "Done ✅ You've built Blockera One! 🎉 "
