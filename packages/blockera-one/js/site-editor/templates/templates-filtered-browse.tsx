/**
 * Shared Templates DataViews browse (Custom, Child templates, …).
 *
 * Shares core’s persisted view via public preferences
 * (`core/views` → `dataviews-postType-wp_template-default`) — no private APIs.
 */

import { Page } from '@wordpress/admin-ui';
import { parse } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews/wp';
import type { View } from '@wordpress/dataviews';
import { useCallback, useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import {
	FILTER_IDS,
	buildTemplateItemPath,
	getParentFilterFromChildrenFilter,
	isChildrenFilter,
	navigateTemplates,
	type FilterId,
} from './constants';
import {
	getTemplateDescription,
	getTemplateTitle,
	type TemplateLike,
} from './templates-matchers';
import {
	findNavItemLabel,
	type TemplatesNavSectionConfig,
} from './templates-nav-config';
import TemplatesAddNewButton from './templates-add-new-button';
import useTemplatesData from './use-templates-data';
import './templates-filtered-browse.scss';

export type TemplateRecord = TemplateLike & {
	type?: string;
	content?: { raw?: string };
};

type TemplatesFilteredBrowseProps = {
	/** Purpose / source filter applied to the list. */
	filter: FilterId;
	/** Optional override for the Page heading. */
	title?: string;
	/** Optional data-test on the DataViews wrapper. */
	dataTest?: string;
};

/**
 * Page heading that describes the filtered list the user is browsing.
 */
export function getFilteredBrowseTitle(
	filter: FilterId,
	sections: TemplatesNavSectionConfig[]
): string {
	if (filter === FILTER_IDS.custom) {
		return __('Custom templates', 'blockera');
	}

	if (isChildrenFilter(filter)) {
		const parentFilter = getParentFilterFromChildrenFilter(filter);
		const parentLabel =
			(parentFilter && findNavItemLabel(sections, parentFilter)) ||
			parentFilter ||
			__('Templates', 'blockera');
		return sprintf(
			/* translators: %s: parent purpose label, e.g. Categories */
			__('%s child templates', 'blockera'),
			parentLabel
		);
	}

	return findNavItemLabel(sections, filter) || __('Templates', 'blockera');
}

/** Same preference key as `@wordpress/views` for templates browse. */
const TEMPLATES_VIEW_PREFERENCE_KEY = 'dataviews-postType-wp_template-default';

const defaultLayouts = {
	table: { showMedia: false },
	grid: { showMedia: true },
	list: { showMedia: false },
};

/** Same defaults as core `page-templates/view-utils` DEFAULT_VIEW. */
const DEFAULT_VIEW: View = {
	type: 'grid',
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc',
	},
	titleField: 'title',
	descriptionField: 'description',
	mediaField: 'preview',
	fields: ['author', 'slug'],
	filters: [],
	...defaultLayouts.grid,
};

function PreviewField({ item }: { item: TemplateRecord }) {
	const raw = item.content?.raw;
	const blocks = useMemo(() => (raw ? parse(raw) : []), [raw]);
	const isEmpty = !blocks.length;

	return (
		<div className="page-templates-preview-field">
			{isEmpty ? __('Empty template', 'blockera') : null}
			{!isEmpty ? (
				<BlockPreview.Async>
					<BlockPreview blocks={blocks} />
				</BlockPreview.Async>
			) : null}
		</div>
	);
}

/**
 * Read/write the same preferences scope/key core PageTemplates uses.
 */
function useSyncedTemplatesView() {
	const persistedView = useSelect((select) => {
		return (
			select(preferencesStore) as unknown as {
				get: (scope: string, name: string) => View | undefined;
			}
		).get('core/views', TEMPLATES_VIEW_PREFERENCE_KEY);
	}, []);

	const { set } = useDispatch(preferencesStore) as unknown as {
		set: (scope: string, name: string, value: View | undefined) => void;
	};

	const baseView = persistedView ?? DEFAULT_VIEW;
	const layoutTypeDefaults =
		baseView.type in defaultLayouts
			? defaultLayouts[baseView.type as keyof typeof defaultLayouts]
			: {};

	const view = useMemo(
		() =>
			({
				...baseView,
				...layoutTypeDefaults,
			}) as View,
		[baseView, layoutTypeDefaults]
	);

	const isModified = !!persistedView;

	const updateView = useCallback(
		(newView: View) => {
			const { page: _page, search: _search, ...preferenceView } = newView;
			const serialized = JSON.stringify(preferenceView);
			const serializedDefault = JSON.stringify(
				(() => {
					const {
						page: _p,
						search: _s,
						...rest
					} = DEFAULT_VIEW as View & {
						page?: number;
						search?: string;
					};
					return rest;
				})()
			);

			if (serialized === serializedDefault) {
				set('core/views', TEMPLATES_VIEW_PREFERENCE_KEY, undefined);
				return;
			}

			set(
				'core/views',
				TEMPLATES_VIEW_PREFERENCE_KEY,
				preferenceView as View
			);
		},
		[set]
	);

	const resetToDefault = useCallback(() => {
		set('core/views', TEMPLATES_VIEW_PREFERENCE_KEY, undefined);
	}, [set]);

	return { view, isModified, updateView, resetToDefault };
}

/**
 * Filtered templates DataViews with core Page chrome + synced layout prefs.
 */
export default function TemplatesFilteredBrowse({
	filter,
	title: titleProp,
	dataTest = 'blockera-site-editor-templates-filtered',
}: TemplatesFilteredBrowseProps) {
	const { filterTemplates, isLoading, sections } = useTemplatesData();
	const records = filterTemplates(filter) as TemplateRecord[];
	const { view, updateView, isModified, resetToDefault } =
		useSyncedTemplatesView();
	const title = titleProp || getFilteredBrowseTitle(filter, sections);

	const fields = useMemo(
		() => [
			{
				id: 'preview',
				label: __('Preview', 'blockera'),
				enableSorting: false,
				render: ({ item }: { item: TemplateRecord }) => (
					<PreviewField item={item} />
				),
			},
			{
				id: 'title',
				label: __('Title', 'blockera'),
				enableHiding: false,
				enableGlobalSearch: true,
				getValue: ({ item }: { item: TemplateRecord }) =>
					getTemplateTitle(item),
			},
			{
				id: 'description',
				label: __('Description', 'blockera'),
				enableSorting: false,
				enableGlobalSearch: true,
				getValue: ({ item }: { item: TemplateRecord }) =>
					getTemplateDescription(item),
				render: ({ item }: { item: TemplateRecord }) => {
					const description = getTemplateDescription(item);
					return description ? decodeEntities(description) : null;
				},
			},
			{
				id: 'slug',
				label: __('Slug', 'blockera'),
				getValue: ({ item }: { item: TemplateRecord }) =>
					item.slug || '',
			},
			{
				id: 'author',
				label: __('Author', 'blockera'),
				getValue: ({ item }: { item: TemplateRecord }) =>
					item.author_text || '',
			},
		],
		[]
	);

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate(records, view, fields),
		[records, view, fields]
	);

	return (
		<Page
			className="edit-site-page-templates blockera-site-editor-templates-filtered"
			title={title}
			headingLevel={2}
			actions={<TemplatesAddNewButton browseFilter={filter} />}
		>
			<div data-test={dataTest}>
				<DataViews
					data={data}
					fields={fields}
					view={view}
					onChangeView={updateView}
					paginationInfo={paginationInfo}
					isLoading={isLoading}
					defaultLayouts={defaultLayouts}
					getItemId={(item: TemplateRecord) =>
						item.id !== undefined
							? String(item.id)
							: item.slug || ''
					}
					isItemClickable={() => true}
					onClickItem={(item: TemplateRecord) => {
						if (item.id === undefined) {
							return;
						}
						navigateTemplates(buildTemplateItemPath(item.id), {
							filter,
							partsArea: null,
							activeView: null,
						});
					}}
					onReset={
						isModified
							? () => {
									resetToDefault();
								}
							: false
					}
				/>
			</div>
		</Page>
	);
}
