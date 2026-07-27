<?php
/**
 * Popular Block Themes Report
 *
 * Browser-accessible development tool for browsing WordPress.org block themes
 * (full-site-editing) with active installs, tags, and author aggregates.
 *
 * Access via: http://yoursite.local/wp-content/themes/blockera-one/bin/popular-block-themes/
 *
 * Only works in development mode (WP_DEBUG).
 */

header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$cache_file = __DIR__ . '/cache.json';

/**
 * Resolve and load wp-load.php from common theme install depths.
 *
 * @return bool
 */
function pbt_bootstrap_wordpress() {
	$wp_load_paths = [
		dirname(__DIR__, 5) . '/wp-load.php', // .../themes/blockera-one/bin/tool → ABSPATH
		dirname(__DIR__, 4) . '/wp-load.php',
		dirname(__DIR__, 6) . '/wp-load.php',
	];

	foreach ($wp_load_paths as $wp_path) {
		if (file_exists($wp_path)) {
			require_once $wp_path;
			return true;
		}
	}

	return false;
}

if (!defined('WP_DEBUG') || !WP_DEBUG) {
	$wp_loaded = pbt_bootstrap_wordpress();

	if (!$wp_loaded || (!defined('WP_DEBUG') || !WP_DEBUG)) {
		die('This tool is only available in development mode. Set WP_DEBUG to true in wp-config.php');
	}
} elseif (!defined('ABSPATH')) {
	pbt_bootstrap_wordpress();
}

/**
 * Send a JSON response and exit.
 *
 * @param array $payload Response body.
 * @param int   $status  HTTP status.
 */
function pbt_json_response(array $payload, $status = 200) {
	status_header($status);
	header('Content-Type: application/json; charset=utf-8');
	echo wp_json_encode($payload);
	exit;
}

$action = isset($_REQUEST['action']) ? sanitize_key(wp_unslash($_REQUEST['action'])) : '';

if ($action === 'clear-cache') {
	if (file_exists($cache_file)) {
		unlink($cache_file);
	}
	pbt_json_response(['success' => true]);
}

if ($action === 'save-cache') {
	$raw = file_get_contents('php://input');
	if ($raw === false || $raw === '') {
		pbt_json_response(['success' => false, 'error' => 'Empty body'], 400);
	}

	$data = json_decode($raw, true);
	if (!is_array($data) || !isset($data['themes']) || !is_array($data['themes'])) {
		pbt_json_response(['success' => false, 'error' => 'Invalid JSON'], 400);
	}

	$payload = [
		'cached_at' => isset($data['cached_at']) ? (string) $data['cached_at'] : gmdate('c'),
		'themes'    => $data['themes'],
	];

	$written = file_put_contents(
		$cache_file,
		wp_json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
	);

	if ($written === false) {
		pbt_json_response(['success' => false, 'error' => 'Failed to write cache'], 500);
	}

	pbt_json_response([
		'success'   => true,
		'cached_at' => $payload['cached_at'],
		'count'     => count($payload['themes']),
	]);
}

if ($action === 'scrape-patterns') {
	$slug = isset($_REQUEST['slug']) ? sanitize_title(wp_unslash($_REQUEST['slug'])) : '';
	if ($slug === '') {
		pbt_json_response(['success' => false, 'error' => 'Missing slug'], 400);
	}

	$url = 'https://wordpress.org/themes/' . rawurlencode($slug) . '/';
	$response = wp_remote_get(
		$url,
		[
			'timeout'    => 45,
			'redirection' => 3,
			'headers'    => [
				'Accept' => 'text/html',
			],
			'user-agent' => 'BlockeraOnePopularBlockThemes/1.0; (+local-dev-tool)',
		]
	);

	if (is_wp_error($response)) {
		pbt_json_response(
			[
				'success' => false,
				'slug'    => $slug,
				'error'   => $response->get_error_message(),
			],
			502
		);
	}

	$code = (int) wp_remote_retrieve_response_code($response);
	$body = (string) wp_remote_retrieve_body($response);

	if ($code < 200 || $code >= 300 || $body === '') {
		pbt_json_response(
			[
				'success' => false,
				'slug'    => $slug,
				'error'   => 'HTTP ' . $code,
			],
			502
		);
	}

	$patterns_count = null;

	// Prefer totalCount from the theme-patterns block initial state.
	if (preg_match(
		'/wp-block-wporg-theme-patterns[^>]*data-initial-state="([^"]+)"/',
		$body,
		$m
	) || preg_match(
		'/data-initial-state="([^"]*totalCount[^"]*)"/',
		$body,
		$m
	)) {
		$state_json = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
		$state      = json_decode($state_json, true);
		if (is_array($state) && array_key_exists('totalCount', $state)) {
			$patterns_count = (int) $state['totalCount'];
		}
	}

	// Fallback: count pattern items on the page.
	if ($patterns_count === null) {
		$match_count = preg_match_all('/data-pattern_name="/', $body);
		$patterns_count = false === $match_count ? 0 : (int) $match_count;
	}

	// Style variations: unique style_variation= slugs inside the style-variations block.
	$style_variations_count = 0;
	$styles_chunk           = $body;
	if (preg_match(
		'/wp-block-wporg-theme-style-variations([\s\S]*?)(?=wp-block-wporg-theme-patterns|$)/',
		$body,
		$styles_m
	)) {
		$styles_chunk = $styles_m[1];
	}

	$style_slugs = [];
	if (preg_match_all('/style_variation%3D([a-z0-9_-]+)/i', $styles_chunk, $sm)) {
		foreach ($sm[1] as $style_slug) {
			$style_slugs[ strtolower($style_slug) ] = true;
		}
	}
	if (preg_match_all('/style_variation=([a-z0-9_-]+)/i', $styles_chunk, $sm2)) {
		foreach ($sm2[1] as $style_slug) {
			$style_slugs[ strtolower($style_slug) ] = true;
		}
	}
	$style_variations_count = count($style_slugs);

	pbt_json_response(
		[
			'success'                => true,
			'slug'                   => $slug,
			'patterns_count'         => $patterns_count,
			'style_variations_count' => $style_variations_count,
		]
	);
}

$themes    = [];
$cached_at = null;

if (is_readable($cache_file)) {
	$cache_raw = file_get_contents($cache_file);
	if ($cache_raw !== false && $cache_raw !== '') {
		$cache_data = json_decode($cache_raw, true);
		if (is_array($cache_data) && isset($cache_data['themes']) && is_array($cache_data['themes'])) {
			$themes    = $cache_data['themes'];
			$cached_at = isset($cache_data['cached_at']) ? (string) $cache_data['cached_at'] : null;
		}
	}
}

$themes_json    = wp_json_encode($themes, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$cached_at_json = wp_json_encode($cached_at, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Popular Block Themes - Blockera One</title>
	<link rel="stylesheet" href="style.css">
</head>
<body>
	<div class="header">
		<div class="header-content">
			<h1>Popular Block Themes</h1>
			<div class="stats-container">
				<div class="stat">
					<span class="stat-label">Themes</span>
					<span class="stat-value total" id="stat-themes">0</span>
				</div>
				<div class="stat">
					<span class="stat-label">Authors</span>
					<span class="stat-value total" id="stat-authors">0</span>
				</div>
				<div class="stat">
					<span class="stat-label">Fetched</span>
					<span class="stat-value progress" id="stat-progress">—</span>
				</div>
				<div class="stat">
					<span class="stat-label">Cached at</span>
					<span class="stat-value cached" id="stat-cached">No cache</span>
				</div>
			</div>

			<div class="controls-row">
				<nav class="section-nav" aria-label="Tables">
					<button type="button" class="nav-btn active" data-target="themes-section">Themes</button>
					<button type="button" class="nav-btn" data-target="authors-section">Authors</button>
				</nav>

				<div class="control-group">
					<label class="control-label" for="search-input">Search</label>
					<input type="search" id="search-input" class="control-input" placeholder="Name, slug, author…">
				</div>

				<div class="control-group dropdown-group">
					<button type="button" class="control-btn" id="tags-toggle" aria-expanded="false" aria-controls="tags-panel">
						Tags
					</button>
					<div class="dropdown-panel" id="tags-panel" hidden>
						<div class="dropdown-actions">
							<button type="button" class="link-btn" id="tags-clear">Clear tags</button>
						</div>
						<div class="checkbox-list" id="tags-list"></div>
					</div>
				</div>

				<div class="control-group dropdown-group">
					<button type="button" class="control-btn" id="columns-toggle" aria-expanded="false" aria-controls="columns-panel">
						Columns
					</button>
					<div class="dropdown-panel" id="columns-panel" hidden>
						<div class="dropdown-actions">
							<button type="button" class="link-btn" id="columns-reset">Reset to defaults</button>
						</div>
						<div class="checkbox-list" id="columns-list"></div>
					</div>
				</div>

				<button type="button" class="control-btn danger" id="clear-cache-btn">Clear Cache</button>
			</div>
		</div>
	</div>

	<div class="progress-indicator" id="progress-indicator">
		<div class="header-content">
			<div class="progress-text" id="progress-text">Ready</div>
			<div class="progress-log" id="progress-log"></div>
		</div>
	</div>

	<div class="container">
		<section class="table-section" id="themes-section">
			<h2 class="section-title">Themes</h2>
			<div class="table-wrap">
				<table class="data-table" id="themes-table">
					<thead id="themes-thead"></thead>
					<tbody id="themes-tbody"></tbody>
					<tfoot id="themes-tfoot"></tfoot>
				</table>
			</div>
		</section>

		<section class="table-section" id="authors-section">
			<h2 class="section-title">Authors</h2>
			<div class="table-wrap">
				<table class="data-table" id="authors-table">
					<thead id="authors-thead"></thead>
					<tbody id="authors-tbody"></tbody>
					<tfoot id="authors-tfoot"></tfoot>
				</table>
			</div>
		</section>
	</div>

	<script>
		const bootstrapThemes = <?php echo $themes_json ? $themes_json : '[]'; ?>;
		const bootstrapCachedAt = <?php echo $cached_at_json ? $cached_at_json : 'null'; ?>;
	</script>
	<script src="script.js"></script>
</body>
</html>
