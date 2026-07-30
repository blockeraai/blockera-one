/* global bootstrapThemes, bootstrapCachedAt, bootstrapPatternsBySlug, bootstrapPatternsCachedAt, bootstrapReviewsBySlug, bootstrapReviewsCachedAt, bootstrapNotesBySlug */

(function () {
	'use strict';

	const API = 'https://api.wordpress.org/themes/info/1.2/';
	const PER_PAGE = 250;
	const PAGE_DELAY_MS = 100;
	const PATTERN_SCRAPE_DELAY_MS = 200;
	const PATTERN_SCRAPE_MAX_ROUNDS = 3;
	const REVIEW_SCRAPE_DELAY_MS = 400;
	const REVIEW_SCRAPE_MAX_ROUNDS = 3;
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
			sortable: true,
			type: 'screenshot',
			sortKey: 'screenshot_url',
		},
		{
			id: 'rank',
			label: '#',
			defaultVisible: true,
			sortable: true,
			type: 'num',
			sortKey: 'active_installs',
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
			sortable: true,
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
			sortable: true,
			type: 'tags',
			sortKey: 'tagLabels',
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
			sortable: true,
			type: 'url',
			sortKey: 'preview_url',
		},
		{
			id: 'download_link',
			label: 'Download link',
			defaultVisible: false,
			sortable: true,
			type: 'url',
			sortKey: 'download_link',
		},
		{
			id: 'screenshot_url',
			label: 'Screenshot URL',
			defaultVisible: false,
			sortable: true,
			type: 'url',
			sortKey: 'screenshot_url',
		},
		{
			id: 'external_support_url',
			label: 'External support',
			defaultVisible: false,
			sortable: true,
			type: 'url',
			sortKey: 'external_support_url',
		},
		{
			id: 'external_repository_url',
			label: 'External repo',
			defaultVisible: false,
			sortable: true,
			type: 'url',
			sortKey: 'external_repository_url',
		},
		{
			id: 'description',
			label: 'Description',
			defaultVisible: false,
			sortable: true,
			type: 'desc',
			sortKey: 'description',
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
		{
			id: 'rank',
			label: '#',
			sortable: true,
			type: 'num',
			sortKey: 'theme_count',
		},
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
		minInstallsInput: document.getElementById('min-installs-input'),
		createdAfterInput: document.getElementById('created-after-input'),
		updatedAfterInput: document.getElementById('updated-after-input'),
		hasNoteFilter: document.getElementById('has-note-filter'),
		tagsToggle: document.getElementById('tags-toggle'),
		tagsCountBadge: document.getElementById('tags-count-badge'),
		tagsPanel: document.getElementById('tags-panel'),
		tagsList: document.getElementById('tags-list'),
		tagsClear: document.getElementById('tags-clear'),
		columnsToggle: document.getElementById('columns-toggle'),
		columnsCountBadge: document.getElementById('columns-count-badge'),
		columnsPanel: document.getElementById('columns-panel'),
		columnsList: document.getElementById('columns-list'),
		columnsReset: document.getElementById('columns-reset'),
		cacheMenuToggle: document.getElementById('cache-menu-toggle'),
		cacheMenuPanel: document.getElementById('cache-menu-panel'),
		clearThemesCacheBtn: document.getElementById('clear-themes-cache-btn'),
		clearPatternsCacheBtn: document.getElementById(
			'clear-patterns-cache-btn'
		),
		clearReviewsCacheBtn: document.getElementById(
			'clear-reviews-cache-btn'
		),
		progressIndicator: document.getElementById('progress-indicator'),
		progressText: document.getElementById('progress-text'),
		progressLog: document.getElementById('progress-log'),
		themesThead: document.getElementById('themes-thead'),
		themesTbody: document.getElementById('themes-tbody'),
		themesTfoot: document.getElementById('themes-tfoot'),
		authorsThead: document.getElementById('authors-thead'),
		authorsTbody: document.getElementById('authors-tbody'),
		authorsTfoot: document.getElementById('authors-tfoot'),
		themeModal: document.getElementById('theme-modal'),
		themeModalTitle: document.getElementById('theme-modal-title'),
		themeModalBody: document.getElementById('theme-modal-body'),
		themeModalClose: document.getElementById('theme-modal-close'),
		themeModalDialog: document.querySelector(
			'#theme-modal .theme-modal-dialog'
		),
	};

	let themes = [];
	let cachedAt = null;
	let patternsBySlug = Object.assign(
		{},
		typeof bootstrapPatternsBySlug !== 'undefined' &&
			bootstrapPatternsBySlug
			? bootstrapPatternsBySlug
			: {}
	);
	let patternsCachedAt =
		typeof bootstrapPatternsCachedAt !== 'undefined'
			? bootstrapPatternsCachedAt || null
			: null;
	let reviewsBySlug = Object.assign(
		{},
		typeof bootstrapReviewsBySlug !== 'undefined' && bootstrapReviewsBySlug
			? bootstrapReviewsBySlug
			: {}
	);
	let reviewsCachedAt =
		typeof bootstrapReviewsCachedAt !== 'undefined'
			? bootstrapReviewsCachedAt || null
			: null;
	let notesBySlug = Object.assign(
		{},
		typeof bootstrapNotesBySlug !== 'undefined' && bootstrapNotesBySlug
			? bootstrapNotesBySlug
			: {}
	);
	let notesSaveTimer = null;
	let notesSavePending = false;
	let notesSaveInFlight = false;
	let isFetching = false;
	let childCountByParent = new Map();
	let fetchAbort = false;
	let isScrapingPatterns = false;
	let isScrapingReviews = false;
	let scrapeAbort = false;
	let reviewScrapeAbort = false;
	const selectedTags = new Set();
	let searchQuery = '';
	let minActiveInstalls = 0;
	let createdAfter = '';
	let updatedAfter = '';
	let filterHasNote = false;
	let themeModalLastFocus = null;
	const visibleColumns = loadVisibleColumns();
	const themeSort = { key: 'active_installs', dir: 'desc' };
	const authorSort = { key: 'theme_count', dir: 'desc' };
	const THEME_SORT_KEYS = new Set(
		THEME_COLUMNS.filter((col) => col.sortable && col.sortKey).map(
			(col) => col.sortKey
		)
	);
	const AUTHOR_SORT_KEYS = new Set(
		AUTHOR_COLUMNS.filter((col) => col.sortable && col.sortKey).map(
			(col) => col.sortKey
		)
	);
	let syncingFromUrl = false;
	let urlPushTimer = null;

	function getDefaultVisibleColumnIds() {
		const ids = [];
		for (let i = 0; i < THEME_COLUMNS.length; i++) {
			if (THEME_COLUMNS[i].defaultVisible) {
				ids.push(THEME_COLUMNS[i].id);
			}
		}
		return ids;
	}

	function getVisibleColumnIds() {
		const ids = [];
		for (let i = 0; i < THEME_COLUMNS.length; i++) {
			if (visibleColumns[THEME_COLUMNS[i].id]) {
				ids.push(THEME_COLUMNS[i].id);
			}
		}
		return ids;
	}

	function columnsMatchDefaults(ids) {
		const defaults = getDefaultVisibleColumnIds();
		if (ids.length !== defaults.length) {
			return false;
		}
		const set = new Set(ids);
		for (let i = 0; i < defaults.length; i++) {
			if (!set.has(defaults[i])) {
				return false;
			}
		}
		return true;
	}

	function buildFilterSearchParams() {
		const params = new URLSearchParams();
		const q = String(searchQuery || '').trim();
		if (q) {
			params.set('q', q);
		}
		if (minActiveInstalls > 0) {
			params.set('min', String(minActiveInstalls));
		}
		if (createdAfter) {
			params.set('created', createdAfter);
		}
		if (updatedAfter) {
			params.set('updated', updatedAfter);
		}
		if (filterHasNote) {
			params.set('note', '1');
		}
		if (selectedTags.size) {
			params.set('tags', Array.from(selectedTags).sort().join(','));
		}
		if (themeSort.key !== 'active_installs') {
			params.set('sort', themeSort.key);
		}
		if (themeSort.dir !== 'desc') {
			params.set('dir', themeSort.dir);
		}
		if (authorSort.key !== 'theme_count') {
			params.set('asort', authorSort.key);
		}
		if (authorSort.dir !== 'desc') {
			params.set('adir', authorSort.dir);
		}
		const colIds = getVisibleColumnIds();
		if (!columnsMatchDefaults(colIds)) {
			params.set('cols', colIds.join(','));
		}
		return params;
	}

	function pushFilterStateToUrl() {
		if (syncingFromUrl) {
			return;
		}
		const params = buildFilterSearchParams();
		const qs = params.toString();
		const next =
			window.location.pathname +
			(qs ? '?' + qs : '') +
			window.location.hash;
		const current =
			window.location.pathname +
			window.location.search +
			window.location.hash;
		if (next === current) {
			return;
		}
		window.history.pushState(null, '', next);
	}

	function schedulePushFilterStateToUrl() {
		if (syncingFromUrl) {
			return;
		}
		window.clearTimeout(urlPushTimer);
		urlPushTimer = window.setTimeout(() => {
			urlPushTimer = null;
			pushFilterStateToUrl();
		}, 300);
	}

	function applyVisibleColumnsFromIds(ids) {
		const allowed = new Set(THEME_COLUMNS.map((col) => col.id));
		THEME_COLUMNS.forEach((col) => {
			visibleColumns[col.id] = false;
		});
		for (let i = 0; i < ids.length; i++) {
			if (allowed.has(ids[i])) {
				visibleColumns[ids[i]] = true;
			}
		}
		saveVisibleColumns();
	}

	function syncFilterControlsFromState() {
		if (els.searchInput) {
			els.searchInput.value = searchQuery || '';
		}
		if (els.minInstallsInput) {
			els.minInstallsInput.value =
				minActiveInstalls > 0 ? String(minActiveInstalls) : '';
		}
		if (els.createdAfterInput) {
			els.createdAfterInput.value = createdAfter || '';
		}
		if (els.updatedAfterInput) {
			els.updatedAfterInput.value = updatedAfter || '';
		}
		if (els.hasNoteFilter) {
			els.hasNoteFilter.checked = filterHasNote;
		}
	}

	function readFilterStateFromUrl() {
		const params = new URLSearchParams(window.location.search);

		searchQuery = params.has('q') ? String(params.get('q') || '') : '';
		minActiveInstalls = params.has('min')
			? parseMinActiveInstalls(params.get('min'))
			: 0;
		createdAfter = params.has('created')
			? parseDateFilter(params.get('created'))
			: '';
		updatedAfter = params.has('updated')
			? parseDateFilter(params.get('updated'))
			: '';
		filterHasNote =
			params.get('note') === '1' || params.get('note') === 'true';

		selectedTags.clear();
		if (params.has('tags')) {
			const rawTags = String(params.get('tags') || '')
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
			for (let i = 0; i < rawTags.length; i++) {
				selectedTags.add(rawTags[i]);
			}
		}

		const sort = params.get('sort');
		themeSort.key =
			sort && THEME_SORT_KEYS.has(sort) ? sort : 'active_installs';
		const dir = String(params.get('dir') || '').toLowerCase();
		themeSort.dir = dir === 'asc' || dir === 'desc' ? dir : 'desc';

		const asort = params.get('asort');
		authorSort.key =
			asort && AUTHOR_SORT_KEYS.has(asort) ? asort : 'theme_count';
		const adir = String(params.get('adir') || '').toLowerCase();
		authorSort.dir = adir === 'asc' || adir === 'desc' ? adir : 'desc';

		if (params.has('cols')) {
			const colIds = String(params.get('cols') || '')
				.split(',')
				.map((id) => id.trim())
				.filter(Boolean);
			applyVisibleColumnsFromIds(colIds);
		}

		syncFilterControlsFromState();
	}

	function applyStateFromUrlAndRefresh() {
		syncingFromUrl = true;
		try {
			readFilterStateFromUrl();
			renderColumnsPicker();
			refreshTables(
				isFetching || isScrapingPatterns || isScrapingReviews
					? els.statProgress.textContent
					: '100%'
			);
		} finally {
			syncingFromUrl = false;
		}
	}

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

	/**
	 * Return a usable external URL string, ignoring API booleans / empties.
	 *
	 * @param {*} url
	 * @return {string}
	 */
	function usableExternalUrl(url) {
		if (!url || url === true || url === false) {
			return '';
		}
		const href = String(url).trim();
		return href || '';
	}

	/**
	 * Normalize a forge URL down to https://host/owner/repo.
	 *
	 * @param {string} href
	 * @return {string}
	 */
	function normalizeForgeRepositoryUrl(href) {
		const cleaned = String(href || '')
			.trim()
			.replace(/[)\].,;:'"”’]+$/g, '');
		const match = cleaned.match(
			/^https?:\/\/(?:www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/([^/\s?#]+)\/([^/\s?#]+)/i
		);
		if (!match) {
			return '';
		}
		const host = match[1].toLowerCase();
		const owner = match[2];
		const repo = match[3].replace(/\.git$/i, '');
		if (!owner || !repo) {
			return '';
		}
		return 'https://' + host + '/' + owner + '/' + repo;
	}

	/**
	 * Some themes put the repo in the description but leave external_repository_url empty.
	 *
	 * @param {string} description
	 * @return {string}
	 */
	function extractRepositoryUrlFromDescription(description) {
		const text = String(description || '');
		if (!text) {
			return '';
		}

		// Prefer an explicitly labeled repository link when present.
		const labeled = text.match(
			/\[?\s*repository\s*\]?\s*[:\-]?\s*(https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org)\/[^\s<]+)/i
		);
		if (labeled && labeled[1]) {
			const fromLabel = normalizeForgeRepositoryUrl(labeled[1]);
			if (fromLabel) {
				return fromLabel;
			}
		}

		const re =
			/https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org)\/[^\s<]+/gi;
		let match;
		while ((match = re.exec(text)) !== null) {
			const normalized = normalizeForgeRepositoryUrl(match[0]);
			if (normalized) {
				return normalized;
			}
		}
		return '';
	}

	/**
	 * Prefer API external_repository_url; fall back to a forge URL in the description.
	 *
	 * @param {Object} theme
	 * @return {string}
	 */
	function resolveExternalRepositoryUrl(theme) {
		const fromField = usableExternalUrl(
			theme && theme.external_repository_url
		);
		if (fromField) {
			return fromField;
		}
		return extractRepositoryUrlFromDescription(theme && theme.description);
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

		return mergeSatelliteFields({
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
			patterns_count: null,
			style_variations_count: null,
			patterns: null,
			style_variations: null,
			reviews: null,
		});
	}

	/**
	 * Whether a patterns cache entry has full pattern + style details.
	 *
	 * @param {Object|null|undefined} entry
	 * @return {boolean}
	 */
	function isPatternsCacheComplete(entry) {
		if (!entry || typeof entry !== 'object') {
			return false;
		}
		if (
			!Array.isArray(entry.patterns) ||
			!Array.isArray(entry.style_variations)
		) {
			return false;
		}
		if (
			entry.patterns_count == null ||
			entry.style_variations_count == null
		) {
			return false;
		}
		return true;
	}

	/**
	 * Apply patterns/reviews satellite caches onto a theme (by slug).
	 *
	 * @param {Object} theme
	 * @return {Object}
	 */
	function mergeSatelliteFields(theme) {
		const slug = theme && theme.slug ? String(theme.slug) : '';
		if (!slug) {
			theme.patterns_count = null;
			theme.style_variations_count = null;
			theme.patterns = null;
			theme.style_variations = null;
			theme.reviews = null;
			return theme;
		}

		const p = patternsBySlug[slug];
		if (isPatternsCacheComplete(p)) {
			theme.patterns_count = Number(p.patterns_count) || 0;
			theme.style_variations_count =
				Number(p.style_variations_count) || 0;
			theme.patterns = p.patterns;
			theme.style_variations = p.style_variations;
		} else {
			theme.patterns_count = null;
			theme.style_variations_count = null;
			theme.patterns = null;
			theme.style_variations = null;
			if (p) {
				delete patternsBySlug[slug];
			}
		}

		const r = reviewsBySlug[slug];
		if (r && typeof r === 'object' && Array.isArray(r.reviews)) {
			const cachedCount = Number(r.num_ratings);
			const currentCount = Number(theme.num_ratings) || 0;
			// Cache is valid only when stored review count still matches theme API.
			// Also invalidate old capped scrapes (max 100) that are incomplete.
			const isStaleCap = r.reviews.length === 100 && currentCount > 100;
			if (
				Number.isFinite(cachedCount) &&
				cachedCount === currentCount &&
				!isStaleCap
			) {
				theme.reviews = r.reviews;
			} else {
				theme.reviews = null;
				delete reviewsBySlug[slug];
			}
		} else {
			theme.reviews = null;
		}

		return theme;
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

	function parseMinActiveInstalls(raw) {
		const n = parseInt(String(raw == null ? '' : raw).trim(), 10);
		if (!Number.isFinite(n) || n <= 0) {
			return 0;
		}
		return n;
	}

	/** Normalize date-input value to YYYY-MM-DD, or '' when empty/invalid. */
	function parseDateFilter(raw) {
		const str = String(raw == null ? '' : raw).trim();
		if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
			return '';
		}
		return str;
	}

	function getFilteredThemes() {
		const q = searchQuery.trim().toLowerCase();
		const tagList = Array.from(selectedTags);
		const minInstalls = minActiveInstalls;
		const createdMin = createdAfter;
		const updatedMin = updatedAfter;
		const onlyWithNote = filterHasNote;

		const out = [];
		for (let i = 0; i < themes.length; i++) {
			const theme = themes[i];

			if (onlyWithNote && !getThemeNote(theme.slug)) {
				continue;
			}

			if (minInstalls > 0 && (theme.active_installs || 0) < minInstalls) {
				continue;
			}

			// Dates are YYYY-MM-DD — lexicographic compare matches chronological order.
			if (
				createdMin &&
				(!theme.creation_time || theme.creation_time < createdMin)
			) {
				continue;
			}

			if (
				updatedMin &&
				(!theme.last_updated || theme.last_updated < updatedMin)
			) {
				continue;
			}

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
				// Include parent slug/name so child themes are findable by parent.
				const hay =
					(theme.name || '') +
					' ' +
					(theme.slug || '') +
					' ' +
					(theme.authorName || '') +
					' ' +
					(theme.description || '') +
					' ' +
					(theme.parentSlug || '') +
					' ' +
					(theme.parentName || '');
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
		if (typeof a === 'boolean' && typeof b === 'boolean') {
			if (a === b) {
				return 0;
			}
			return (a ? 1 : 0) < (b ? 1 : 0) ? -1 * mul : 1 * mul;
		}
		if (typeof a === 'number' && typeof b === 'number') {
			if (a === b) {
				return 0;
			}
			return a < b ? -1 * mul : 1 * mul;
		}
		const as = Array.isArray(a)
			? a.join(', ').toLowerCase()
			: String(a).toLowerCase();
		const bs = Array.isArray(b)
			? b.join(', ').toLowerCase()
			: String(b).toLowerCase();
		if (as === bs) {
			return 0;
		}
		return as < bs ? -1 * mul : 1 * mul;
	}

	function defaultDirForThemeSortKey(key) {
		for (let i = 0; i < THEME_COLUMNS.length; i++) {
			const col = THEME_COLUMNS[i];
			if (col.sortKey !== key) {
				continue;
			}
			if (
				col.type === 'text' ||
				col.type === 'url' ||
				col.type === 'tags' ||
				col.type === 'desc' ||
				col.type === 'screenshot'
			) {
				return 'asc';
			}
			return 'desc';
		}
		return 'desc';
	}

	function defaultDirForAuthorSortKey(key) {
		for (let i = 0; i < AUTHOR_COLUMNS.length; i++) {
			const col = AUTHOR_COLUMNS[i];
			if (col.sortKey !== key) {
				continue;
			}
			if (col.type === 'text') {
				return 'asc';
			}
			return 'desc';
		}
		return 'desc';
	}

	function sortThemes(list) {
		const key = themeSort.key;
		const dir = themeSort.dir;
		const sorted = list.slice();
		sorted.sort((a, b) => {
			const aVal =
				key === 'external_repository_url'
					? resolveExternalRepositoryUrl(a)
					: a[key];
			const bVal =
				key === 'external_repository_url'
					? resolveExternalRepositoryUrl(b)
					: b[key];
			let cmp = compareValues(aVal, bVal, dir);
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
				const slugSafe = escapeHtml(theme.slug || '');
				const hasNote = Boolean(getThemeNote(theme.slug));
				const noteBtn =
					'<button type="button" class="js-theme-note theme-note-btn' +
					(hasNote ? ' has-note' : '') +
					'" data-theme-slug="' +
					slugSafe +
					'" title="' +
					(hasNote ? 'Edit note' : 'Add note') +
					'" aria-label="' +
					(hasNote ? 'Edit note' : 'Add note') +
					'">' +
					'<svg class="theme-note-icon" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
					'<path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>' +
					'</svg>' +
					'</button>';
				const nameLink =
					'<a class="theme-name-link" href="' +
					escapeHtml(theme.homepage || '#') +
					'" target="_blank" rel="noopener noreferrer">' +
					escapeHtml(theme.name || '') +
					'</a>' +
					commercialMark;

				const previewUrl = theme.preview_url || '';
				const homeUrl = theme.homepage || '';
				const repoUrl = resolveExternalRepositoryUrl(theme);

				const hoverParts = [];
				hoverParts.push(
					'<button type="button" class="js-theme-details theme-name-hover-btn" data-theme-slug="' +
						slugSafe +
						'">Details</button>'
				);
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
					noteBtn +
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
			case 'ratings': {
				const label =
					formatNumber(theme.num_ratings) +
					' (' +
					formatNumber(theme.rating) +
					'%)';
				if (theme.reviews != null) {
					return (
						'<td class="num">' +
						'<button type="button" class="js-theme-details-reviews ratings-reviews-link" data-theme-slug="' +
						escapeHtml(theme.slug) +
						'" title="Open reviews">' +
						escapeHtml(label) +
						'</button>' +
						'</td>'
					);
				}
				return '<td class="num">' + escapeHtml(label) + '</td>';
			}
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
			case 'patterns_count': {
				if (theme.patterns_count == null) {
					return '<td class="num">…</td>';
				}
				const label = formatNumber(theme.patterns_count);
				if (theme.patterns != null) {
					return (
						'<td class="num">' +
						'<button type="button" class="js-theme-details-patterns ratings-reviews-link" data-theme-slug="' +
						escapeHtml(theme.slug) +
						'" title="Open patterns">' +
						escapeHtml(label) +
						'</button>' +
						'</td>'
					);
				}
				return '<td class="num">' + escapeHtml(label) + '</td>';
			}
			case 'style_variations_count': {
				if (theme.style_variations_count == null) {
					return '<td class="num">…</td>';
				}
				const label = formatNumber(theme.style_variations_count);
				if (theme.style_variations != null) {
					return (
						'<td class="num">' +
						'<button type="button" class="js-theme-details-styles ratings-reviews-link" data-theme-slug="' +
						escapeHtml(theme.slug) +
						'" title="Open style variations">' +
						escapeHtml(label) +
						'</button>' +
						'</td>'
					);
				}
				return '<td class="num">' + escapeHtml(label) + '</td>';
			}
			case 'is_commercial':
			case 'is_community':
				return '<td>' + (theme[col.id] ? 'Yes' : 'No') + '</td>';
			case 'parent':
				return '<td>' + escapeHtml(theme.parentSlug || '') + '</td>';
			case 'preview_url':
			case 'homepage':
			case 'download_link':
			case 'screenshot_url':
			case 'external_support_url': {
				const url = usableExternalUrl(theme[col.id]);
				if (!url) {
					return '<td>—</td>';
				}
				return (
					'<td><a href="' +
					escapeHtml(url) +
					'" target="_blank" rel="noopener noreferrer">Open</a></td>'
				);
			}
			case 'external_repository_url': {
				const url = resolveExternalRepositoryUrl(theme);
				if (!url) {
					return '<td>—</td>';
				}
				return (
					'<td><a href="' +
					escapeHtml(url) +
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

	function columnAlignClass(col) {
		// Keep header/body/footer alignment in sync (.num → text-align: right).
		return col.type === 'num' || col.type === 'ratings' ? ' num' : '';
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
			const alignClass = columnAlignClass(col);
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
				alignClass +
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

	function modalExternalLink(url, label) {
		const href = usableExternalUrl(url);
		if (!href) {
			return '';
		}
		return (
			'<a class="control-btn" href="' +
			escapeHtml(href) +
			'" target="_blank" rel="noopener noreferrer">' +
			escapeHtml(label) +
			'</a>'
		);
	}

	function modalTableRow(label, valueHtml) {
		if (valueHtml == null || valueHtml === '') {
			return '';
		}
		return (
			'<tr>' +
			'<th scope="row">' +
			escapeHtml(label) +
			'</th>' +
			'<td>' +
			valueHtml +
			'</td>' +
			'</tr>'
		);
	}

	function modalImage(url, alt) {
		if (!url || url === true || url === false) {
			return '';
		}
		const href = String(url);
		if (!href) {
			return '';
		}
		return (
			'<a href="' +
			escapeHtml(href) +
			'" target="_blank" rel="noopener noreferrer">' +
			'<img class="theme-modal-img" src="' +
			escapeHtml(href) +
			'" alt="' +
			escapeHtml(alt || '') +
			'" decoding="async">' +
			'</a>'
		);
	}

	function modalTextLink(url, label) {
		if (!url || url === true || url === false) {
			return '';
		}
		const href = String(url);
		if (!href) {
			return '';
		}
		return (
			'<a href="' +
			escapeHtml(href) +
			'" target="_blank" rel="noopener noreferrer">' +
			escapeHtml(label || href) +
			'</a>'
		);
	}

	function renderThemeDetailsModal(theme) {
		const childCount = theme.slug
			? childCountByParent.get(theme.slug) || 0
			: 0;
		const author = theme.author;
		const authorName = theme.authorName || '';
		const authorProfile = theme.authorProfile || '';
		const authorAvatar =
			author && typeof author === 'object' ? author.avatar || '' : '';
		const authorUrl =
			author && typeof author === 'object' ? author.author_url || '' : '';
		const repositoryUrl = resolveExternalRepositoryUrl(theme);

		let authorHtml = escapeHtml(authorName || '—');
		if (authorProfile) {
			authorHtml =
				'<a href="' +
				escapeHtml(authorProfile) +
				'" target="_blank" rel="noopener noreferrer">' +
				escapeHtml(authorName || authorProfile) +
				'</a>';
		}

		const parentSlugVal = theme.parentSlug || '';
		let parentHtml = '—';
		if (parentSlugVal) {
			const pName =
				theme.parentName || parentDisplayName(theme) || parentSlugVal;
			parentHtml =
				'<button type="button" class="js-scroll-to-theme parent-theme-link" data-theme-slug="' +
				escapeHtml(parentSlugVal) +
				'" data-close-modal="1" title="Scroll to parent theme">' +
				escapeHtml(pName) +
				'</button>' +
				' <span class="theme-modal-muted">(' +
				escapeHtml(parentSlugVal) +
				')</span>';
		}

		const badges = [];
		if (theme.is_commercial) {
			badges.push(
				'<span class="theme-modal-badge is-on">Commercial</span>'
			);
		}
		if (theme.is_community) {
			badges.push(
				'<span class="theme-modal-badge is-on">Community</span>'
			);
		}
		if (parentSlugVal) {
			badges.push('<span class="theme-modal-badge">Child theme</span>');
		}
		if (childCount > 0) {
			badges.push(
				'<span class="theme-modal-badge is-on">Parent of ' +
					formatNumber(childCount) +
					'</span>'
			);
		}

		const actions = [
			modalExternalLink(theme.preview_url, 'Preview'),
			modalExternalLink(theme.homepage, 'Home'),
			modalExternalLink(theme.download_link, 'Download'),
			modalExternalLink(repositoryUrl, 'Repository'),
			modalExternalLink(theme.external_support_url, 'Support'),
		]
			.filter(Boolean)
			.join('');

		const ratingsTotal =
			(theme.rating_1 || 0) +
			(theme.rating_2 || 0) +
			(theme.rating_3 || 0) +
			(theme.rating_4 || 0) +
			(theme.rating_5 || 0);
		const ratingRows = [5, 4, 3, 2, 1]
			.map((star) => {
				const n = theme['rating_' + star] || 0;
				const pct = ratingsTotal
					? Math.round((n / ratingsTotal) * 100)
					: 0;
				return (
					'<div class="theme-modal-rating-row">' +
					'<span>★' +
					star +
					'</span>' +
					'<div class="theme-modal-rating-bar"><div class="theme-modal-rating-fill" style="width:' +
					pct +
					'%"></div></div>' +
					'<span>' +
					formatNumber(n) +
					'</span>' +
					'</div>'
				);
			})
			.join('');

		const tags = theme.tagLabels || [];
		const tagsHtml = tags.length
			? '<div class="theme-modal-tags">' +
				tags
					.map(
						(tag) =>
							'<span class="theme-modal-tag">' +
							escapeHtml(tag) +
							'</span>'
					)
					.join('') +
				'</div>'
			: '<span class="theme-modal-muted">No tags</span>';

		const shot = theme.screenshot_url
			? '<img class="theme-modal-shot" src="' +
				escapeHtml(theme.screenshot_url) +
				'" alt="" decoding="async">'
			: '<div class="theme-modal-shot-empty">No screenshot</div>';

		const childThemes = getChildThemesForParent(theme.slug || '');
		let childrenHtml = '<span class="theme-modal-muted">None</span>';
		if (childThemes.length) {
			const childLinks = [];
			let childrenInstalls = 0;
			for (let i = 0; i < childThemes.length; i++) {
				const child = childThemes[i];
				const childSlug = child.slug || '';
				if (!childSlug) {
					continue;
				}
				const childInstalls = child.active_installs || 0;
				childrenInstalls += childInstalls;
				childLinks.push(
					'<li>' +
						'<button type="button" class="js-scroll-to-theme parent-theme-link" data-theme-slug="' +
						escapeHtml(childSlug) +
						'" data-close-modal="1" title="Scroll to child theme">' +
						escapeHtml(child.name || childSlug) +
						'</button>' +
						' <span class="theme-modal-muted">(' +
						escapeHtml(childSlug) +
						')</span>' +
						' <span class="theme-modal-child-installs">' +
						formatNumber(childInstalls) +
						' installs</span>' +
						'</li>'
				);
			}
			const familyInstalls =
				(theme.active_installs || 0) + childrenInstalls;
			childrenHtml =
				'<ul class="theme-modal-children-list">' +
				childLinks.join('') +
				'</ul>' +
				'<div class="theme-modal-children-total">' +
				'Family active installs: ' +
				'<strong>' +
				formatNumber(familyInstalls) +
				'</strong>' +
				' <span class="theme-modal-muted">(parent ' +
				formatNumber(theme.active_installs || 0) +
				' + children ' +
				formatNumber(childrenInstalls) +
				')</span>' +
				'</div>';
		}

		const detailRows = [
			modalTableRow('Slug', escapeHtml(theme.slug || '—')),
			modalTableRow('Version', escapeHtml(theme.version || '—')),
			modalTableRow('Author', authorHtml),
			authorAvatar
				? modalTableRow(
						'Author avatar',
						modalImage(authorAvatar, authorName || 'Author')
					)
				: '',
			authorUrl
				? modalTableRow(
						'Author URL',
						modalTextLink(authorUrl, authorUrl)
					)
				: '',
			modalTableRow('Created', escapeHtml(theme.creation_time || '—')),
			modalTableRow('Updated', escapeHtml(theme.last_updated || '—')),
			theme.last_updated_time &&
			theme.last_updated_time !== theme.last_updated
				? modalTableRow(
						'Updated at',
						escapeHtml(String(theme.last_updated_time))
					)
				: '',
			modalTableRow('Requires WP', escapeHtml(theme.requires || '—')),
			modalTableRow(
				'Requires PHP',
				escapeHtml(theme.requires_php || '—')
			),
			modalTableRow('Template', escapeHtml(theme.template || '—')),
			modalTableRow('Parent', parentHtml),
			modalTableRow('Children', childrenHtml),
			modalTableRow('Commercial', theme.is_commercial ? 'Yes' : 'No'),
			modalTableRow('Community', theme.is_community ? 'Yes' : 'No'),
			modalTableRow(
				'Screenshot URL',
				modalTextLink(theme.screenshot_url, theme.screenshot_url) || '—'
			),
			modalTableRow(
				'Homepage',
				modalTextLink(theme.homepage, theme.homepage) || '—'
			),
			modalTableRow(
				'Preview URL',
				modalTextLink(theme.preview_url, theme.preview_url) || '—'
			),
			modalTableRow(
				'Download link',
				modalTextLink(theme.download_link, theme.download_link) || '—'
			),
			modalTableRow(
				'External support',
				modalTextLink(
					theme.external_support_url,
					theme.external_support_url
				) || '—'
			),
			modalTableRow(
				'External repo',
				modalTextLink(repositoryUrl, repositoryUrl) || '—'
			),
		]
			.filter(Boolean)
			.join('');

		els.themeModalTitle.textContent =
			theme.name || theme.slug || 'Theme details';
		els.themeModalBody.innerHTML =
			'<div class="theme-modal-hero">' +
			shot +
			'<div class="theme-modal-hero-main">' +
			'<h3>' +
			escapeHtml(theme.name || theme.slug || 'Untitled') +
			'</h3>' +
			'<div class="theme-modal-meta">' +
			'<span>v' +
			escapeHtml(theme.version || '—') +
			'</span>' +
			'<span>' +
			escapeHtml(theme.slug || '') +
			'</span>' +
			'</div>' +
			(badges.length
				? '<div class="theme-modal-badges">' +
					badges.join('') +
					'</div>'
				: '') +
			(actions
				? '<div class="theme-modal-actions">' + actions + '</div>'
				: '') +
			'</div>' +
			'</div>' +
			'<div class="theme-modal-stats">' +
			'<div class="theme-modal-stat"><span class="theme-modal-stat-label">Active installs</span><span class="theme-modal-stat-value">' +
			formatNumber(theme.active_installs) +
			'</span></div>' +
			'<div class="theme-modal-stat"><span class="theme-modal-stat-label">Downloads</span><span class="theme-modal-stat-value">' +
			formatNumber(theme.downloaded) +
			'</span></div>' +
			'<div class="theme-modal-stat"><span class="theme-modal-stat-label">Rating</span><span class="theme-modal-stat-value">' +
			formatNumber(theme.rating) +
			'%</span></div>' +
			'<div class="theme-modal-stat"><span class="theme-modal-stat-label">Ratings</span><span class="theme-modal-stat-value">' +
			formatNumber(theme.num_ratings) +
			'</span></div>' +
			'<div class="theme-modal-stat"><span class="theme-modal-stat-label">Patterns</span><span class="theme-modal-stat-value">' +
			(theme.patterns_count == null
				? '…'
				: formatNumber(theme.patterns_count)) +
			'</span></div>' +
			'<div class="theme-modal-stat"><span class="theme-modal-stat-label">Style variations</span><span class="theme-modal-stat-value">' +
			(theme.style_variations_count == null
				? '…'
				: formatNumber(theme.style_variations_count)) +
			'</span></div>' +
			'</div>' +
			(theme.description
				? '<section class="theme-modal-section"><h4 class="theme-modal-section-title">Description</h4><p class="theme-modal-description">' +
					escapeHtml(theme.description) +
					'</p></section>'
				: '') +
			'<section class="theme-modal-section" id="theme-modal-notes">' +
			'<h4 class="theme-modal-section-title">Notes</h4>' +
			'<textarea class="theme-modal-note" id="theme-modal-note" data-theme-slug="' +
			escapeHtml(theme.slug || '') +
			'" rows="4" placeholder="Add a private note for this theme…">' +
			escapeHtml(getThemeNote(theme.slug)) +
			'</textarea>' +
			'</section>' +
			'<section class="theme-modal-section">' +
			'<h4 class="theme-modal-section-title">Details</h4>' +
			'<table class="theme-modal-table">' +
			'<tbody>' +
			detailRows +
			'</tbody>' +
			'</table>' +
			'</section>' +
			'<section class="theme-modal-section">' +
			'<h4 class="theme-modal-section-title">Ratings breakdown</h4>' +
			'<div class="theme-modal-ratings">' +
			ratingRows +
			'</div>' +
			'</section>' +
			'<section class="theme-modal-section">' +
			'<h4 class="theme-modal-section-title">Tags</h4>' +
			tagsHtml +
			'</section>' +
			'<section class="theme-modal-section" id="theme-modal-patterns">' +
			'<h4 class="theme-modal-section-title">Patterns' +
			(theme.patterns != null
				? ' (' + formatNumber(theme.patterns.length) + ')'
				: '') +
			'</h4>' +
			renderThemePatternsSection(theme) +
			'</section>' +
			'<section class="theme-modal-section" id="theme-modal-styles">' +
			'<h4 class="theme-modal-section-title">Style variations' +
			(theme.style_variations != null
				? ' (' + formatNumber(theme.style_variations.length) + ')'
				: '') +
			'</h4>' +
			renderThemeStyleVariationsSection(theme) +
			'</section>' +
			'<section class="theme-modal-section" id="theme-modal-reviews">' +
			'<h4 class="theme-modal-section-title">Reviews' +
			(theme.reviews != null
				? ' (' + formatNumber(theme.reviews.length) + ')'
				: '') +
			'</h4>' +
			renderThemeReviewsSection(theme) +
			'</section>';
	}

	function renderPreviewCard(item) {
		const preview = item && item.preview ? String(item.preview) : '';
		const name = (item && item.name) || 'Untitled';
		const id = (item && item.id) || '';
		const img = preview
			? '<img class="theme-modal-preview-img" src="' +
				escapeHtml(preview) +
				'" alt="' +
				escapeHtml(name) +
				'" loading="lazy" decoding="async">'
			: '<div class="theme-modal-preview-empty">No preview</div>';
		return (
			'<article class="theme-modal-preview-card">' +
			'<div class="theme-modal-preview-media">' +
			img +
			'</div>' +
			'<div class="theme-modal-preview-meta">' +
			'<strong class="theme-modal-preview-name">' +
			escapeHtml(name) +
			'</strong>' +
			(id
				? '<code class="theme-modal-preview-id">' +
					escapeHtml(id) +
					'</code>'
				: '') +
			'</div>' +
			'</article>'
		);
	}

	function renderThemePatternsSection(theme) {
		if (theme.patterns == null) {
			return '<p class="theme-modal-muted">Not scraped yet</p>';
		}
		if (!theme.patterns.length) {
			return '<p class="theme-modal-muted">No patterns</p>';
		}
		const items = [];
		for (let i = 0; i < theme.patterns.length; i++) {
			items.push(renderPreviewCard(theme.patterns[i]));
		}
		return (
			'<div class="theme-modal-preview-grid">' + items.join('') + '</div>'
		);
	}

	function renderThemeStyleVariationsSection(theme) {
		if (theme.style_variations == null) {
			return '<p class="theme-modal-muted">Not scraped yet</p>';
		}
		if (!theme.style_variations.length) {
			return '<p class="theme-modal-muted">No style variations</p>';
		}
		const items = [];
		for (let i = 0; i < theme.style_variations.length; i++) {
			items.push(renderPreviewCard(theme.style_variations[i]));
		}
		return (
			'<div class="theme-modal-preview-grid">' + items.join('') + '</div>'
		);
	}

	function formatReviewDate(value) {
		if (!value) {
			return '—';
		}
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) {
			return String(value);
		}
		return formatDateOnly(d.toISOString());
	}

	function renderStars(rating) {
		const n = Number(rating);
		if (!Number.isFinite(n) || n < 1) {
			return '<span class="theme-modal-muted">No rating</span>';
		}
		const filled = Math.max(1, Math.min(5, Math.round(n)));
		let html =
			'<span class="theme-modal-review-stars" aria-label="' +
			filled +
			' out of 5 stars">';
		for (let i = 1; i <= 5; i++) {
			html +=
				'<span class="' +
				(i <= filled ? 'is-on' : 'is-off') +
				'">★</span>';
		}
		html += '</span>';
		return html;
	}

	function renderThemeReviewsSection(theme) {
		if (theme.reviews == null) {
			return '<p class="theme-modal-muted">Not scraped yet</p>';
		}
		if (!theme.reviews.length) {
			return '<p class="theme-modal-muted">No reviews</p>';
		}

		const items = [];
		for (let i = 0; i < theme.reviews.length; i++) {
			const r = theme.reviews[i] || {};
			const link = r.link ? modalExternalLink(r.link, 'Open review') : '';
			items.push(
				'<article class="theme-modal-review">' +
					'<div class="theme-modal-review-head">' +
					renderStars(r.rating) +
					'<strong class="theme-modal-review-title">' +
					escapeHtml(r.title || 'Untitled review') +
					'</strong>' +
					'</div>' +
					'<div class="theme-modal-review-meta">' +
					'<span>' +
					escapeHtml(r.author || 'Anonymous') +
					'</span>' +
					'<span>' +
					escapeHtml(formatReviewDate(r.date)) +
					'</span>' +
					(link ? '<span>' + link + '</span>' : '') +
					'</div>' +
					(r.content
						? '<p class="theme-modal-review-body">' +
							escapeHtml(r.content) +
							'</p>'
						: '') +
					'</article>'
			);
		}
		return '<div class="theme-modal-reviews">' + items.join('') + '</div>';
	}

	function openThemeDetailsModal(theme, options) {
		if (!theme || !els.themeModal) {
			return;
		}
		const opts = options && typeof options === 'object' ? options : {};
		themeModalLastFocus = document.activeElement;
		renderThemeDetailsModal(theme);
		els.themeModal.hidden = false;
		document.body.classList.add('theme-modal-open');
		window.requestAnimationFrame(() => {
			let scrollTarget = null;
			if (opts.focusNote) {
				scrollTarget = '#theme-modal-notes';
			} else if (opts.scrollToReviews) {
				scrollTarget = '#theme-modal-reviews';
			} else if (opts.scrollToPatterns) {
				scrollTarget = '#theme-modal-patterns';
			} else if (opts.scrollToStyles) {
				scrollTarget = '#theme-modal-styles';
			}
			if (scrollTarget) {
				const section = els.themeModalBody.querySelector(scrollTarget);
				if (section) {
					// Scroll modal body (overflow:auto) to the target section.
					els.themeModalBody.scrollTop = Math.max(
						0,
						section.offsetTop - 12
					);
				}
				if (opts.focusNote) {
					const noteField =
						els.themeModalBody.querySelector('#theme-modal-note');
					if (noteField && typeof noteField.focus === 'function') {
						noteField.focus();
						const len = noteField.value.length;
						if (typeof noteField.setSelectionRange === 'function') {
							noteField.setSelectionRange(len, len);
						}
						return;
					}
				}
				if (section) {
					return;
				}
			}
			if (els.themeModalClose) {
				els.themeModalClose.focus();
			} else if (els.themeModalDialog) {
				els.themeModalDialog.focus();
			}
		});
	}

	function closeThemeDetailsModal() {
		if (!els.themeModal || els.themeModal.hidden) {
			return;
		}
		const noteField = els.themeModalBody.querySelector('#theme-modal-note');
		if (noteField) {
			applyThemeNoteFromTextarea(noteField);
			scheduleSaveNotes(true);
		}
		els.themeModal.hidden = true;
		document.body.classList.remove('theme-modal-open');
		els.themeModalBody.innerHTML = '';
		els.themeModalTitle.textContent = 'Theme details';
		if (
			themeModalLastFocus &&
			typeof themeModalLastFocus.focus === 'function'
		) {
			themeModalLastFocus.focus();
		}
		themeModalLastFocus = null;
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

		// Parent may be hidden by active filters — clear them and try again.
		const parentTheme = findThemeBySlug(slug);
		if (!parentTheme) {
			return;
		}

		searchQuery = '';
		els.searchInput.value = '';
		minActiveInstalls = 0;
		els.minInstallsInput.value = '';
		createdAfter = '';
		els.createdAfterInput.value = '';
		updatedAfter = '';
		els.updatedAfterInput.value = '';
		filterHasNote = false;
		if (els.hasNoteFilter) {
			els.hasNoteFilter.checked = false;
		}
		selectedTags.clear();
		refreshTables(isFetching ? els.statProgress.textContent : '100%');
		pushFilterStateToUrl();
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
			const alignClass = columnAlignClass(col);
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
				alignClass +
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

	function getChildThemesForParent(parentSlugVal) {
		if (!parentSlugVal) {
			return [];
		}
		const children = [];
		for (let i = 0; i < themes.length; i++) {
			if (themes[i].parentSlug === parentSlugVal) {
				children.push(themes[i]);
			}
		}
		children.sort((a, b) =>
			String(a.name || a.slug || '').localeCompare(
				String(b.name || b.slug || '')
			)
		);
		return children;
	}

	function updateFilterCountBadge(badge, button, count, label) {
		if (!badge || !button) {
			return;
		}
		if (count > 0) {
			badge.textContent = String(count);
			badge.hidden = false;
			badge.setAttribute('aria-hidden', 'false');
			button.setAttribute('aria-label', label + ', ' + count + ' active');
		} else {
			badge.textContent = '';
			badge.hidden = true;
			badge.setAttribute('aria-hidden', 'true');
			button.removeAttribute('aria-label');
		}
	}

	function countActiveFilters() {
		let count = selectedTags.size;
		if (filterHasNote) {
			count += 1;
		}
		if (minActiveInstalls > 0) {
			count += 1;
		}
		if (createdAfter) {
			count += 1;
		}
		if (updatedAfter) {
			count += 1;
		}
		return count;
	}

	function updateTagsFilterBadge() {
		updateFilterCountBadge(
			els.tagsCountBadge,
			els.tagsToggle,
			countActiveFilters(),
			'Filters'
		);
	}

	function countActiveColumns() {
		let count = 0;
		for (let i = 0; i < THEME_COLUMNS.length; i++) {
			if (visibleColumns[THEME_COLUMNS[i].id]) {
				count += 1;
			}
		}
		return count;
	}

	function updateColumnsFilterBadge() {
		updateFilterCountBadge(
			els.columnsCountBadge,
			els.columnsToggle,
			countActiveColumns(),
			'Columns'
		);
	}

	function refreshTables(progressLabel) {
		rebuildChildCountByParent();
		const filtered = getFilteredThemes();
		const authors = buildAuthors(filtered);
		renderThemesTable(filtered);
		renderAuthorsTable(authors);
		updateHeaderStats(filtered, authors, progressLabel);
		refreshTagsList();
		updateTagsFilterBadge();
		updateColumnsFilterBadge();
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
				pushFilterStateToUrl();
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
				pushFilterStateToUrl();
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
			{ btn: els.cacheMenuToggle, panel: els.cacheMenuPanel },
		].forEach(({ btn, panel }) => {
			if (!btn || !panel) {
				return;
			}
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

	function setClearButtonsDisabled(disabled) {
		if (els.cacheMenuToggle) {
			els.cacheMenuToggle.disabled = !!disabled;
		}
		if (els.clearThemesCacheBtn) {
			els.clearThemesCacheBtn.disabled = !!disabled;
		}
		if (els.clearPatternsCacheBtn) {
			els.clearPatternsCacheBtn.disabled = !!disabled;
		}
		if (els.clearReviewsCacheBtn) {
			els.clearReviewsCacheBtn.disabled = !!disabled;
		}
	}

	async function waitForScrapersIdle() {
		let spins = 0;
		while ((isScrapingPatterns || isScrapingReviews) && spins < 200) {
			await delay(50);
			spins += 1;
		}
	}

	function buildThemesCachePayload() {
		return {
			cached_at: new Date().toISOString(),
			themes: themes.map((t) => {
				// Strip derived + satellite fields before caching themes.
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
					patterns_count,
					style_variations_count,
					patterns,
					style_variations,
					reviews,
					...rest
				} = t;
				return rest;
			}),
		};
	}

	function buildPatternsCachePayload() {
		const by_slug = {};
		const themeSlugs = {};
		for (let i = 0; i < themes.length; i++) {
			const t = themes[i];
			if (!t.slug) {
				continue;
			}
			themeSlugs[t.slug] = true;
			if (
				t.patterns == null ||
				t.style_variations == null ||
				t.patterns_count == null ||
				t.style_variations_count == null
			) {
				continue;
			}
			by_slug[t.slug] = {
				patterns_count: t.patterns_count,
				style_variations_count: t.style_variations_count,
				patterns: t.patterns,
				style_variations: t.style_variations,
			};
		}
		// Keep previously scraped slugs that may not be in current themes list.
		Object.keys(patternsBySlug).forEach((slug) => {
			if (
				!by_slug[slug] &&
				!themeSlugs[slug] &&
				isPatternsCacheComplete(patternsBySlug[slug])
			) {
				by_slug[slug] = patternsBySlug[slug];
			}
		});
		return {
			cached_at: new Date().toISOString(),
			by_slug: by_slug,
		};
	}

	function buildReviewsCachePayload() {
		const by_slug = {};
		const themeSlugs = {};
		for (let i = 0; i < themes.length; i++) {
			const t = themes[i];
			if (!t.slug) {
				continue;
			}
			themeSlugs[t.slug] = true;
			if (t.reviews == null) {
				continue;
			}
			by_slug[t.slug] = {
				reviews: t.reviews,
				num_ratings: Number(t.num_ratings) || 0,
			};
		}
		// Keep orphan entries for slugs not in the current themes list.
		Object.keys(reviewsBySlug).forEach((slug) => {
			if (!by_slug[slug] && !themeSlugs[slug] && reviewsBySlug[slug]) {
				by_slug[slug] = reviewsBySlug[slug];
			}
		});
		return {
			cached_at: new Date().toISOString(),
			by_slug: by_slug,
		};
	}

	async function saveCacheTyped(type, payload) {
		const response = await fetch(
			'index.php?action=save-cache&type=' + encodeURIComponent(type),
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			}
		);
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to save ' + type + ' cache');
		}
		return data.cached_at || payload.cached_at;
	}

	async function saveThemesCache() {
		const payload = buildThemesCachePayload();
		cachedAt = await saveCacheTyped('themes', payload);
		els.statCached.textContent = formatCachedAt(cachedAt);
	}

	async function savePatternsCache() {
		const payload = buildPatternsCachePayload();
		patternsBySlug = payload.by_slug;
		patternsCachedAt = await saveCacheTyped('patterns', payload);
	}

	async function saveReviewsCache() {
		const payload = buildReviewsCachePayload();
		reviewsBySlug = payload.by_slug;
		reviewsCachedAt = await saveCacheTyped('reviews', payload);
	}

	function getThemeNote(slug) {
		if (!slug || !notesBySlug[slug]) {
			return '';
		}
		return String(notesBySlug[slug]);
	}

	function syncThemeNoteButton(slug) {
		if (!slug || !els.themesTbody) {
			return;
		}
		const safe =
			typeof CSS !== 'undefined' && CSS.escape
				? CSS.escape(slug)
				: String(slug).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
		const btn = els.themesTbody.querySelector(
			'.js-theme-note[data-theme-slug="' + safe + '"]'
		);
		if (!btn) {
			return;
		}
		const hasNote = Boolean(getThemeNote(slug));
		btn.classList.toggle('has-note', hasNote);
		const label = hasNote ? 'Edit note' : 'Add note';
		btn.setAttribute('title', label);
		btn.setAttribute('aria-label', label);
	}

	function applyThemeNoteFromTextarea(textarea) {
		if (!textarea) {
			return;
		}
		const slug = textarea.getAttribute('data-theme-slug') || '';
		if (!slug) {
			return;
		}
		const next = String(textarea.value || '').trim();
		const prev = getThemeNote(slug);
		if (next === prev) {
			return;
		}
		const hadNote = Boolean(prev);
		if (next) {
			notesBySlug[slug] = next;
		} else {
			delete notesBySlug[slug];
		}
		syncThemeNoteButton(slug);
		scheduleSaveNotes();
		// Keep the table in sync when the Has note filter is active.
		if (filterHasNote && hadNote !== Boolean(next)) {
			refreshTables(
				isFetching || isScrapingPatterns || isScrapingReviews
					? els.statProgress.textContent
					: '100%'
			);
		}
	}

	function scheduleSaveNotes(immediate) {
		notesSavePending = true;
		if (notesSaveTimer) {
			window.clearTimeout(notesSaveTimer);
			notesSaveTimer = null;
		}
		if (immediate) {
			flushSaveNotes();
			return;
		}
		notesSaveTimer = window.setTimeout(() => {
			notesSaveTimer = null;
			flushSaveNotes();
		}, 400);
	}

	async function flushSaveNotes() {
		if (!notesSavePending || notesSaveInFlight) {
			return;
		}
		notesSavePending = false;
		notesSaveInFlight = true;
		const by_slug = {};
		Object.keys(notesBySlug).forEach((slug) => {
			const note = String(notesBySlug[slug] || '').trim();
			if (note) {
				by_slug[slug] = note;
			}
		});
		notesBySlug = by_slug;
		try {
			await saveCacheTyped('notes', { by_slug: by_slug });
		} catch (err) {
			console.error(err);
			setProgressUI(false, 'Failed to save notes');
		} finally {
			notesSaveInFlight = false;
			if (notesSavePending) {
				flushSaveNotes();
			}
		}
	}

	async function clearCacheOnServer(type) {
		const response = await fetch(
			'index.php?action=clear-cache&type=' + encodeURIComponent(type),
			{ method: 'POST' }
		);
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to clear ' + type + ' cache');
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
		const patterns = Array.isArray(data.patterns) ? data.patterns : [];
		const styleVariations = Array.isArray(data.style_variations)
			? data.style_variations
			: [];
		return {
			patterns_count:
				data.patterns_count == null
					? patterns.length
					: Number(data.patterns_count) || 0,
			style_variations_count:
				data.style_variations_count == null
					? styleVariations.length
					: Number(data.style_variations_count) || 0,
			patterns: patterns,
			style_variations: styleVariations,
		};
	}

	async function scrapeThemeReviews(slug) {
		const response = await fetch(
			'index.php?action=scrape-reviews&slug=' + encodeURIComponent(slug),
			{ method: 'GET' }
		);
		const data = await response.json();
		if (!response.ok || !data.success) {
			throw new Error(
				(data && data.error) || 'Reviews scrape failed for ' + slug
			);
		}
		return Array.isArray(data.reviews) ? data.reviews : [];
	}

	function themesMissingPatterns() {
		const out = [];
		for (let i = 0; i < themes.length; i++) {
			const t = themes[i];
			if (t.slug && t.patterns == null) {
				out.push(t);
			}
		}
		return out;
	}

	function themesMissingReviews() {
		const out = [];
		for (let i = 0; i < themes.length; i++) {
			const t = themes[i];
			if (t.slug && t.reviews == null) {
				out.push(t);
			}
		}
		// Highest review counts first (unlike patterns scrape order).
		out.sort(
			(a, b) =>
				(Number(b.num_ratings) || 0) - (Number(a.num_ratings) || 0)
		);
		return out;
	}

	async function scrapeReviewsQueue() {
		if (isScrapingReviews) {
			return;
		}

		let pending = themesMissingReviews();
		if (!pending.length) {
			return;
		}

		isScrapingReviews = true;
		reviewScrapeAbort = false;
		setProgressUI(true, 'Scraping reviews…');
		logProgress(
			'Scraping reviews (high→low ratings) for ' +
				pending.length +
				' themes…'
		);

		let round = 1;
		let scrapedSinceSave = 0;
		let aborted = false;

		try {
			while (pending.length && round <= REVIEW_SCRAPE_MAX_ROUNDS) {
				if (reviewScrapeAbort) {
					aborted = true;
					break;
				}

				const failed = [];
				logProgress(
					'Reviews scrape round ' +
						round +
						': ' +
						pending.length +
						' theme(s)'
				);

				for (let i = 0; i < pending.length; i++) {
					if (reviewScrapeAbort) {
						aborted = true;
						break;
					}

					const theme = pending[i];
					const expectedCount = Number(theme.num_ratings) || 0;
					try {
						let reviews;
						if (expectedCount === 0) {
							// No remote call when theme reports 0 ratings.
							reviews = [];
						} else {
							reviews = await scrapeThemeReviews(theme.slug);
						}
						theme.reviews = reviews;
						reviewsBySlug[theme.slug] = {
							reviews: reviews,
							num_ratings: expectedCount,
						};
						scrapedSinceSave += 1;

						const done =
							themes.length - themesMissingReviews().length;
						const label =
							'Reviews ' +
							done +
							' / ' +
							themes.length +
							' (' +
							theme.slug +
							', ' +
							expectedCount +
							')';
						setProgressUI(true, label);
						maybeRefreshTables(
							isFetching || isScrapingPatterns
								? els.statProgress.textContent
								: label
						);

						if (scrapedSinceSave >= 5) {
							await saveReviewsCache();
							scrapedSinceSave = 0;
						}
					} catch (error) {
						failed.push(theme);
						logProgress(
							'Reviews scrape failed for ' +
								theme.slug +
								': ' +
								error.message +
								' (retry later)'
						);
					}

					if (expectedCount > 0) {
						await delay(REVIEW_SCRAPE_DELAY_MS);
					}
				}

				pending = failed;
				if (pending.length && round < REVIEW_SCRAPE_MAX_ROUNDS) {
					logProgress(
						'Retrying ' +
							pending.length +
							' failed review scrape(s) after round ' +
							round
					);
				}
				round += 1;
			}

			if (scrapedSinceSave > 0 || !themesMissingReviews().length) {
				await saveReviewsCache();
			}

			const stillMissing = themesMissingReviews().length;
			if (aborted) {
				logProgress('Reviews scrape aborted.');
			} else if (stillMissing) {
				logProgress(
					'Reviews scrape finished with ' +
						stillMissing +
						' remaining unscraped theme(s)'
				);
				setProgressUI(
					true,
					'Reviews incomplete (' + stillMissing + ' left)'
				);
			} else {
				logProgress('Reviews scrape complete.');
				if (!isFetching && !isScrapingPatterns) {
					setProgressUI(false, 'Ready');
				}
			}
		} catch (error) {
			logProgress('Reviews scrape ERROR: ' + error.message);
			setProgressUI(true, 'Reviews scrape error');
		} finally {
			isScrapingReviews = false;
			reviewScrapeAbort = false;
		}
	}

	async function scrapePatternsQueue() {
		if (isScrapingPatterns) {
			return;
		}

		let pending = themesMissingPatterns();
		if (!pending.length) {
			await scrapeReviewsQueue();
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
		let aborted = false;

		try {
			while (pending.length && round <= PATTERN_SCRAPE_MAX_ROUNDS) {
				if (scrapeAbort) {
					aborted = true;
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
						aborted = true;
						break;
					}

					const theme = pending[i];
					try {
						const counts = await scrapeThemePatterns(theme.slug);
						theme.patterns_count = counts.patterns_count;
						theme.style_variations_count =
							counts.style_variations_count;
						theme.patterns = counts.patterns;
						theme.style_variations = counts.style_variations;
						patternsBySlug[theme.slug] = {
							patterns_count: counts.patterns_count,
							style_variations_count:
								counts.style_variations_count,
							patterns: counts.patterns,
							style_variations: counts.style_variations,
						};
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
							await savePatternsCache();
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
				await savePatternsCache();
			}

			const stillMissing = themesMissingPatterns().length;
			if (aborted) {
				logProgress('Patterns scrape aborted.');
			} else if (stillMissing) {
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
			}
		} catch (error) {
			logProgress('Patterns scrape ERROR: ' + error.message);
			setProgressUI(true, 'Patterns scrape error');
			aborted = true;
		} finally {
			isScrapingPatterns = false;
			scrapeAbort = false;
		}

		if (!aborted) {
			await scrapeReviewsQueue();
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
		reviewScrapeAbort = true;
		themes = [];
		cachedAt = null;
		els.progressLog.innerHTML = '';
		setClearButtonsDisabled(true);
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

			logProgress('Saving themes cache…');
			await saveThemesCache();
			setProgressUI(true, 'Completed: ' + themes.length + ' themes');
			refreshTables('100%');
			logProgress('Done.');
			scrapeAbort = false;
			reviewScrapeAbort = false;
			await scrapePatternsQueue();
		} catch (error) {
			logProgress('ERROR: ' + error.message);
			setProgressUI(true, 'Error: ' + error.message);
			els.statProgress.textContent = 'Error';
		} finally {
			isFetching = false;
			fetchAbort = false;
			setClearButtonsDisabled(false);
		}
	}

	function bindEvents() {
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				return;
			}
			refreshTables(
				isFetching || isScrapingPatterns || isScrapingReviews
					? els.statProgress.textContent
					: '100%'
			);
		});

		els.themesTbody.addEventListener('click', (e) => {
			const noteBtn = e.target.closest('.js-theme-note');
			if (noteBtn) {
				e.preventDefault();
				const theme = findThemeBySlug(
					noteBtn.getAttribute('data-theme-slug')
				);
				if (theme) {
					openThemeDetailsModal(theme, { focusNote: true });
				}
				return;
			}

			const reviewsBtn = e.target.closest('.js-theme-details-reviews');
			if (reviewsBtn) {
				e.preventDefault();
				const theme = findThemeBySlug(
					reviewsBtn.getAttribute('data-theme-slug')
				);
				if (theme) {
					openThemeDetailsModal(theme, { scrollToReviews: true });
				}
				return;
			}

			const patternsBtn = e.target.closest('.js-theme-details-patterns');
			if (patternsBtn) {
				e.preventDefault();
				const theme = findThemeBySlug(
					patternsBtn.getAttribute('data-theme-slug')
				);
				if (theme) {
					openThemeDetailsModal(theme, { scrollToPatterns: true });
				}
				return;
			}

			const stylesBtn = e.target.closest('.js-theme-details-styles');
			if (stylesBtn) {
				e.preventDefault();
				const theme = findThemeBySlug(
					stylesBtn.getAttribute('data-theme-slug')
				);
				if (theme) {
					openThemeDetailsModal(theme, { scrollToStyles: true });
				}
				return;
			}

			const detailsBtn = e.target.closest('.js-theme-details');
			if (detailsBtn) {
				e.preventDefault();
				const theme = findThemeBySlug(
					detailsBtn.getAttribute('data-theme-slug')
				);
				if (theme) {
					openThemeDetailsModal(theme);
				}
				return;
			}

			const btn = e.target.closest('.js-scroll-to-theme');
			if (!btn) {
				return;
			}
			e.preventDefault();
			scrollToThemeRow(btn.getAttribute('data-theme-slug'));
		});

		if (els.themeModal) {
			els.themeModal.addEventListener('click', (e) => {
				if (e.target.closest('[data-theme-modal-close]')) {
					e.preventDefault();
					closeThemeDetailsModal();
					return;
				}

				const parentBtn = e.target.closest('.js-scroll-to-theme');
				if (parentBtn) {
					e.preventDefault();
					const slug = parentBtn.getAttribute('data-theme-slug');
					closeThemeDetailsModal();
					scrollToThemeRow(slug);
				}
			});

			els.themeModal.addEventListener('input', (e) => {
				const noteField = e.target.closest('#theme-modal-note');
				if (!noteField) {
					return;
				}
				applyThemeNoteFromTextarea(noteField);
			});

			els.themeModal.addEventListener(
				'blur',
				(e) => {
					const noteField = e.target.closest
						? e.target.closest('#theme-modal-note')
						: null;
					if (!noteField) {
						return;
					}
					applyThemeNoteFromTextarea(noteField);
					scheduleSaveNotes(true);
				},
				true
			);
		}

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				closeThemeDetailsModal();
			}
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
			schedulePushFilterStateToUrl();
		});

		els.minInstallsInput.addEventListener('input', () => {
			minActiveInstalls = parseMinActiveInstalls(
				els.minInstallsInput.value
			);
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
			schedulePushFilterStateToUrl();
		});

		els.createdAfterInput.addEventListener('change', () => {
			createdAfter = parseDateFilter(els.createdAfterInput.value);
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
			pushFilterStateToUrl();
		});

		els.updatedAfterInput.addEventListener('change', () => {
			updatedAfter = parseDateFilter(els.updatedAfterInput.value);
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
			pushFilterStateToUrl();
		});

		if (els.hasNoteFilter) {
			els.hasNoteFilter.addEventListener('change', () => {
				filterHasNote = Boolean(els.hasNoteFilter.checked);
				refreshTables(
					isFetching ? els.statProgress.textContent : '100%'
				);
				pushFilterStateToUrl();
			});
		}

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

		if (els.cacheMenuToggle && els.cacheMenuPanel) {
			els.cacheMenuToggle.addEventListener('click', (e) => {
				e.stopPropagation();
				const open = els.cacheMenuPanel.hidden;
				closeDropdowns(open ? 'cache-menu-panel' : null);
				els.cacheMenuPanel.hidden = !open;
				els.cacheMenuToggle.setAttribute(
					'aria-expanded',
					open ? 'true' : 'false'
				);
			});
			els.cacheMenuPanel.addEventListener('click', (e) =>
				e.stopPropagation()
			);
		}

		els.tagsPanel.addEventListener('click', (e) => e.stopPropagation());
		els.columnsPanel.addEventListener('click', (e) => e.stopPropagation());

		document.addEventListener('click', () => closeDropdowns());

		els.tagsClear.addEventListener('click', () => {
			selectedTags.clear();
			filterHasNote = false;
			minActiveInstalls = 0;
			createdAfter = '';
			updatedAfter = '';
			if (els.hasNoteFilter) {
				els.hasNoteFilter.checked = false;
			}
			if (els.minInstallsInput) {
				els.minInstallsInput.value = '';
			}
			if (els.createdAfterInput) {
				els.createdAfterInput.value = '';
			}
			if (els.updatedAfterInput) {
				els.updatedAfterInput.value = '';
			}
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
			pushFilterStateToUrl();
		});

		els.columnsReset.addEventListener('click', () => {
			THEME_COLUMNS.forEach((col) => {
				visibleColumns[col.id] = col.defaultVisible;
			});
			saveVisibleColumns();
			renderColumnsPicker();
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
			pushFilterStateToUrl();
		});

		async function clearThemesCache() {
			if (isFetching) {
				fetchAbort = true;
			}
			scrapeAbort = true;
			reviewScrapeAbort = true;
			setClearButtonsDisabled(true);
			try {
				await waitForScrapersIdle();
				await clearCacheOnServer('themes');
				cachedAt = null;
				themes = [];
				refreshTables('0%');
				logProgress('Themes cache cleared. Re-fetching…');
				await fetchAllThemes();
			} catch (error) {
				logProgress('ERROR: ' + error.message);
				setClearButtonsDisabled(false);
			}
		}

		async function clearPatternsCache() {
			scrapeAbort = true;
			reviewScrapeAbort = true;
			setClearButtonsDisabled(true);
			try {
				await waitForScrapersIdle();
				await clearCacheOnServer('patterns');
				patternsBySlug = {};
				patternsCachedAt = null;
				for (let i = 0; i < themes.length; i++) {
					themes[i].patterns_count = null;
					themes[i].style_variations_count = null;
					themes[i].patterns = null;
					themes[i].style_variations = null;
				}
				refreshTables(
					isFetching ? els.statProgress.textContent : '100%'
				);
				logProgress('Patterns cache cleared. Re-scraping…');
				scrapeAbort = false;
				reviewScrapeAbort = false;
				await scrapePatternsQueue();
			} catch (error) {
				logProgress('ERROR: ' + error.message);
			} finally {
				setClearButtonsDisabled(false);
			}
		}

		async function clearReviewsCache() {
			reviewScrapeAbort = true;
			setClearButtonsDisabled(true);
			try {
				await waitForScrapersIdle();
				await clearCacheOnServer('reviews');
				reviewsBySlug = {};
				reviewsCachedAt = null;
				for (let i = 0; i < themes.length; i++) {
					themes[i].reviews = null;
				}
				refreshTables(
					isFetching ? els.statProgress.textContent : '100%'
				);
				logProgress('Reviews cache cleared. Re-scraping…');
				reviewScrapeAbort = false;
				await scrapeReviewsQueue();
			} catch (error) {
				logProgress('ERROR: ' + error.message);
			} finally {
				setClearButtonsDisabled(false);
			}
		}

		if (els.clearThemesCacheBtn) {
			els.clearThemesCacheBtn.addEventListener('click', clearThemesCache);
		}
		if (els.clearPatternsCacheBtn) {
			els.clearPatternsCacheBtn.addEventListener(
				'click',
				clearPatternsCache
			);
		}
		if (els.clearReviewsCacheBtn) {
			els.clearReviewsCacheBtn.addEventListener(
				'click',
				clearReviewsCache
			);
		}

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
				themeSort.dir = defaultDirForThemeSortKey(key);
			}
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
			pushFilterStateToUrl();
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
				authorSort.dir = defaultDirForAuthorSortKey(key);
			}
			refreshTables(isFetching ? els.statProgress.textContent : '100%');
			pushFilterStateToUrl();
		});

		window.addEventListener('popstate', () => {
			applyStateFromUrlAndRefresh();
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
		readFilterStateFromUrl();
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
