/**
 * Post Meta item ids, separator glyphs, and Items Design defaults.
 */

export const META_ITEM_PART_IDS = {
	icon: 'meta-item-icon',
	prefix: 'meta-item-prefix',
	block: 'meta-item-block',
	suffix: 'meta-item-suffix',
} as const;

export type MetaItemPart = 'icon' | 'prefix' | 'suffix';

export const META_SEPARATOR_ID = 'meta-separator';

export const META_SEPARATOR_OPTIONS = {
	none: '',
	slash: '/',
	dash: '\u2014',
	bullet: '\u2022',
} as const;

export type MetaSeparatorOption = keyof typeof META_SEPARATOR_OPTIONS;

export const META_ITEMS_PRESETS = ['simple', 'labels', 'icons'] as const;
export type MetaItemsPreset = (typeof META_ITEMS_PRESETS)[number];

export const EMPTY_ICON_VALUE = {
	icon: '',
	library: '',
	uploadSVG: '',
	svgString: '',
	renderedIcon: '',
};

export type MetaItemPartConfig = {
	icon: '' | Record<string, unknown>;
	prefix: string;
	suffix: string;
};

export type MetaItemDesignConfig = Record<MetaItemsPreset, MetaItemPartConfig>;

export const EMPTY_PARTS: MetaItemPartConfig = {
	icon: '',
	prefix: '',
	suffix: '',
};

function itemDefaults(
	prefix: string,
	icon: Record<string, unknown> | '',
	suffix = ''
): MetaItemDesignConfig {
	return {
		simple: { ...EMPTY_PARTS },
		labels: { icon: '', prefix, suffix },
		icons: { icon: icon || '', prefix: '', suffix: '' },
	};
}

function wpIcon(icon: string): Record<string, unknown> {
	return { library: 'wp', icon };
}

/** JS fallback when PHP has not printed `window.blockeraOneTemplateBuilder`. */
export const META_ITEM_DEFAULTS: Record<string, MetaItemDesignConfig> = {
	'author-name': itemDefaults('By', wpIcon('comment-author-avatar')),
	date: itemDefaults('On', wpIcon('calendar')),
	'post-date': itemDefaults('Published:', wpIcon('calendar')),
	'modified-date': itemDefaults('Updated on', wpIcon('update')),
	categories: itemDefaults('In', wpIcon('category')),
	tags: itemDefaults('Tagged', wpIcon('tag')),
	'comments-count': itemDefaults('Comments', wpIcon('admin-comments')),
	'comments-link': itemDefaults('Comments', wpIcon('admin-comments')),
	'time-to-read': itemDefaults('Read in', wpIcon('clock')),
	'word-count': itemDefaults('Words', wpIcon('media-text')),
};

export type ListingMetaItemsDesign = {
	preset?: MetaItemsPreset;
	items?: Record<string, MetaItemDesignConfig>;
};

export type MetaItemsDesignPayload = {
	default?: { items?: Record<string, MetaItemDesignConfig> };
	listings?: Record<string, ListingMetaItemsDesign>;
};

export const PART_ORDER: Array<'icon' | 'prefix' | 'block' | 'suffix'> = [
	'icon',
	'prefix',
	'block',
	'suffix',
];

export const PARKED_META_KEY = 'blockeraOneMetaParts';
export const SEPARATOR_META_KEY = 'blockeraOneMetaSeparator';

export type ParkedParts = {
	icon?: Record<string, unknown>;
	prefix?: string;
	suffix?: string;
};

/**
 * Gutenberg serialize/parse drops ASCII-whitespace-only paragraph content
 * (`content: ""` in the editor). NBSP is one visible space that survives.
 */
export const SPACE_FILLER_TEXT = '\u00a0';
export const SPACE_FILLER_HTML = '<p>&nbsp;</p>';
