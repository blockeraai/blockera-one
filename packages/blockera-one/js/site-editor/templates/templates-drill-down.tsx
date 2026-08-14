/**
 * Templates sidebar: purpose-nav (General stays visible while Area Hub is open),
 * or Archive Templates Builder options panel when an archive purpose is active.
 *
 * Restores drill-down scroll after core remounts the sidebar
 * (`key={routeKey}` on templates → template-item). Pair with
 * rememberTemplatesSidebarScroll() in navigateTemplates.
 */

import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DrillDownScreen from '../components/drill-down-screen';
import { ROUTES } from '../constants';
import { resolveNestedPanel, useUrlPanelStack } from '../nested-panels';
import {
	getOptionsConfigForFilter,
	resolveOptionsPanelGroups,
	resolveTemplateIdForFilter,
	TemplateOptionsPanel,
	TemplateOptionsTitleActions,
} from '../templates-builder';
import {
	buildTemplatePartItemPath,
	navigateTemplates,
	TEMPLATES_OPTIONS_PANEL_QUERY,
	type PartAreaId,
} from './constants';
import useTemplatesUrlState from './use-templates-url-state';
import { findCanonicalPart } from './templates-hub-parts';
import { findNavItemLabel } from './templates-nav-config';
import TemplatesNav from './templates-nav';
import { restoreTemplatesSidebarScroll } from './templates-sidebar-scroll';
import useTemplatesData from './use-templates-data';
import './templates-drill-down.scss';

export default function TemplatesDrillDown() {
	// Runtime sections include dynamic CPT / WooCommerce rows, so builder
	// titles resolve correctly for those filters too.
	const { parts, findBySlug, sections } = useTemplatesData();
	const panelRef = useRef<HTMLDivElement | null>(null);
	const urlState = useTemplatesUrlState();
	const { stack, push, pop, replace } = useUrlPanelStack({
		queryKey: TEMPLATES_OPTIONS_PANEL_QUERY,
	});

	useLayoutEffect(() => {
		restoreTemplatesSidebarScroll(
			panelRef.current?.closest('.blockera-site-editor-drill-down')
		);
	}, [urlState.filter, urlState.path, stack.join('/')]);

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

	const builderConfig = getOptionsConfigForFilter(urlState.filter);
	const showBuilder = !!builderConfig;

	const resolved = useMemo(() => {
		if (!showBuilder || !urlState.filter) {
			return { id: null, slug: null, isFallback: false };
		}
		return resolveTemplateIdForFilter(urlState.filter, findBySlug);
	}, [findBySlug, showBuilder, urlState.filter]);

	const purposeLabel = showBuilder
		? findNavItemLabel(sections, urlState.filter) ||
			__('Template Options', 'blockera')
		: __('Templates', 'blockera');

	const optionsResolution = useMemo(() => {
		if (!builderConfig) {
			return null;
		}
		return resolveOptionsPanelGroups(builderConfig, stack);
	}, [builderConfig, stack]);

	useEffect(() => {
		if (optionsResolution && !optionsResolution.valid && stack.length) {
			replace([]);
		}
	}, [optionsResolution, replace, stack.length]);

	const nestedNav = useMemo(() => {
		if (!optionsResolution) {
			return null;
		}
		const activeStack = optionsResolution.valid ? stack : [];
		return resolveNestedPanel({
			rootTitle: purposeLabel,
			tree: optionsResolution.tree,
			stack: activeStack,
		});
	}, [optionsResolution, purposeLabel, stack]);

	const onBackFromBuilder = () => {
		// Dirty entity edits stay in core-data; Site Editor Save Hub persists them.
		navigateTemplates(ROUTES.templates, {
			clearFilter: true,
			partsArea: null,
			optionsPanel: null,
			activeView: null,
			canvas: null,
			direction: 'back',
		});
	};

	if (showBuilder && builderConfig && optionsResolution && nestedNav) {
		const isNested = nestedNav.stack.length > 0;
		const screenKey = nestedNav.stack.join('/') || 'root';
		const templatesLabel = __('Templates', 'blockera');
		const breadcrumb = [
			{
				label: templatesLabel,
				onClick: onBackFromBuilder,
			},
			...nestedNav.breadcrumbs.map((label, index) => ({
				label,
				onClick: () => replace(nestedNav.stack.slice(0, index)),
			})),
		];

		return (
			<DrillDownScreen
				key={screenKey}
				title={isNested ? nestedNav.title : purposeLabel}
				breadcrumb={breadcrumb}
				onBack={isNested ? pop : onBackFromBuilder}
				actions={
					<TemplateOptionsTitleActions templateId={resolved.id} />
				}
			>
				<div
					ref={panelRef}
					className="blockera-site-editor-templates-panel"
					data-test="blockera-site-editor-templates-builder-shell"
				>
					<TemplateOptionsPanel
						config={builderConfig}
						groups={optionsResolution.groups}
						filterId={String(urlState.filter)}
						templateId={resolved.id}
						onOpenNested={push}
					/>
				</div>
			</DrillDownScreen>
		);
	}

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
