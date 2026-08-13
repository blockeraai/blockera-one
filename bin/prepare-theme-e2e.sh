#!/usr/bin/env bash
# Theme Cypress E2E prepare: category wp-env config, with .pr-env.json overlay
# for the companion-plugin matrix (Blockera plugin source).
#
# Required env:
#   BLOCKERA_E2E_CATEGORY
# Optional:
#   GITHUB_TOKEN (BLOCKERABOT_PAT) when .pr-env.json uses a GitHub tree/artifact/branch
set -euo pipefail

CATEGORY="${BLOCKERA_E2E_CATEGORY:-}"
if [[ -z "${CATEGORY}" ]]; then
	echo "cypress-e2e/prepare-theme: BLOCKERA_E2E_CATEGORY is required" >&2
	exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WP_ENV_CONFIG_DIR="${BLOCKERA_E2E_WP_ENV_CONFIG_DIR:-.github/wp-env-configs}"

if [[ "${CATEGORY}" == "companion-plugin" ]]; then
	echo "cypress-e2e/prepare-theme: node ${SCRIPT_DIR}/create-wp-env-theme.js ${CATEGORY}"
	node "${SCRIPT_DIR}/create-wp-env-theme.js" "${CATEGORY}"
else
	WP_ENV_CONFIG="${WP_ENV_CONFIG_DIR}/base.json"
	if [[ -f "${WP_ENV_CONFIG_DIR}/${CATEGORY}.json" ]]; then
		WP_ENV_CONFIG="${WP_ENV_CONFIG_DIR}/${CATEGORY}.json"
	fi
	echo "cypress-e2e/prepare-theme: using ${WP_ENV_CONFIG}"
	cp "${WP_ENV_CONFIG}" .wp-env.json
fi

cat .wp-env.json

{
	echo "APP_MODE=production"
	echo "DB=wp_tests"
	echo "CI_ENV=true"
} >.env
cat .env
