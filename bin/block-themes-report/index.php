<?php
/**
 * Block Themes Report
 *
 * Browser-accessible development tool for browsing WordPress.org block themes
 * (full-site-editing) with active installs, tags, and author aggregates.
 *
 * Access via: http://yoursite.local/wp-content/themes/blockera-one/bin/block-themes-report/
 *
 * Only works in development mode (WP_DEBUG).
 */

header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$cache_dir           = __DIR__;
$cache_themes_file   = $cache_dir . '/cache-themes.json';
$cache_patterns_file = $cache_dir . '/cache-patterns.json';
$cache_reviews_file  = $cache_dir . '/cache-reviews.json';
$theme_notes_file    = $cache_dir . '/theme-notes.json';
$cache_legacy_file   = $cache_dir . '/cache.json';

/**
 * Resolve and load wp-load.php from common theme install depths.
 *
 * @return bool
 */
function btr_bootstrap_wordpress() {
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
	$wp_loaded = btr_bootstrap_wordpress();

	if (!$wp_loaded || (!defined('WP_DEBUG') || !WP_DEBUG)) {
		die('This tool is only available in development mode. Set WP_DEBUG to true in wp-config.php');
	}
} elseif (!defined('ABSPATH')) {
	btr_bootstrap_wordpress();
}

/**
 * Send a JSON response and exit.
 *
 * @param array $payload Response body.
 * @param int   $status  HTTP status.
 */
function btr_json_response(array $payload, $status = 200) {
	status_header($status);
	header('Content-Type: application/json; charset=utf-8');
	echo wp_json_encode($payload);
	exit;
}

/**
 * Read and decode a JSON cache file.
 *
 * @param string $path Absolute path.
 * @return array|null Decoded array or null.
 */
function btr_read_cache_file($path) {
	if (!is_readable($path)) {
		return null;
	}
	$raw = file_get_contents($path);
	if ($raw === false || $raw === '') {
		return null;
	}
	$data = json_decode($raw, true);
	return is_array($data) ? $data : null;
}

/**
 * Write a cache payload as JSON.
 *
 * @param string $path    Absolute path.
 * @param array  $payload Data to write.
 * @return bool
 */
function btr_write_cache_file($path, array $payload) {
	$written = file_put_contents(
		$path,
		wp_json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
	);
	return $written !== false;
}

/**
 * Resolve cache/notes file path for a storage type.
 *
 * @param string $type themes|patterns|reviews|notes
 * @return string|null
 */
function btr_cache_path_for_type($type) {
	global $cache_themes_file, $cache_patterns_file, $cache_reviews_file, $theme_notes_file;

	if ($type === 'themes') {
		return $cache_themes_file;
	}
	if ($type === 'patterns') {
		return $cache_patterns_file;
	}
	if ($type === 'reviews') {
		return $cache_reviews_file;
	}
	if ($type === 'notes') {
		return $theme_notes_file;
	}
	return null;
}

/**
 * One-time migrate legacy cache.json into split cache files.
 */
function btr_migrate_legacy_cache() {
	global $cache_legacy_file, $cache_themes_file, $cache_patterns_file, $cache_reviews_file;

	if (!is_readable($cache_legacy_file)) {
		return;
	}

	$themes_exists   = is_readable($cache_themes_file);
	$patterns_exists = is_readable($cache_patterns_file);
	$reviews_exists  = is_readable($cache_reviews_file);

	// Only migrate when none of the new files exist yet.
	if ($themes_exists || $patterns_exists || $reviews_exists) {
		return;
	}

	$legacy = btr_read_cache_file($cache_legacy_file);
	if ($legacy === null || !isset($legacy['themes']) || !is_array($legacy['themes'])) {
		return;
	}

	$cached_at = isset($legacy['cached_at']) ? (string) $legacy['cached_at'] : gmdate('c');
	$themes_out = [];
	$patterns_by_slug = [];
	$reviews_by_slug  = [];

	foreach ($legacy['themes'] as $theme) {
		if (!is_array($theme) || empty($theme['slug'])) {
			continue;
		}
		$slug = (string) $theme['slug'];

		$patterns_count         = array_key_exists('patterns_count', $theme) ? $theme['patterns_count'] : null;
		$style_variations_count = array_key_exists('style_variations_count', $theme)
			? $theme['style_variations_count']
			: null;
		$reviews                = array_key_exists('reviews', $theme) ? $theme['reviews'] : null;

		if ($patterns_count !== null || $style_variations_count !== null) {
			$patterns_by_slug[ $slug ] = [
				'patterns_count'         => $patterns_count === null || $patterns_count === ''
					? null
					: (int) $patterns_count,
				'style_variations_count' => $style_variations_count === null || $style_variations_count === ''
					? null
					: (int) $style_variations_count,
			];
		}

		if (is_array($reviews)) {
			$reviews_by_slug[ $slug ] = [
				'reviews'     => $reviews,
				'num_ratings' => isset($theme['num_ratings'])
					? (int) $theme['num_ratings']
					: count($reviews),
			];
		}

		unset($theme['patterns_count'], $theme['style_variations_count'], $theme['reviews']);
		$themes_out[] = $theme;
	}

	$ok_themes = btr_write_cache_file(
		$cache_themes_file,
		[
			'cached_at' => $cached_at,
			'themes'    => $themes_out,
		]
	);

	$ok_patterns = btr_write_cache_file(
		$cache_patterns_file,
		[
			'cached_at' => $cached_at,
			'by_slug'   => $patterns_by_slug,
		]
	);

	$ok_reviews = btr_write_cache_file(
		$cache_reviews_file,
		[
			'cached_at' => $cached_at,
			'by_slug'   => $reviews_by_slug,
		]
	);

	if ($ok_themes && $ok_patterns && $ok_reviews) {
		unlink($cache_legacy_file);
	}
}

/**
 * Shared remote GET options for scrapers.
 *
 * @param string $accept Accept header value.
 * @return array
 */
function btr_remote_get_args($accept = 'text/html') {
	return [
		'timeout'     => 45,
		'redirection' => 3,
		'headers'     => [
			'Accept' => $accept,
		],
		'user-agent'  => 'BlockeraOneBlockThemesReport/1.0; (+local-dev-tool)',
	];
}

/**
 * Strip review description HTML to plain text and drop metadata preamble.
 *
 * @param string $html Description HTML.
 * @return string
 */
function btr_review_plain_content($html) {
	$text = wp_strip_all_tags(html_entity_decode((string) $html, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
	$text = preg_replace('/^\s*Replies:\s*\d+\s*/i', '', $text);
	$text = preg_replace('/^\s*Rating:\s*\d+\s*stars?\s*/i', '', $text);
	return trim(preg_replace('/\s+/u', ' ', (string) $text));
}

/**
 * Parse star rating from review title or description.
 *
 * @param string $title Review title.
 * @param string $desc  Review description HTML/text.
 * @return int|null
 */
function btr_parse_review_rating($title, $desc) {
	if (preg_match('/\((\d+)\s*stars?\)/i', (string) $title, $m)) {
		$n = (int) $m[1];
		return $n >= 1 && $n <= 5 ? $n : null;
	}
	if (preg_match('/Rating:\s*(\d+)\s*stars?/i', (string) $desc, $m2)) {
		$n = (int) $m2[1];
		return $n >= 1 && $n <= 5 ? $n : null;
	}
	return null;
}

/**
 * Clean review title by removing trailing "(N stars)".
 *
 * @param string $title Raw title.
 * @return string
 */
function btr_clean_review_title($title) {
	return trim(preg_replace('/\s*\(\d+\s*stars?\)\s*$/i', '', (string) $title));
}

btr_migrate_legacy_cache();

$action = isset($_REQUEST['action']) ? sanitize_key(wp_unslash($_REQUEST['action'])) : '';

if ($action === 'clear-cache') {
	$type = isset($_REQUEST['type']) ? sanitize_key(wp_unslash($_REQUEST['type'])) : '';
	$path = btr_cache_path_for_type($type);
	if ($path === null) {
		btr_json_response(['success' => false, 'error' => 'Invalid cache type'], 400);
	}
	if (file_exists($path)) {
		unlink($path);
	}
	btr_json_response(['success' => true, 'type' => $type]);
}

if ($action === 'save-cache') {
	$type = isset($_REQUEST['type']) ? sanitize_key(wp_unslash($_REQUEST['type'])) : '';
	$path = btr_cache_path_for_type($type);
	if ($path === null) {
		btr_json_response(['success' => false, 'error' => 'Invalid cache type'], 400);
	}

	$raw = file_get_contents('php://input');
	if ($raw === false || $raw === '') {
		btr_json_response(['success' => false, 'error' => 'Empty body'], 400);
	}

	$data = json_decode($raw, true);
	if (!is_array($data)) {
		btr_json_response(['success' => false, 'error' => 'Invalid JSON'], 400);
	}

	$cached_at = isset($data['cached_at']) ? (string) $data['cached_at'] : gmdate('c');

	if ($type === 'themes') {
		if (!isset($data['themes']) || !is_array($data['themes'])) {
			btr_json_response(['success' => false, 'error' => 'Invalid themes payload'], 400);
		}
		$payload = [
			'cached_at' => $cached_at,
			'themes'    => $data['themes'],
		];
		$count = count($payload['themes']);
	} elseif ($type === 'notes') {
		if (!isset($data['by_slug']) || !is_array($data['by_slug'])) {
			btr_json_response(['success' => false, 'error' => 'Invalid by_slug payload'], 400);
		}
		$by_slug = [];
		foreach ($data['by_slug'] as $slug => $note) {
			$slug = sanitize_key((string) $slug);
			if ($slug === '') {
				continue;
			}
			$note = sanitize_textarea_field((string) $note);
			if ($note === '') {
				continue;
			}
			$by_slug[ $slug ] = $note;
		}
		$payload = [
			'by_slug' => $by_slug,
		];
		$count = count($payload['by_slug']);
	} else {
		if (!isset($data['by_slug']) || !is_array($data['by_slug'])) {
			btr_json_response(['success' => false, 'error' => 'Invalid by_slug payload'], 400);
		}
		$payload = [
			'cached_at' => $cached_at,
			'by_slug'   => $data['by_slug'],
		];
		$count = count($payload['by_slug']);
	}

	if (!btr_write_cache_file($path, $payload)) {
		btr_json_response(['success' => false, 'error' => 'Failed to write cache'], 500);
	}

	btr_json_response(
		[
			'success'   => true,
			'type'      => $type,
			'cached_at' => isset($payload['cached_at']) ? $payload['cached_at'] : null,
			'count'     => $count,
		]
	);
}

/**
 * Decode a data-wp-context JSON attribute value.
 *
 * @param string $raw Encoded attribute value.
 * @return array
 */
function btr_decode_wp_context($raw) {
	$json = html_entity_decode((string) $raw, ENT_QUOTES | ENT_HTML5, 'UTF-8');
	$data = json_decode($json, true);
	return is_array($data) ? $data : [];
}

/**
 * Normalize a preview URL from scraped HTML.
 *
 * @param string $url Raw URL.
 * @return string
 */
function btr_normalize_preview_url($url) {
	$url = html_entity_decode((string) $url, ENT_QUOTES | ENT_HTML5, 'UTF-8');
	$url = str_replace('&amp;', '&', $url);
	if ($url !== '' && str_starts_with($url, '//')) {
		$url = 'https:' . $url;
	}
	return $url;
}

/**
 * Humanize a style variation slug for display.
 *
 * @param string $id Style slug.
 * @return string
 */
function btr_style_variation_label($id) {
	$id = (string) $id;
	if ($id === '' || strtolower($id) === 'default') {
		return 'Default';
	}
	$label = str_replace(['-', '_'], ' ', $id);
	return ucwords($label);
}

/**
 * Extract pattern details from a theme directory HTML page.
 *
 * @param string $body HTML body.
 * @return array{patterns: array<int, array>, patterns_count: int}
 */
function btr_extract_theme_patterns($body) {
	$patterns = [];
	$seen     = [];

	if (preg_match_all(
		'/<li[^>]*\bdata-pattern_name="([^"]+)"[^>]*>([\s\S]*?)<\/li>/i',
		$body,
		$matches,
		PREG_SET_ORDER
	)) {
		foreach ($matches as $row) {
			$id = (string) $row[1];
			if ($id === '' || isset($seen[ $id ])) {
				continue;
			}
			$seen[ $id ] = true;
			$inner       = $row[2];
			$name        = '';
			$preview     = '';

			if (preg_match(
				'/wp-block-wporg-screenshot-preview[^>]*data-wp-context="([^"]+)"/i',
				$inner,
				$ctx_m
			)) {
				$ctx     = btr_decode_wp_context($ctx_m[1]);
				$preview = btr_normalize_preview_url($ctx['src'] ?? '');
				$alt     = isset($ctx['alt']) ? (string) $ctx['alt'] : '';
				if ($alt !== '') {
					$name = preg_replace('/^Pattern:\s*/i', '', $alt);
					$name = trim((string) $name);
				}
			}

			if ($name === '') {
				$parts = explode('/', $id);
				$slug  = end($parts);
				$name  = $slug !== false ? btr_style_variation_label($slug) : $id;
			}

			$patterns[] = [
				'id'      => $id,
				'name'    => $name,
				'preview' => $preview,
			];
		}
	}

	$patterns_count = count($patterns);

	// Prefer declared totalCount when present (may differ if markup is truncated).
	if (preg_match(
		'/wp-block-wporg-theme-patterns[^>]*data-initial-state="([^"]+)"/',
		$body,
		$m
	)) {
		$state = btr_decode_wp_context($m[1]);
		if (isset($state['totalCount'])) {
			$declared = (int) $state['totalCount'];
			if ($declared > $patterns_count) {
				$patterns_count = $declared;
			}
		}
	}

	return [
		'patterns'       => $patterns,
		'patterns_count' => $patterns_count,
	];
}

/**
 * Extract style variation details from a theme directory HTML page.
 *
 * @param string $body HTML body.
 * @return array{style_variations: array<int, array>, style_variations_count: int}
 */
function btr_extract_theme_style_variations($body) {
	$styles = [];
	$seen   = [];

	$chunk = $body;
	if (preg_match(
		'/wp-block-wporg-theme-style-variations([\s\S]*?)(?=wp-block-wporg-theme-patterns|$)/i',
		$body,
		$styles_m
	)) {
		$chunk = $styles_m[1];
	}

	if (preg_match_all(
		'/data-wp-context="(\{&quot;style&quot;:&quot;([^&]+)&quot;\})"([\s\S]{0,4000})/i',
		$chunk,
		$matches,
		PREG_SET_ORDER
	)) {
		foreach ($matches as $row) {
			$id = strtolower((string) $row[2]);
			if ($id === '' || isset($seen[ $id ])) {
				continue;
			}
			$seen[ $id ] = true;
			$block       = $row[0];
			$preview     = '';

			if (preg_match(
				'/wp-block-wporg-screenshot-preview[^>]*data-wp-context="([^"]+)"/i',
				$block,
				$ctx_m
			)) {
				$ctx     = btr_decode_wp_context($ctx_m[1]);
				$preview = btr_normalize_preview_url($ctx['src'] ?? '');
			} elseif (preg_match('/<img[^>]+src="([^"]+)"/i', $block, $img_m)) {
				$preview = btr_normalize_preview_url($img_m[1]);
			}

			$styles[] = [
				'id'      => $id,
				'name'    => btr_style_variation_label($id),
				'preview' => $preview,
			];
		}
	}

	return [
		'style_variations'       => $styles,
		'style_variations_count' => count($styles),
	];
}

if ($action === 'scrape-patterns') {
	$slug = isset($_REQUEST['slug']) ? sanitize_title(wp_unslash($_REQUEST['slug'])) : '';
	if ($slug === '') {
		btr_json_response(['success' => false, 'error' => 'Missing slug'], 400);
	}

	$url      = 'https://wordpress.org/themes/' . rawurlencode($slug) . '/';
	$response = wp_remote_get($url, btr_remote_get_args('text/html'));

	if (is_wp_error($response)) {
		btr_json_response(
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
		btr_json_response(
			[
				'success' => false,
				'slug'    => $slug,
				'error'   => 'HTTP ' . $code,
			],
			502
		);
	}

	$patterns_data = btr_extract_theme_patterns($body);
	$styles_data   = btr_extract_theme_style_variations($body);

	btr_json_response(
		[
			'success'                => true,
			'slug'                   => $slug,
			'patterns_count'         => $patterns_data['patterns_count'],
			'style_variations_count' => $styles_data['style_variations_count'],
			'patterns'               => $patterns_data['patterns'],
			'style_variations'       => $styles_data['style_variations'],
		]
	);
}

if ($action === 'scrape-reviews') {
	$slug = isset($_REQUEST['slug']) ? sanitize_title(wp_unslash($_REQUEST['slug'])) : '';
	if ($slug === '') {
		btr_json_response(['success' => false, 'error' => 'Missing slug'], 400);
	}

	$per_page  = 30;
	$reviews   = [];
	$page      = 1;
	// Safety ceiling only — stop early when a page returns fewer than $per_page items.
	$max_pages = 500;

	while ($page <= $max_pages) {
		$url = 'https://wordpress.org/support/theme/' . rawurlencode($slug) . '/reviews/feed/?paged=' . $page;
		$response = wp_remote_get($url, btr_remote_get_args('application/rss+xml, application/xml, text/xml, */*'));

		if (is_wp_error($response)) {
			btr_json_response(
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

		// Empty / missing feed is a valid "no reviews" outcome on page 1.
		if ($code === 404 || ($page === 1 && ($code < 200 || $code >= 300) && $body === '')) {
			break;
		}

		if ($code < 200 || $code >= 300 || $body === '') {
			btr_json_response(
				[
					'success' => false,
					'slug'    => $slug,
					'error'   => 'HTTP ' . $code,
				],
				502
			);
		}

		$prev = libxml_use_internal_errors(true);
		$xml  = simplexml_load_string($body);
		libxml_clear_errors();
		libxml_use_internal_errors($prev);

		if ($xml === false || !isset($xml->channel)) {
			if ($page === 1) {
				break;
			}
			btr_json_response(
				[
					'success' => false,
					'slug'    => $slug,
					'error'   => 'Invalid RSS',
				],
				502
			);
		}

		$items_on_page = 0;
		foreach ($xml->channel->item as $item) {
			$items_on_page++;

			$title_raw = (string) $item->title;
			$desc_raw  = (string) $item->description;
			$creator   = '';
			$dc        = $item->children('http://purl.org/dc/elements/1.1/');
			if ($dc && isset($dc->creator)) {
				$creator = (string) $dc->creator;
			}

			$reviews[] = [
				'title'   => btr_clean_review_title($title_raw),
				'author'  => $creator,
				'rating'  => btr_parse_review_rating($title_raw, $desc_raw),
				'date'    => (string) $item->pubDate,
				'link'    => (string) $item->link,
				'content' => btr_review_plain_content($desc_raw),
			];
		}

		if ($items_on_page < $per_page) {
			break;
		}
		$page++;
	}

	btr_json_response(
		[
			'success'       => true,
			'slug'          => $slug,
			'reviews'       => $reviews,
			'reviews_count' => count($reviews),
		]
	);
}

$themes_cache   = btr_read_cache_file($cache_themes_file);
$patterns_cache = btr_read_cache_file($cache_patterns_file);
$reviews_cache  = btr_read_cache_file($cache_reviews_file);
$notes_cache    = btr_read_cache_file($theme_notes_file);

$themes    = [];
$cached_at = null;
if (is_array($themes_cache) && isset($themes_cache['themes']) && is_array($themes_cache['themes'])) {
	$themes    = $themes_cache['themes'];
	$cached_at = isset($themes_cache['cached_at']) ? (string) $themes_cache['cached_at'] : null;
}

$patterns_by_slug = [];
$patterns_cached_at = null;
if (is_array($patterns_cache) && isset($patterns_cache['by_slug']) && is_array($patterns_cache['by_slug'])) {
	$patterns_by_slug   = $patterns_cache['by_slug'];
	$patterns_cached_at = isset($patterns_cache['cached_at']) ? (string) $patterns_cache['cached_at'] : null;
}

$reviews_by_slug = [];
$reviews_cached_at = null;
if (is_array($reviews_cache) && isset($reviews_cache['by_slug']) && is_array($reviews_cache['by_slug'])) {
	$reviews_by_slug   = $reviews_cache['by_slug'];
	$reviews_cached_at = isset($reviews_cache['cached_at']) ? (string) $reviews_cache['cached_at'] : null;
}

$notes_by_slug = [];
if (is_array($notes_cache) && isset($notes_cache['by_slug']) && is_array($notes_cache['by_slug'])) {
	foreach ($notes_cache['by_slug'] as $slug => $note) {
		$slug = sanitize_key((string) $slug);
		if ($slug === '') {
			continue;
		}
		$note = is_string($note) ? trim($note) : '';
		if ($note === '') {
			continue;
		}
		$notes_by_slug[ $slug ] = $note;
	}
}

$themes_json           = wp_json_encode($themes, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$cached_at_json        = wp_json_encode($cached_at, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$patterns_by_slug_json = wp_json_encode($patterns_by_slug, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$patterns_cached_json  = wp_json_encode($patterns_cached_at, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$reviews_by_slug_json  = wp_json_encode($reviews_by_slug, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$reviews_cached_json   = wp_json_encode($reviews_cached_at, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$notes_by_slug_json    = wp_json_encode($notes_by_slug, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$style_ver             = (string) filemtime(__DIR__ . '/style.css');
$script_ver            = (string) filemtime(__DIR__ . '/script.js');
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Block Themes Report - Blockera One</title>
	<link rel="stylesheet" href="style.css?v=<?php echo esc_attr($style_ver); ?>">
</head>
<body>
	<div class="header">
		<div class="header-content">
			<h1>Block Themes Report</h1>
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
					<input type="search" id="search-input" class="control-input" placeholder="Name, slug, author, parent…">
				</div>

				<div class="control-group">
					<label class="control-label" for="min-installs-input">Min installs</label>
					<input type="number" id="min-installs-input" class="control-input control-input-num" min="0" step="1" placeholder="0" inputmode="numeric">
				</div>

				<div class="control-group">
					<label class="control-label" for="created-after-input">Created after</label>
					<input type="date" id="created-after-input" class="control-input control-input-date">
				</div>

				<div class="control-group">
					<label class="control-label" for="updated-after-input">Updated after</label>
					<input type="date" id="updated-after-input" class="control-input control-input-date">
				</div>

				<div class="control-group dropdown-group">
					<button type="button" class="control-btn" id="tags-toggle" aria-expanded="false" aria-controls="tags-panel">
						Tags
						<span class="filter-count-badge" id="tags-count-badge" hidden aria-hidden="true"></span>
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
						<span class="filter-count-badge" id="columns-count-badge" hidden aria-hidden="true"></span>
					</button>
					<div class="dropdown-panel" id="columns-panel" hidden>
						<div class="dropdown-actions">
							<button type="button" class="link-btn" id="columns-reset">Reset to defaults</button>
						</div>
						<div class="checkbox-list" id="columns-list"></div>
					</div>
				</div>

				<div class="control-group dropdown-group">
					<button
						type="button"
						class="control-btn cache-menu-toggle"
						id="cache-menu-toggle"
						aria-expanded="false"
						aria-controls="cache-menu-panel"
						aria-label="Cache actions"
						title="Cache actions"
					>
						<span class="cache-menu-dots" aria-hidden="true">
							<span></span><span></span><span></span>
						</span>
					</button>
					<div class="dropdown-panel cache-menu-panel" id="cache-menu-panel" hidden>
						<button type="button" class="cache-menu-item danger" id="clear-themes-cache-btn">
							Clear Themes
						</button>
						<button type="button" class="cache-menu-item danger" id="clear-patterns-cache-btn">
							Clear Patterns
						</button>
						<button type="button" class="cache-menu-item danger" id="clear-reviews-cache-btn">
							Clear Reviews
						</button>
					</div>
				</div>
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

	<div class="theme-modal" id="theme-modal" hidden>
		<div class="theme-modal-backdrop" data-theme-modal-close></div>
		<div
			class="theme-modal-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="theme-modal-title"
			tabindex="-1"
		>
			<div class="theme-modal-header">
				<h2 class="theme-modal-title" id="theme-modal-title">Theme details</h2>
				<button type="button" class="theme-modal-close" id="theme-modal-close" aria-label="Close" data-theme-modal-close>
					×
				</button>
			</div>
			<div class="theme-modal-body" id="theme-modal-body"></div>
		</div>
	</div>

	<script>
		const bootstrapThemes = <?php echo $themes_json ? $themes_json : '[]'; ?>;
		const bootstrapCachedAt = <?php echo $cached_at_json ? $cached_at_json : 'null'; ?>;
		const bootstrapPatternsBySlug = <?php echo $patterns_by_slug_json ? $patterns_by_slug_json : '{}'; ?>;
		const bootstrapPatternsCachedAt = <?php echo $patterns_cached_json ? $patterns_cached_json : 'null'; ?>;
		const bootstrapReviewsBySlug = <?php echo $reviews_by_slug_json ? $reviews_by_slug_json : '{}'; ?>;
		const bootstrapReviewsCachedAt = <?php echo $reviews_cached_json ? $reviews_cached_json : 'null'; ?>;
		const bootstrapNotesBySlug = <?php echo $notes_by_slug_json ? $notes_by_slug_json : '{}'; ?>;
	</script>
	<script src="script.js?v=<?php echo esc_attr($script_ver); ?>"></script>
</body>
</html>
