/**
 * Templates browse content gate: core DataViews, filtered Blockera tables,
 * or missing-base empty state.
 */

import type { ReactNode } from 'react';

import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	FILTER_IDS,
	getTemplatesUrlState,
	isChildrenFilter,
	type FilterId,
} from './constants';
import {
	getBaseSlugForFilter,
	isPurposeBaseFilter,
} from './templates-matchers';
import TemplatesFilteredBrowse from './templates-filtered-browse';
import TemplatesMissingBase from './templates-missing-base';
import useTemplatesData from './use-templates-data';
import './style.scss';

type TemplatesBrowseContentProps = {
	/** Core PageTemplates (or mobile) area node. */
	children: ReactNode;
};

function useBrowseFilter(): FilterId {
	const [filter, setFilter] = useState<FilterId>(
		() => getTemplatesUrlState().filter
	);

	useEffect(() => {
		const sync = () => setFilter(getTemplatesUrlState().filter);
		sync();
		window.addEventListener('popstate', sync);
		return () => window.removeEventListener('popstate', sync);
	}, []);

	return filter;
}

/**
 * When a purpose filter’s base template is missing, replace the DataViews table
 * with the missing-base empty state. Custom / Child templates use the shared
 * filtered browse. Otherwise render core content.
 */
export default function TemplatesBrowseContent({
	children,
}: TemplatesBrowseContentProps) {
	const filter = useBrowseFilter();
	const { findBySlug, isLoading } = useTemplatesData();
	const partsArea = getTemplatesUrlState().partsArea;

	// Parts sub-screen owns the sidebar; keep core list until a part is selected.
	if (partsArea) {
		return <>{children}</>;
	}

	// Custom + Child templates: shared filtered DataViews (core has no such tabs).
	if (filter === FILTER_IDS.custom || isChildrenFilter(filter)) {
		return (
			<TemplatesFilteredBrowse
				filter={filter}
				dataTest={
					filter === FILTER_IDS.custom
						? 'blockera-site-editor-templates-custom'
						: 'blockera-site-editor-templates-children'
				}
			/>
		);
	}

	if (
		!isLoading &&
		filter !== FILTER_IDS.all &&
		isPurposeBaseFilter(filter)
	) {
		const baseSlug = getBaseSlugForFilter(filter);
		if (baseSlug && !findBySlug(baseSlug)) {
			return <TemplatesMissingBase filter={filter} />;
		}
	}

	return <>{children}</>;
}
