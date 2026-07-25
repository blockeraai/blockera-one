#!/usr/bin/env bash
# Run PHPUnit only for theme packages ending with -one / blockera-one-*.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

dirs=()
while IFS= read -r dir; do
	[ -z "$dir" ] && continue
	dirs+=("$dir")
done < <(node .github/scripts/list-phpunit-one-test-dirs.js)

if [ "${#dirs[@]}" -eq 0 ]; then
	echo "No PHPUnit tests under packages/*-one or packages/blockera-one-*; skipping."
	exit 0
fi

echo "Running PHPUnit for -one package dirs:"
printf '  %s\n' "${dirs[@]}"

wp-env run --env-cwd='wp-content/themes/blockera-one' tests-wordpress \
	vendor/bin/phpunit -c phpunit.xml.dist --verbose "${dirs[@]}"
