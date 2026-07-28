/* global bootstrapThemes, bootstrapCachedAt */

(function () {
	'use strict';

	const API = 'https://api.wordpress.org/themes/info/1.2/';
	const PER_PAGE = 250;
	const PAGE_DELAY_MS = 100;
	const PATTERN_SCRAPE_DELAY_MS = 200;
	const PATTERN_SCRAPE_MAX_ROUNDS = 3;
	const STORAGE_KEY = 'blockera-one-block-themes-report-columns-v7';

	// Background tabs throttle main-thread setTimeout; Worker timers keep scrape/fetch moving.
	let delayWorker = null;
	let delaySeq = 0;
	const delayPending = new Map();

	function getDelayWorker() {
		if (delayWorker) {
			return delayWorker;
		}
		const src =
			'self.onmessage=function(e){var d=e.data;setTimeout(function(){self.postMessage(d.id);},d.ms);};';
		const blob = new Blob([src], { type: 'application/javascript' });
		delayWorker = new Worker(URL.createObjectURL(blob));
		delayWorker.onmessage = function (e) {
			const resolve = delayPending.get(e.data);
			if (resolve) {
				delayPending.delete(e.data);
				resolve();
			}
		};
		return delayWorker;
	}

	function delay(ms) {
		return new Promise((resolve) => {
			try {
				const id = ++delaySeq;
				delayPending.set(id, resolve);
				getDelayWorker().postMessage({ id: id, ms: ms });
			} catch (err) {
				window.setTimeout(resolve, ms);
			}
		});
	}

	const QUERY_FIELDS = {
		active_installs: true,
		downloaded: true,
		description: true,
		last_updated: true,
		tags: true,
		requires: true,
		requires_php: true,
		ratings: true,
		parent: true,
		screenshot_url: true,
		is_commercial: true,
		is_community: true,
		creation_time: true,
		extended_author: true,
		external_repository_url: true,
		external_support_url: true,
		download_link: true,
	};

	const THEME_COLUMNS = [
		{
			id: 'screenshot',
			label: 'Screenshot',
			defaultVisible: true,
			sortable: false,
			type: 'screenshot',
		},
		{
			id: 'rank',
			label: '#',
			defaultVisible: true,
			sortable: false,
			type: 'num',
		},
		{
			id: 'name',
			label: 'Name',
			defaultVisible: true,
			sortable: true,
			type: 'text',
			sortKey: 'name',
		},
		{
			id: 'slug',
			label: 'Slug',
			defaultVisible: false,
			sortable: true,
			type: 'text',
			sortKey: 'slug',
		},
		{
			id: 'active_installs',
			label: 'Active installs',
			defaultVisible: true,
			sortable: true,
			type: 'num',
			sortKey: 'active_installs',
		},
		{
			id: 'downloaded',
			label: 'Downloads',
			defaultVisible: true,
			sortable: true,
			type: 'num',
			sortKey: 'downloaded',
		},
		{
			id: 'ratings',
			label: 'Ratings',
			defaultVisible: true,
			sortable: true,
			type: 'ratings',
			sortKey: 'num_ratings',
		},
		{
			id: 'patterns_count',
			label: 'Patterns',
			defaultVisible: true,
			sortable: true,
			type: 'num',
			sortKey: 'patterns_count',
		},
		{
			id: 'style_variations_count',
			label: 'Style variations',
			defaultVisible: true,
			sortable: true,
			type: 'num',
			sortKey: 'style_variations_count',
		},
		{
			id: 'version',
			label: 'Version',
			defaultVisible: true,
			sortable: true,
			type: 'text',
			sortKey: 'version',
		},
		{
			id: 'author',
			label: 'Author',
			defaultVisible: true,
			sortable: true,
			type: 'text',
			sortKey: 'authorName',
		},
		{
			id: 'last_updated',
			label: 'Last updated',
			defaultVisible: true,
			sortable: true,
			type: 'text',
			sortKey: 'last_updated',
		},
		{
			id: 'creation_time',
			label: 'Created',
			defaultVisible: true,
			sortable: true,
			type: 'text',
			sortKey: 'creation_time',
		},
		{
			id: 'parent',
			label: 'Parent',
			defaultVisible: false,
			sortable: true,
			type: 'text',
			sortKey: 'parentSlug',
		},
		{
			id: 'homepage',
			label: 'Homepage',
			defaultVisible: false,
			sortable: false,
			type: 'url',
			sortKey: 'homepage',
		},
		{
			id: 'requires',
			label: 'Requires WP',
			defaultVisible: false,
			sortable: true,
			type: 'text',
			sortKey: 'requires',
		},
		{
			id: 'requires_php',
			label: 'Requires PHP',
			defaultVisible: false,
			sortable: true,
			type: 'text',
			sortKey: 'requires_php',
		},
		{
			id: 'tags',
			label: 'Tags',
			defaultVisible: false,
			sortable: false,
			type: 'tags',
		},
		{
			id: 'template',
			label: 'Template',
			defaultVisible: false,
			sortable: true,
			type: 'text',
			sortKey: 'template',
		},
		{
			id: 'is_commercial',
			label: 'Commercial',
			defaultVisible: false,
			sortable: true,
			type: 'bool',
			sortKey: 'is_commercial',
		},
		{
			id: 'is_community',
			label: 'Community',
			defaultVisible: false,
			sortable: true,
			type: 'bool',
			sortKey: 'is_community',
		},
		{
			id: 'preview_url',
			label: 'Preview URL',
			defaultVisible: false,
			sortable: false,
			type: 'url',
			sortKey: 'preview_url',
		},
		{
			id: 'download_link',
			label: 'Download link',
			defaultVisible: false,
			sortable: false,
			type: 'url',
			sortKey: 'download_link',
		},
		{
			id: 'screenshot_url',
			label: 'Screenshot URL',
			defaultVisible: false,
			sortable: false,
			type: 'url',
			sortKey: 'screenshot_url',
		},
		{
			id: 'external_support_url',
			label: 'External support',
			defaultVisible: false,
			sortable: false,
			type: 'url',
			sortKey: 'external_support_url',
		},
		{
			id: 'external_repository_url',
			label: 'External repo',
			defaultVisible: false,
			sortable: false,
			type: 'url',
			sortKey: 'external_repository_url',
		},
		{
			id: 'description',
			label: 'Description',
			defaultVisible: false,
			sortable: false,
			type: 'desc',
		},
		{
			id: 'rating_1',
			label: '★1',
			defaultVisible: false,
			sortable: true,
			type: 'num',
			sortKey: 'rating_1',
		},
		{
			id: 'rating_2',
			label: '★2',
			defaultVisible: false,
			sortable: true,
			type: 'num',
			sortKey: 'rating_2',
		},
		{
			id: 'rating_3',
			label: '★3',
			defaultVisible: false,
			sortable: true,
			type: 'num',
			sortKey: 'rating_3',
		},
		{
			id: 'rating_4',
			label: '★4',
			defaultVisible: false,
			sortable: true,
			type: 'num',
			sortKey: 'rating_4',
		},
		{
			id: 'rating_5',
			label: '★5',
			defaultVisible: false,
			sortable: true,
			type: 'num',
			sortKey: 'rating_5',
		},
	];

	const AUTHOR_COLUMNS = [
		{ id: 'rank', label: '#', sortable: false, type: 'num' },
		{
			id: 'author',
			label: 'Author',
			sortable: true,
			type: 'text',
			sortKey: 'name',
		},
		{
			id: 'theme_count',
			label: 'Themes',
			sortable: true,
			type: 'num',
			sortKey: 'theme_count',
		},
		{
			id: 'total_downloads',
			label: 'Total downloads',
			sortable: true,
			type: 'num',
			sortKey: 'total_downloads',
		},
		{
			id: 'total_active_installs',
			label: 'Active installs',
			sortable: true,
			type: 'num',
			sortKey: 'total_active_installs',
		},
		{
			id: 'avg_rating',
			label: 'Avg rating',
			sortable: true,
			type: 'num',
			sortKey: 'avg_rating',
		},
	];

	const els = {
		statThemes: document.getElementById('stat-themes'),
		statAuthors: document.getElementById('stat-authors'),
		statProgress: document.getElementById('stat-progress'),
		statCached: document.getElementById('stat-cached'),
		searchInput: document.getElementById('search-input'),
		tagsToggle: document.getElementById('tags-toggle'),
		tagsPanel: document.getElementById('tags-panel'),
		tagsList: document.getElementById('tags-list'),
		tagsClear: document.getElementById('tags-clear'),
		columnsToggle: document.getElementById('columns-toggle'),
		columnsPanel: document.getElementById('columns-panel'),
		columnsList: document.getElementById('columns-list'),
		columnsReset: document.getElementById('columns-reset'),
		clearCacheBtn: document.getElementById('clear-cache-btn'),
		progressIndicator: document.getElementById('progress-indicator'),
		progressText: document.getElementById('progress-text'),
		progressLog: document.getElementById('progress-log'),
		themesThead: document.getElementById('themes-thead'),
		themesTbody: document.getElementById('themes-tbody'),
		themesTfoot: document.getElementById('themes-tfoot'),
		authorsThead: document.getElementById('authors-thead'),
		authorsTbody: document.getElementById('authors-tbody'),
		authorsTfoot: document.getElementById('authors-tfoot'),
	};

	let themes = [];
	let cachedAt = null;
	let isFetching = false;
	let childCountByParent = new Map();
	let fetchAbort = false;
	let isScrapingPatterns = false;
	let scrapeAbort = false;
	const selectedTags = new Set();
	let searchQuery = '';
	const visibleColumns = loadVisibleColumns();
	const themeSort = { key: 'active_installs', dir: 'desc' };
	const authorSort = { key: 'theme_count', dir: 'desc' };

	function loadVisibleColumns() {
		const defaults = {};
		THEME_COLUMNS.forEach((col) => {
			defaults[col.id] = col.defaultVisible;
		});
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) {
				return defaults;
			}
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== 'object') {
				return defaults;
			}
			THEME_COLUMNS.forEach((col) => {
				if (typeof parsed[col.id] === 'boolean') {
					defaults[col.id] = parsed[col.id];
				}
			});
			return defaults;
		} catch (e) {
			return defaults;
		}
	}

	function saveVisibleColumns() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
		} catch (e) {
			// Ignore quota / private mode.
		}
	}

	function escapeHtml(value) {
		return String(value == null ? '' : value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function formatNumber(value) {
		const n = Number(value);
		if (!Number.isFinite(n)) {
			return '0';
		}
		return n.toLocaleString();
	}

	function formatCachedAt(iso) {
		if (!iso) {
			return 'No cache';
		}
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) {
			return String(iso);
		}
		const pad = (n) => String(n).padStart(2, '0');
		return (
			d.getFullYear() +
			'-' +
			pad(d.getMonth() + 1) +
			'-' +
			pad(d.getDate()) +
			' ' +
			pad(d.getHours()) +
			':' +
			pad(d.getMinutes())
		);
	}

	/** Normalize API dates to YYYY-MM-DD (no time). */
	function formatDateOnly(value) {
		if (value == null || value === '') {
			return '';
		}
		const str = String(value).trim();
		const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
		if (match) {
			return match[1];
		}
		const d = new Date(str);
		if (Number.isNaN(d.getTime())) {
			return str;
		}
		const pad = (n) => String(n).padStart(2, '0');
		return (
			d.getFullYear() +
			'-' +
			pad(d.getMonth() + 1) +
			'-' +
			pad(d.getDate())
		);
	}

	function absolutizeUrl(url) {
		if (!url || typeof url !== 'string') {
			return '';
		}
		if (url.startsWith('//')) {
			return 'https:' + url;
		}
		return url;
	}

	function authorInfo(theme) {
		const author = theme && theme.author;
		if (!author) {
			return { key: '', name: '', profile: '' };
		}
		if (typeof author === 'string') {
			return { key: author.toLowerCase(), name: author, profile: '' };
		}
		const name =
			author.display_name || author.author || author.user_nicename || '';
		const key = (
			author.user_nicename ||
			author.profile ||
			name ||
			''
		).toLowerCase();
		return {
			key: key || name.toLowerCase(),
			name,
			profile: author.profile || '',
		};
	}

	function parentSlug(theme) {
		const parent = theme && theme.parent;
		if (!parent) {
			return '';
		}
		if (typeof parent === 'string') {
			return parent;
		}
		return parent.slug || '';
	}

	function parentDisplayName(theme) {
		const parent = theme && theme.parent;
		if (parent && typeof parent === 'object' && parent.name) {
			return parent.name;
		}
		const slug = parentSlug(theme);
		if (!slug) {
			return '';
		}
		for (let i = 0; i < themes.length; i++) {
			if (themes[i].slug === slug) {
				return themes[i].name || slug;
			}
		}
		return slug;
	}

	function findThemeBySlug(slug) {
		if (!slug) {
			return null;
		}
		for (let i = 0; i < themes.length; i++) {
			if (themes[i].slug === slug) {
				return themes[i];
			}
		}
		return null;
	}

	function normalizeTheme(raw) {
		const a = authorInfo(raw);
		const ratings =
			raw.ratings && typeof raw.ratings === 'object' ? raw.ratings : {};
		const tags = raw.tags && typeof raw.tags === 'object' ? raw.tags : {};
		const homepage =
			raw.homepage ||
			(raw.slug ? 'https://wordpress.org/themes/' + raw.slug + '/' : '');
		const pSlug = parentSlug(raw);
		let pName = '';
		if (raw.parent && typeof raw.parent === 'object') {
			pName = raw.parent.name || '';
		}

		return {
			...raw,
			authorName: a.name,
			authorKey: a.key,
			authorProfile: a.profile,
			parentSlug: pSlug,
			parentName: pName,
			homepage,
			screenshot_url: absolutizeUrl(raw.screenshot_url),
			last_updated: formatDateOnly(
				raw.last_updated || raw.last_updated_time
			),
			creation_time: formatDateOnly(raw.creation_time),
			active_installs: Number(raw.active_installs) || 0,
			downloaded: Number(raw.downloaded) || 0,
			rating: Number(raw.rating) || 0,
			num_ratings: Number(raw.num_ratings) || 0,
			rating_1: Number(ratings['1']) || 0,
			rating_2: Number(ratings['2']) || 0,
			rating_3: Number(ratings['3']) || 0,
			rating_4: Number(ratings['4']) || 0,
			rating_5: Number(ratings['5']) || 0,
			tagSlugs: Object.keys(tags),
			tagLabels: Object.values(tags),
			is_commercial: !!raw.is_commercial,
			is_community: !!raw.is_community,
			patterns_count:
				raw.patterns_count == null || raw.patterns_count === ''
					? null
					: Number(raw.patterns_count),
			style_variations_count:
				raw.style_variations_count == null ||
				raw.style_variations_count === ''
					? null
					: Number(raw.style_variations_count),
		};
	}

	function logProgress(message) {
		const line = document.createElement('div');
		line.textContent = message;
		els.progressLog.appendChild(line);
		els.progressLog.scrollTop = els.progressLog.scrollHeight;
	}

	function setProgressUI(active, text) {
		els.progressIndicator.classList.toggle('active', !!active);
		if (text) {
			els.progressText.textContent = text;
		}
	}

	function updateHeaderStats(filteredThemes, filteredAuthors, progressLabel) {
		els.statThemes.textContent = formatNumber(filteredThemes.length);
		els.statAuthors.textContent = formatNumber(filteredAuthors.length);
		if (progressLabel != null) {
			els.statProgress.textContent = progressLabel;
		}
		els.statCached.textContent = formatCachedAt(cachedAt);
	}

	function getFilteredThemes() {
		const q = searchQuery.trim().toLowerCase();
		const tagList = Array.from(selectedTags);

		const out = [];
		for (let i = 0; i < themes.length; i++) {
			const theme = themes[i];

			if (tagList.length) {
				let hasAll = true;
				for (let t = 0; t < tagList.length; t++) {
					if (!theme.tagSlugs.includes(tagList[t])) {
						hasAll = false;
						break;
					}
				}
				if (!hasAll) {
					continue;
				}
			}

			if (q) {
				const hay =
					(theme.name || '') +
					' ' +
					(theme.slug || '') +
					' ' +
					(theme.authorName || '') +
					' ' +
					(theme.description || '');
				if (!hay.toLowerCase().includes(q)) {
					continue;
				}
			}

			out.push(theme);
		}
		return out;
	}

	function compareValues(a, b, dir) {
		const mul = dir === 'asc' ? 1 : -1;
		if (a == null && b == null) {
			return 0;
		}
		if (a == null) {
			return 1;
		}
		if (b == null) {
			return -1;
		}
		if (typeof a === 'number' && typeof b === 'number') {
			if (a === b) {
				return 0;
			}
			return a < b ? -1 * mul : 1 * mul;
		}
		const as = String(a).toLowerCase();
		const bs = String(b).toLowerCase();
		if (as === bs) {
			return 0;
		}
		return as < bs ? -1 * mul : 1 * mul;
	}

	function sortThemes(list) {
		const key = themeSort.key;
		const dir = themeSort.dir;
		const sorted = list.slice();
		sorted.sort((a, b) => {
			let cmp = compareValues(a[key], b[key], dir);
			if (cmp === 0 && key !== 'downloaded') {
				cmp = compareValues(a.downloaded, b.downloaded, 'desc');
			}
			if (cmp === 0) {
				cmp = compareValues(a.slug, b.slug, 'asc');
			}
			return cmp;
		});
		return sorted;
	}

	function buildAuthors(filteredThemes) {
		const map = new Map();
		for (let i = 0; i < filteredThemes.length; i++) {
			const theme = filteredThemes[i];
			const key = theme.authorKey || theme.authorName || 'unknown';
			let row = map.get(key);
			if (!row) {
				row = {
					key,
					name: theme.authorName || 'Unknown',
					profile: theme.authorProfile || '',
					theme_count: 0,
					total_downloads: 0,
					total_active_installs: 0,
					rating_sum: 0,
					rating_n: 0,
				};
				map.set(key, row);
			}
			row.theme_count += 1;
			row.total_downloads += theme.downloaded || 0;
			row.total_active_installs += theme.active_installs || 0;
			if (theme.rating) {
				row.rating_sum += theme.rating;
				row.rating_n += 1;
			}
			if (!row.profile && theme.authorProfile) {
				row.profile = theme.authorProfile;
			}
		}

		const authors = [];
		map.forEach((row) => {
			authors.push({
				...row,
				avg_rating: row.rating_n
					? Math.round(row.rating_sum / row.rating_n)
					: 0,
			});
		});

		authors.sort((a, b) => {
			let cmp = compareValues(
				a[authorSort.key],
				b[authorSort.key],
				authorSort.dir
			);
			if (cmp === 0 && authorSort.key !== 'total_downloads') {
				cmp = compareValues(
					a.total_downloads,
					b.total_downloads,
					'desc'
				);
			}
			if (cmp === 0) {
				cmp = compareValues(a.name, b.name, 'asc');
			}
			return cmp;
		});

		return authors;
	}

	function renderThemeCell(col, theme, rank) {
		switch (col.id) {
			case 'screenshot': {
				const src = theme.screenshot_url;
				const frameOpen = '<div class="theme-screenshot-frame">';
				const frameClose = '</div>';
				if (!src) {
					return (
						'<td class="theme-screenshot-cell">' +
						frameOpen +
						frameClose +
						'</td>'
					);
				}
				const img =
					'<img class="theme-screenshot" src="' +
					escapeHtml(src) +
					'" alt="" width="120" height="120" decoding="async">';
				const href = theme.homepage || '';
				const inner = href
					? '<a href="' +
						escapeHtml(href) +
						'" target="_blank" rel="noopener noreferrer">' +
						img +
						'</a>'
					: img;
				return (
					'<td class="theme-screenshot-cell">' +
					frameOpen +
					inner +
					frameClose +
					'</td>'
				);
			}
			case 'rank':
				return '<td class="num">' + rank + '</td>';
			case 'name': {
				const commercialMark = theme.is_commercial
					? ' <span class="theme-commercial-mark" title="Commercial version available">$</span>'
					: '';
				const nameLink =
					'<a class="theme-name-link" href="' +
					escapeHtml(theme.homepage || '#') +
					'" target="_blank" rel="noopener noreferrer">' +
					escapeHtml(theme.name || '') +
					'</a>' +
					commercialMark;

				const previewUrl = theme.preview_url || '';
				const homeUrl = theme.homepage || '';
				const repoUrl =
					theme.external_repository_url &&
					theme.external_repository_url !== true &&
					theme.external_repository_url !== false
						? String(theme.external_repository_url)
						: '';

				const hoverParts = [];
				if (previewUrl) {
					hoverParts.push(
						'<a href="' +
							escapeHtml(previewUrl) +
							'" target="_blank" rel="noopener noreferrer">Preview</a>'
					);
				} else {
					hoverParts.push(
						'<span class="theme-name-hover-disabled">Preview</span>'
					);
				}
				if (homeUrl) {
					hoverParts.push(
						'<a href="' +
							escapeHtml(homeUrl) +
							'" target="_blank" rel="noopener noreferrer">Home</a>'
					);
				} else {
					hoverParts.push(
						'<span class="theme-name-hover-disabled">Home</span>'
					);
				}
				if (repoUrl) {
					hoverParts.push(
						'<a href="' +
							escapeHtml(repoUrl) +
							'" target="_blank" rel="noopener noreferrer">Repository</a>'
					);
				}

				const hoverLinks =
					'<div class="theme-name-hover-links">' +
					hoverParts.join(
						'<span class="theme-name-hover-sep"> - </span>'
					) +
					'</div>';

				let parentLine = '';
				if (theme.parentSlug) {
					const pName =
						theme.parentName ||
						parentDisplayName(theme) ||
						theme.parentSlug;
					parentLine =
						'<div class="theme-parent-line">' +
						'<span class="theme-parent-prefix">Parent:</span> ' +
						'<button type="button" class="js-scroll-to-theme parent-theme-link" data-theme-slug="' +
						escapeHtml(theme.parentSlug) +
						'" title="Scroll to parent theme">' +
						escapeHtml(pName) +
						'</button>' +
						'</div>';
				}

				let parentOfLine = '';
				const childCount = theme.slug
					? childCountByParent.get(theme.slug) || 0
					: 0;
				if (childCount > 0) {
					parentOfLine =
						'<div class="theme-parent-line theme-parent-of-line">' +
						'<span class="theme-parent-prefix">Parent of:</span> ' +
						'<span class="theme-parent-of-count">' +
						formatNumber(childCount) +
						'</span>' +
						'</div>';
				}

				return (
					'<td class="theme-name-cell">' +
					'<div class="theme-name-line">' +
					nameLink +
					'</div>' +
					parentLine +
					parentOfLine +
					hoverLinks +
					'</td>'
				);
			}
			case 'author':
				if (theme.authorProfile) {
					return (
						'<td><a href="' +
						escapeHtml(theme.authorProfile) +
						'" target="_blank" rel="noopener noreferrer">' +
						escapeHtml(theme.authorName || '') +
						'</a></td>'
					);
				}
				return '<td>' + escapeHtml(theme.authorName || '') + '</td>';
			case 'tags':
				return (
					'<td class="tags-cell">' +
					escapeHtml((theme.tagLabels || []).join(', ')) +
					'</td>'
				);
			case 'ratings':
				return (
					'<td class="num">' +
					formatNumber(theme.num_ratings) +
					' (' +
					formatNumber(theme.rating) +
					'%)</td>'
				);
			case 'description': {
				const desc = theme.description || '';
				const short =
					desc.length > 140 ? desc.slice(0, 140) + '…' : desc;
				return (
					'<td class="desc-cell" title="' +
					escapeHtml(desc) +
					'">' +
					escapeHtml(short) +
					'</td>'
				);
			}
			case 'active_installs':
			case 'downloaded':
			case 'rating_1':
			case 'rating_2':
			case 'rating_3':
			case 'rating_4':
			case 'rating_5':
				return (
					'<td class="num">' + formatNumber(theme[col.id]) + '</td>'
				);
			case 'patterns_count':
				return (
					'<td class="num">' +
					(theme.patterns_count == null
						? '…'
						: formatNumber(theme.patterns_count)) +
					'</td>'
				);
			case 'style_variations_count':
				return (
					'<td class="num">' +
					(theme.style_variations_count == null
						? '…'
						: formatNumber(theme.style_variations_count)) +
					'</td>'
				);
			case 'is_commercial':
			case 'is_community':
				return '<td>' + (theme[col.id] ? 'Yes' : 'No') + '</td>';
			case 'parent':
				return '<td>' + escapeHtml(theme.parentSlug || '') + '</td>';
			case 'preview_url':
			case 'homepage':
			case 'download_link':
			case 'screenshot_url':
			case 'external_support_url':
			case 'external_repository_url': {
				const url = theme[col.id];
				if (!url || url === true || url === false) {
					return '<td>—</td>';
				}
				return (
					'<td><a href="' +
					escapeHtml(String(url)) +
					'" target="_blank" rel="noopener noreferrer">Open</a></td>'
				);
			}
			default:
				return (
					'<td>' +
					escapeHtml(theme[col.id] == null ? '' : theme[col.id]) +
					'</td>'
				);
		}
	}

	function renderThemesTable(filteredThemes) {
		const cols = THEME_COLUMNS;
		const sorted = sortThemes(filteredThemes);

		let head = '<tr>';
		cols.forEach((col) => {
			const hidden = visibleColumns[col.id] ? '' : ' col-hidden';
			const sortedClass =
				col.sortable && themeSort.key === col.sortKey
					? themeSort.dir === 'asc'
						? ' sorted-asc'
						: ' sorted-desc'
					: '';
			const sortableClass = col.sortable ? ' sortable' : '';
			const indicator = col.sortable
				? '<span class="sort-indicator">' +
					(themeSort.key === col.sortKey
						? themeSort.dir === 'asc'
							? '▲'
							: '▼'
						: '↕') +
					'</span>'
				: '';
			head +=
				'<th class="' +
				escapeHtml(col.id) +
				hidden +
				sortableClass +
				sortedClass +
				'" data-col="' +
				escapeHtml(col.id) +
				'"' +
				(col.sortable
					? ' data-sort-key="' + escapeHtml(col.sortKey) + '"'
					: '') +
				'>' +
				escapeHtml(col.label) +
				indicator +
				'</th>';
		});
		head += '</tr>';
		els.themesThead.innerHTML = head;

		if (!sorted.length) {
			els.themesTbody.innerHTML =
				'<tr class="empty-row"><td colspan="' +
				cols.length +
				'">No themes to show</td></tr>';
			els.themesTfoot.innerHTML = '';
			return;
		}

		els.themesTbody.innerHTML = '';
		const frag = document.createDocumentFragment();
		const parse = document.createElement('tbody');

		for (let i = 0; i < sorted.length; i++) {
			const theme = sorted[i];
			const tr = document.createElement('tr');
			tr.dataset.themeSlug = theme.slug || '';
			tr.id = theme.slug ? 'theme-row-' + theme.slug : '';
			for (let c = 0; c < cols.length; c++) {
				const col = cols[c];
				parse.innerHTML =
					'<tr>' + renderThemeCell(col, theme, i + 1) + '</tr>';
				const td = parse.querySelector('td');
				if (!td) {
					continue;
				}
				if (!visibleColumns[col.id]) {
					td.classList.add('col-hidden');
				}
				tr.appendChild(td);
			}
			frag.appendChild(tr);
		}
		els.themesTbody.appendChild(frag);
		renderThemesFooter(sorted);
	}

	function renderThemesFooter(rows) {
		const cols = THEME_COLUMNS;
		let sumInstalls = 0;
		let sumDownloads = 0;
		let sumPatterns = 0;
		let patternsKnown = 0;
		let sumStyles = 0;
		let stylesKnown = 0;
		const n = rows.length;

		for (let i = 0; i < n; i++) {
			sumInstalls += rows[i].active_installs || 0;
			sumDownloads += rows[i].downloaded || 0;
			if (rows[i].patterns_count != null) {
				sumPatterns += rows[i].patterns_count || 0;
				patternsKnown += 1;
			}
			if (rows[i].style_variations_count != null) {
				sumStyles += rows[i].style_variations_count || 0;
				stylesKnown += 1;
			}
		}

		let html = '<tr>';
		for (let c = 0; c < cols.length; c++) {
			const col = cols[c];
			const hiddenClass = visibleColumns[col.id] ? '' : ' col-hidden';

			if (col.id === 'rank') {
				html +=
					'<td class="num footer-label' +
					hiddenClass +
					'">Total</td>';
			} else if (col.id === 'active_installs') {
				html +=
					'<td class="num' +
					hiddenClass +
					'">' +
					formatNumber(sumInstalls) +
					'</td>';
			} else if (col.id === 'downloaded') {
				html +=
					'<td class="num' +
					hiddenClass +
					'">' +
					formatNumber(sumDownloads) +
					'</td>';
			} else if (col.id === 'patterns_count') {
				html +=
					'<td class="num' +
					hiddenClass +
					'">' +
					(patternsKnown ? formatNumber(sumPatterns) : '…') +
					'</td>';
			} else if (col.id === 'style_variations_count') {
				html +=
					'<td class="num' +
					hiddenClass +
					'">' +
					(stylesKnown ? formatNumber(sumStyles) : '…') +
					'</td>';
			} else {
				html += '<td class="' + hiddenClass.trim() + '"></td>';
			}
		}
		html += '</tr>';
		els.themesTfoot.innerHTML = html;
	}

	function scrollToThemeRow(slug) {
		if (!slug) {
			return;
		}

		const revealAndScroll = () => {
			const safe =
				typeof CSS !== 'undefined' && CSS.escape
					? CSS.escape(slug)
					: String(slug).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
			const row = els.themesTbody.querySelector(
				'tr[data-theme-slug="' + safe + '"]'
			);
			if (!row) {
				return false;
			}
			document.querySelectorAll('.nav-btn').forEach((b) => {
				b.classList.toggle(
					'active',
					b.dataset.target === 'themes-section'
				);
			});
			const section = document.getElementById('themes-section');
			if (section) {
				section.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
			row.scrollIntoView({ behavior: 'smooth', block: 'center' });
			row.classList.remove('row-highlight');
			// Force reflow so animation can replay.
			void row.offsetWidth;
			row.classList.add('row-highlight');
			window.setTimeout(
				() => row.classList.remove('row-highlight'),
				2200
			);
			return true;
		};

		if (revealAndScroll()) {
			return;
		}

		// Parent may be hidden by search/tags — clear filters and try again.
		const parentTheme = findThemeBySlug(slug);
		if (!parentTheme) {
			return;
		}

		searchQuery = '';
		els.searchInput.value = '';
		selectedTags.clear();
		refreshTables(isFetching ? els.statProgress.textContent : '100%');
		window.requestAnimationFrame(() => {
			revealAndScroll();
		});
	}

	function renderAuthorsTable(authors) {
		let head = '<tr>';
		AUTHOR_COLUMNS.forEach((col) => {
			const sortedClass =
				col.sortable && authorSort.key === col.sortKey
					? authorSort.dir === 'asc'
						? ' sorted-asc'
						: ' sorted-desc'
					: '';
			const sortableClass = col.sortable ? ' sortable' : '';
			const indicator = col.sortable
				? '<span class="sort-indicator">' +
					(authorSort.key === col.sortKey
						? authorSort.dir === 'asc'
							? '▲'
							: '▼'
						: '↕') +
					'</span>'
				: '';
			head +=
				'<th class="' +
				sortableClass +
				sortedClass +
				'" data-sort-key="' +
				escapeHtml(col.sortKey || '') +
				'">' +
				escapeHtml(col.label) +
				indicator +
				'</th>';
		});
		head += '</tr>';
		els.authorsThead.innerHTML = head;

		if (!authors.length) {
			els.authorsTbody.innerHTML =
				'<tr class="empty-row"><td colspan="' +
				AUTHOR_COLUMNS.length +
				'">No authors to show</td></tr>';
			els.authorsTfoot.innerHTML = '';
			return;
		}

		const rows = [];
		for (let i = 0; i < authors.length; i++) {
			const a = authors[i];
			const nameCell = a.profile
				? '<a href="' +
					escapeHtml(a.profile) +
					'" target="_blank" rel="noopener noreferrer">' +
					escapeHtml(a.name) +
					'</a>'
				: escapeHtml(a.name);
			rows.push(
				'<tr>' +
					'<td class="num">' +
					(i + 1) +
					'</td>' +
					'<td>' +
					nameCell +
					'</td>' +
					'<td class="num">' +
					formatNumber(a.theme_count) +
					'</td>' +
					'<td class="num">' +
					formatNumber(a.total_downloads) +
					'</td>' +
					'<td class="num">' +
					formatNumber(a.total_active_installs) +
					'</td>' +
					'<td class="num">' +
					formatNumber(a.avg_rating) +
					'%</td>' +
					'</tr>'
			);
		}
		els.authorsTbody.innerHTML = rows.join('');
		renderAuthorsFooter(authors);
	}

	function renderAuthorsFooter(authors) {
		let sumThemes = 0;
		let sumDownloads = 0;
		let sumInstalls = 0;
		let sumRating = 0;
		const n = authors.length;

		for (let i = 0; i < n; i++) {
			sumThemes += authors[i].theme_count || 0;
			sumDownloads += authors[i].total_downloads || 0;
			sumInstalls += authors[i].total_active_installs || 0;
			sumRating += authors[i].avg_rating || 0;
		}

		const avgRating = n ? Math.round(sumRating / n) : 0;

		els.authorsTfoot.innerHTML =
			'<tr>' +
			'<td class="num footer-label">Total</td>' +
			'<td></td>' +
			'<td class="num">' +
			formatNumber(sumThemes) +
			'</td>' +
			'<td class="num">' +
			formatNumber(sumDownloads) +
			'</td>' +
			'<td class="num">' +
			formatNumber(sumInstalls) +
			'</td>' +
			'<td class="num">' +
			formatNumber(avgRating) +
			'%</td>' +
			'</tr>';
	}

	function rebuildChildCountByParent() {
		const counts = new Map();
		for (let i = 0; i < themes.length; i++) {
			const slug = themes[i].parentSlug;
			if (!slug) {
				continue;
			}
			counts.set(slug, (counts.get(slug) || 0) + 1);
		}
		childCountByParent = counts;
	}

	function refreshTables(progressLabel) {
		rebuildChildCountByParent();
		const filtered = getFilteredThemes();
		const authors = buildAuthors(filtered);
		renderThemesTable(filtered);
		renderAuthorsTable(authors);
		updateHeaderStats(filtered, authors, progressLabel);
		refreshTagsList();
		syncStickyHeaderOffset();
	}

	// Skip expensive DOM rebuilds while the tab is hidden; progress label still updates.
	function maybeRefreshTables(progressLabel) {
		if (document.hidden) {
			if (progressLabel != null) {
				els.statProgress.textContent = progressLabel;
			}
			return;
		}
		refreshTables(progressLabel);
	}

	function refreshTagsList() {
		const counts = new Map();
		for (let i = 0; i < themes.length; i++) {
			const tags = themes[i].tags || {};
			Object.keys(tags).forEach((slug) => {
				const label = tags[slug] || slug;
				const prev = counts.get(slug);
				if (prev) {
					prev.count += 1;
				} else {
					counts.set(slug, { slug, label, count: 1 });
				}
			});
		}

		const items = Array.from(counts.values()).sort((a, b) =>
			a.label.localeCompare(b.label)
		);

		els.tagsList.innerHTML = '';
		if (!items.length) {
			els.tagsList.innerHTML =
				'<div class="empty-hint">No tags yet</div>';
			return;
		}

		const frag = document.createDocumentFragment();
		items.forEach((item) => {
			const label = document.createElement('label');
			const input = document.createElement('input');
			input.type = 'checkbox';
			input.value = item.slug;
			input.checked = selectedTags.has(item.slug);
			input.addEventListener('change', () => {
				if (input.checked) {
					selectedTags.add(item.slug);
				} else {
					selectedTags.delete(item.slug);
				}
				refreshTables(
					isFetching ? els.statProgress.textContent : '100%'
				);
			});
			label.appendChild(input);
			label.appendChild(
				document.createTextNode(
					' ' + item.label + ' (' + item.count + ')'
				)
			);
			frag.appendChild(label);
		});
		els.tagsList.appendChild(frag);
	}

	function renderColumnsPicker() {
		els.columnsList.innerHTML = '';
		const frag = document.createDocumentFragment();
		THEME_COLUMNS.forEach((col) => {
			const label = document.createElement('label');
			const input = document.createElement('input');
			input.type = 'checkbox';
			input.value = col.id;
			input.checked = !!visibleColumns[col.id];
			input.addEventListener('change', () => {
				visibleColumns[col.id] = input.checked;
				saveVisibleColumns();
				refreshTables(
					isFetching ? els.statProgress.textContent : '100%'
				);
			});
			label.appendChild(input);
			label.appendChild(document.createTextNode(' ' + col.label));
			frag.appendChild(label);
		});
		els.columnsList.appendChild(frag);
	}

	function closeDropdowns(exceptId) {
		[
			{ btn: els.tagsToggle, panel: els.tagsPanel },
			{ btn: els.columnsToggle, panel: els.columnsPanel },
		].forEach(({ btn, panel }) => {
			if (exceptId && panel.id === exceptId) {
				return;
			}
			panel.hidden = true;
			btn.setAttribute('aria-expanded', 'false');
		});
	}

	async function apiRequest(params) {
		const url = API + '?' + new URLSearchParams(params).toString();
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error('HTTP ' + response.status);
		}
		return response.json();
	}

	function buildQueryParams(page) {
		const params = {
			action: 'query_themes',
			'request[tag]': 'full-site-editing',
			'request[per_page]': String(PER_PAGE),
			'request[page]': String(page),
		};
		Object.keys(QUERY_FIELDS).forEach((key) => {
			params['request[fields][' + key + ']'] = '1';
		});
		return params;
	}

	async function saveCache() {
		const payload = {
			cached_at: new Date().toISOString(),
			themes: themes.map((t) => {
				// Strip derived fields before caching.
				const {
					authorName,
					authorKey,
					authorProfile,
					parentSlug,
					parentName,
					tagSlugs,
					tagLabels,
					rating_1,
					rating_2,
					rating_3,
					rating_4,
					rating_5,
					...rest
				} = t;
				return rest;
			}),
		};

		const response = await fetch('index.php?action=save-cache', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to save cache');
		}
		cachedAt = data.cached_at || payload.cached_at;
		els.statCached.textContent = formatCachedAt(cachedAt);
	}

	async function clearCacheOnServer() {
		const response = await fetch('index.php?action=clear-cache', {
			method: 'POST',
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to clear cache');
		}
	}

	async function scrapeThemePatterns(slug) {
		const response = await fetch(
			'index.php?action=scrape-patterns&slug=' + encodeURIComponent(slug),
			{ method: 'GET' }
		);
		const data = await response.json();
		if (!response.ok || !data.success) {
			throw new Error(
				(data && data.error) || 'Scrape failed for ' + slug
			);
		}
		return {
			patterns_count: Number(data.patterns_count) || 0,
			style_variations_count: Number(data.style_variations_count) || 0,
		};
	}

	function themesMissingPatterns() {
		const out = [];
		for (let i = 0; i < themes.length; i++) {
			const t = themes[i];
			if (
				t.slug &&
				(t.patterns_count == null || t.style_variations_count == null)
			) {
				out.push(t);
			}
		}
		return out;
	}

	async function scrapePatternsQueue() {
		if (isScrapingPatterns) {
			return;
		}

		let pending = themesMissingPatterns();
		if (!pending.length) {
			return;
		}

		isScrapingPatterns = true;
		scrapeAbort = false;
		setProgressUI(true, 'Scraping patterns…');
		logProgress(
			'Scraping pattern counts for ' + pending.length + ' themes…'
		);

		let round = 1;
		let scrapedSinceSave = 0;

		try {
			while (pending.length && round <= PATTERN_SCRAPE_MAX_ROUNDS) {
				if (scrapeAbort) {
					break;
				}

				const failed = [];
				logProgress(
					'Patterns scrape round ' +
						round +
						': ' +
						pending.length +
						' theme(s)'
				);

				for (let i = 0; i < pending.length; i++) {
					if (scrapeAbort) {
						break;
					}

					const theme = pending[i];
					try {
						const counts = await scrapeThemePatterns(theme.slug);
						theme.patterns_count = counts.patterns_count;
						theme.style_variations_count =
							counts.style_variations_count;
						scrapedSinceSave += 1;

						const done =
							themes.length - themesMissingPatterns().length;
						const label =
							'Patterns ' +
							done +
							' / ' +
							themes.length +
							' (' +
							theme.slug +
							')';
						setProgressUI(true, label);
						maybeRefreshTables(
							isFetching ? els.statProgress.textContent : label
						);

						if (scrapedSinceSave >= 5) {
							await saveCache();
							scrapedSinceSave = 0;
						}
					} catch (error) {
						failed.push(theme);
						logProgress(
							'Patterns scrape failed for ' +
								theme.slug +
								': ' +
								error.message +
								' (retry later)'
						);
					}

					await delay(PATTERN_SCRAPE_DELAY_MS);
				}

				pending = failed;
				if (pending.length && round < PATTERN_SCRAPE_MAX_ROUNDS) {
					logProgress(
						'Retrying ' +
							pending.length +
							' failed pattern scrape(s) after round ' +
							round
					);
				}
				round += 1;
			}

			if (scrapedSinceSave > 0 || !themesMissingPatterns().length) {
				await saveCache();
			}

			const stillMissing = themesMissingPatterns().length;
			if (stillMissing) {
				logProgress(
					'Patterns scrape finished with ' +
						stillMissing +
						' remaining unscraped theme(s)'
				);
				setProgressUI(
					true,
					'Patterns incomplete (' + stillMissing + ' left)'
				);
			} else {
				logProgress('Patterns scrape complete.');
				setProgressUI(false, 'Patterns complete');
				refreshTables('100%');
			}
		} catch (error) {
			logProgress('Patterns scrape ERROR: ' + error.message);
		} finally {
			isScrapingPatterns = false;
			scrapeAbort = false;
		}
	}

	async function fetchAllThemes() {
		if (isFetching) {
			fetchAbort = true;
			return;
		}

		isFetching = true;
		fetchAbort = false;
		scrapeAbort = true;
		themes = [];
		cachedAt = null;
		els.progressLog.innerHTML = '';
		els.clearCacheBtn.disabled = true;
		setProgressUI(true, 'Fetching themes…');
		updateHeaderStats([], [], '0%');
		refreshTables('0%');

		try {
			let page = 1;
			let pages = 1;
			let totalResults = 0;

			do {
				if (fetchAbort) {
					throw new Error('Fetch aborted');
				}

				logProgress('Loading page ' + page + '/' + pages + '…');
				const data = await apiRequest(buildQueryParams(page));

				if (page === 1) {
					pages = (data.info && data.info.pages) || 1;
					totalResults = (data.info && data.info.results) || 0;
					logProgress(
						'Found ' +
							totalResults +
							' block themes across ' +
							pages +
							' pages'
					);
				}

				const batch = data.themes || [];
				for (let i = 0; i < batch.length; i++) {
					themes.push(normalizeTheme(batch[i]));
				}

				const pct = Math.min(100, Math.round((page / pages) * 100));
				const label =
					pct +
					'% (' +
					themes.length +
					(totalResults ? ' / ' + totalResults : '') +
					')';
				setProgressUI(true, 'Fetching… ' + label);
				maybeRefreshTables(label);

				page += 1;
				if (page <= pages) {
					await delay(PAGE_DELAY_MS);
				}
			} while (page <= pages);

			logProgress('Saving cache…');
			await saveCache();
			setProgressUI(true, 'Completed: ' + themes.length + ' themes');
			refreshTables('100%');
			logProgress('Done.');
			await scrapePatternsQueue();
		} catch (error) {
			logProgress('ERROR: ' + error.message);
			setProgressUI(true, 'Error: ' + error.message);
			els.statProgress.textContent = 'Error';
		} finally {
			isFetching = false;
			fetchAbort = false;
			els.clearCacheBtn.disabled = false;
		}
	}

	function bindEvents() {
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				return;
			}
			refreshTables(
				isFetching || isScrapingPatterns
					? els.statProgress.textContent
					: '100%'
			);
		});

		els.themesTbody.addEventListener('click', (e) => {
			const btn = e.target.closest('.js-scroll-to-theme');
			if (!btn) {
				return;
			}
			e.preventDefault();
			scrollToThemeRow(btn.getAttribute('data-theme-slug'));
		});

		document.querySelectorAll('.nav-btn').forEach((btn) => {
			btn.addEventListener('click', () => {
				document
					.querySelectorAll('.nav-btn')
					.forEach((b) => b.classList.remove('active'));
				btn.classList.add('active');
				const target = document.getElementById(btn.dataset.target);
				if (target) {
					target.scrollIntoView({
						behavior: 'smooth',
						block: 'start',
					});
				}
			});
		});

		els.searchInput.addEventListener('input', () => {
			searchQuery = els.searchInput.value || '';
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
		});

		els.tagsToggle.addEventListener('click', (e) => {
			e.stopPropagation();
			const open = els.tagsPanel.hidden;
			closeDropdowns(open ? 'tags-panel' : null);
			els.tagsPanel.hidden = !open;
			els.tagsToggle.setAttribute(
				'aria-expanded',
				open ? 'true' : 'false'
			);
		});

		els.columnsToggle.addEventListener('click', (e) => {
			e.stopPropagation();
			const open = els.columnsPanel.hidden;
			closeDropdowns(open ? 'columns-panel' : null);
			els.columnsPanel.hidden = !open;
			els.columnsToggle.setAttribute(
				'aria-expanded',
				open ? 'true' : 'false'
			);
		});

		els.tagsPanel.addEventListener('click', (e) => e.stopPropagation());
		els.columnsPanel.addEventListener('click', (e) => e.stopPropagation());

		document.addEventListener('click', () => closeDropdowns());

		els.tagsClear.addEventListener('click', () => {
			selectedTags.clear();
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
		});

		els.columnsReset.addEventListener('click', () => {
			THEME_COLUMNS.forEach((col) => {
				visibleColumns[col.id] = col.defaultVisible;
			});
			saveVisibleColumns();
			renderColumnsPicker();
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
		});

		els.clearCacheBtn.addEventListener('click', async () => {
			if (isFetching) {
				fetchAbort = true;
			}
			if (isScrapingPatterns) {
				scrapeAbort = true;
			}
			els.clearCacheBtn.disabled = true;
			try {
				await clearCacheOnServer();
				cachedAt = null;
				themes = [];
				refreshTables('0%');
				await fetchAllThemes();
			} catch (error) {
				logProgress('ERROR: ' + error.message);
				els.clearCacheBtn.disabled = false;
			}
		});

		els.themesThead.addEventListener('click', (e) => {
			const th = e.target.closest('th[data-sort-key]');
			if (!th) {
				return;
			}
			const key = th.getAttribute('data-sort-key');
			if (!key) {
				return;
			}
			if (themeSort.key === key) {
				themeSort.dir = themeSort.dir === 'asc' ? 'desc' : 'asc';
			} else {
				themeSort.key = key;
				themeSort.dir =
					key === 'name' || key === 'slug' || key === 'authorName'
						? 'asc'
						: 'desc';
			}
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
		});

		els.authorsThead.addEventListener('click', (e) => {
			const th = e.target.closest('th[data-sort-key]');
			if (!th) {
				return;
			}
			const key = th.getAttribute('data-sort-key');
			if (!key) {
				return;
			}
			if (authorSort.key === key) {
				authorSort.dir = authorSort.dir === 'asc' ? 'desc' : 'asc';
			} else {
				authorSort.key = key;
				authorSort.dir = key === 'name' ? 'asc' : 'desc';
			}
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
		});
	}

	/**
	 * Keep table thead sticky offset synced with the sticky page header height
	 * so column headers remain visible below .header while scrolling.
	 */
	function syncStickyHeaderOffset() {
		const header = document.querySelector('.header');
		if (!header) {
			return;
		}
		const height = Math.ceil(header.getBoundingClientRect().height);
		const topPx = height + 'px';
		document.documentElement.style.setProperty(
			'--btr-sticky-header-height',
			topPx
		);
		// Inline top keeps offset correct after thead rebuilds and avoids stale CSS cache.
		const thNodes = document.querySelectorAll('.data-table thead th');
		for (let i = 0; i < thNodes.length; i++) {
			thNodes[i].style.top = topPx;
			thNodes[i].style.position = 'sticky';
			thNodes[i].style.zIndex = '5';
		}
	}

	function bindStickyHeaderOffset() {
		const header = document.querySelector('.header');
		if (!header) {
			return;
		}

		syncStickyHeaderOffset();

		if (typeof ResizeObserver !== 'undefined') {
			const observer = new ResizeObserver(() => {
				syncStickyHeaderOffset();
			});
			observer.observe(header);
			return;
		}

		window.addEventListener('resize', syncStickyHeaderOffset);
	}

	function init() {
		bindStickyHeaderOffset();
		bindEvents();
		renderColumnsPicker();

		const boot = Array.isArray(bootstrapThemes) ? bootstrapThemes : [];
		if (boot.length) {
			themes = boot.map(normalizeTheme);
			cachedAt = bootstrapCachedAt || null;
			setProgressUI(false, 'Loaded from cache');
			refreshTables('100%');
			scrapePatternsQueue();
			return;
		}

		fetchAllThemes();
	}

	init();
})();
