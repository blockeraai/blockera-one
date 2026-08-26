/**
 * Templates browse content gate: core DataViews, filtered Blockera tables,
 * missing-base empty state, or Area Hub empty state (no canonical part yet).
 */

import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { FILTER_IDS, isChildrenFilter } from './constants';
import {
	getBaseSlugForFilter,
	isPurposeBaseFilter,
} from './templates-matchers';
import TemplatesAreaHub from './templates-area-hub';
import TemplatesFilteredBrowse from './templates-filtered-browse';
import TemplatesMissingBase from './templates-missing-base';
import useTemplatesData from './use-templates-data';
import useTemplatesUrlState from './use-templates-url-state';
import './templates-browse-content.scss';

type TemplatesBrowseContentProps = {
	/** Core PageTemplates (or mobile) area node. */
	children: ReactNode;
};

/**
 * When a purpose filter’s base template is missing, replace the DataViews table
 * with the missing-base empty state. Custom / Child templates use the shared
 * filtered browse. Hub areas without a selected part use Area Hub empty state.
 * Otherwise render core content.
 */
export default function TemplatesBrowseContent({
	children,
}: TemplatesBrowseContentProps) {
	const { filter, partsArea } = useTemplatesUrlState();
	const { findBySlug, isLoading } = useTemplatesData();

	// Hub empty state when Header/Footer/Sidebar is selected but no canonical part.
	if (partsArea) {
		return <TemplatesAreaHub />;
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
