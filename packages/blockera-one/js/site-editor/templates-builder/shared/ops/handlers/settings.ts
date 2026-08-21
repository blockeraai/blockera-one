/**
 * setTemplateSetting — site-entity edits (posts_per_page bucket + mirror).
 */

import { TEMPLATE_SETTINGS_KEY } from '../../constants';
import { getPostsPerPageMap } from '../../resolve/resolve-control-values';
import type { OperationHandler } from '../types';

export const handleSetTemplateSetting: OperationHandler = ({
	nextValue,
	settings,
	settingBucket,
}) => {
	const prev = getPostsPerPageMap(settings);
	const numeric = Number(nextValue) || 10;
	const nextSettings = {
		...(settings as object),
		posts_per_page: {
			...prev,
			[settingBucket]: numeric,
		},
	};
	// Frontend: blockera_one_template_settings + pre_get_posts.
	// Editor canvas: inherited Query loops read site.posts_per_page
	// (see Gutenberg QueryContent). Mirror WP core PostsPerPage.
	return {
		kind: 'site-edits',
		edits: {
			[TEMPLATE_SETTINGS_KEY]: nextSettings,
			posts_per_page: numeric,
		},
	};
};
