/**
 * Templates sidebar: purpose-nav (General stays visible while Area Hub is open).
 *
 * Restores drill-down scroll after core remounts the sidebar
 * (`key={routeKey}` on templates → template-item). Pair with
 * rememberTemplatesSidebarScroll() in navigateTemplates.
 */

import { useLayoutEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DrillDownScreen from '../drill-down-screen';
import { ROUTES } from '../constants';
import {
	buildTemplatePartItemPath,
	navigateTemplates,
	type PartAreaId,
} from './constants';
import { findCanonicalPart } from './templates-hub-parts';
import TemplatesNav from './templates-nav';
import { restoreTemplatesSidebarScroll } from './templates-sidebar-scroll';
import useTemplatesData from './use-templates-data';
import './style.scss';

export default function TemplatesDrillDown() {
	const { parts } = useTemplatesData();
	const panelRef = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		restoreTemplatesSidebarScroll(
			panelRef.current?.closest('.blockera-site-editor-drill-down')
		);
	}, []);

	const openPartsArea = (area: PartAreaId) => {
		const canonical = findCanonicalPart(area, parts);

		if (canonical?.id !== undefined) {
			navigateTemplates(buildTemplatePartItemPath(canonical.id), {
				partsArea: area,
				clearFilter: true,
				activeView: null,
				canvas: null,
			});
			return;
		}

		navigateTemplates(ROUTES.templates, {
			partsArea: area,
			clearFilter: true,
			activeView: null,
		});
	};

	return (
		<DrillDownScreen title={__('Templates', 'blockera')} flush>
			<div
				ref={panelRef}
				className="blockera-site-editor-templates-panel"
				data-test="blockera-site-editor-templates-panel"
			>
				<TemplatesNav onOpenPartsArea={openPartsArea} />
			</div>
		</DrillDownScreen>
	);
}
