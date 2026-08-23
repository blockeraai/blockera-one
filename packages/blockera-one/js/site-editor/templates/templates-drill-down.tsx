/**
 * Templates sidebar: purpose-nav, or Templates Builder when an archive
 * purpose or a Header / Footer / Sidebar part area is active.
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
import { resolveNestedPanel } from '../nested-panels';
import {
	getOptionsConfigForFilter,
	getOptionsConfigForPartsArea,
	resolveNestedPanelScrollTarget,
	resolveOptionsPanelGroups,
	resolveTemplateIdForFilter,
	scrollStampIntoCanvas,
	TemplateOptionsPanel,
	TemplateOptionsTitleActions,
} from '../templates-builder';
import {
	buildTemplatePartItemPath,
	navigateTemplates,
	type PartAreaId,
} from './constants';
import useTemplatesBuilderStack from './use-templates-builder-stack';
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
	const { stack, push, pop, replace } = useTemplatesBuilderStack();

	const stackKey = stack.join('/');

	useLayoutEffect(() => {
		restoreTemplatesSidebarScroll(
			panelRef.current?.closest('.blockera-site-editor-drill-down')
		);
	}, [urlState.filter, urlState.path, stackKey]);

	const openPartsArea = (area: PartAreaId) => {
		const canonical = findCanonicalPart(area, parts);
		const direction = getOptionsConfigForPartsArea(area)
			? 'forward'
			: undefined;

		if (canonical?.id !== undefined) {
			navigateTemplates(buildTemplatePartItemPath(canonical.id), {
				partsArea: area,
				clearFilter: true,
				activeView: null,
				canvas: null,
				direction,
			});
			return;
		}

		navigateTemplates(ROUTES.templates, {
			partsArea: area,
			clearFilter: true,
			activeView: null,
			direction,
		});
	};

	const partsBuilderConfig = getOptionsConfigForPartsArea(urlState.partsArea);
	const builderConfig =
		partsBuilderConfig || getOptionsConfigForFilter(urlState.filter);
	const showBuilder = !!builderConfig;

	const resolved = useMemo(() => {
		if (!showBuilder) {
			return { id: null, slug: null, isFallback: false };
		}
		if (partsBuilderConfig && urlState.partsArea) {
			const canonical = findCanonicalPart(urlState.partsArea, parts);
			return {
				id: canonical?.id ?? null,
				slug: canonical?.slug || null,
				isFallback: false,
			};
		}
		if (!urlState.filter) {
			return { id: null, slug: null, isFallback: false };
		}
		return resolveTemplateIdForFilter(urlState.filter, findBySlug);
	}, [
		findBySlug,
		parts,
		partsBuilderConfig,
		showBuilder,
		urlState.filter,
		urlState.partsArea,
	]);

	const purposeLabel = showBuilder
		? builderConfig?.title ||
			findNavItemLabel(sections, urlState.filter) ||
			__('Template Options', 'blockera')
		: __('Template Builder', 'blockera');

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

	// Single reveal path for gateway open (via push → stack), Back,
	// breadcrumb, and URL restore. Do not also scroll from onOpenNested.
	useEffect(() => {
		if (!builderConfig || !stack.length) {
			return;
		}
		const stampId = resolveNestedPanelScrollTarget(builderConfig, stack);
		if (!stampId) {
			return;
		}
		return scrollStampIntoCanvas(stampId);
	}, [builderConfig, stack]);

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

	const onBackToTemplatesNav = () => {
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
		const templatesLabel = __('Template Builder', 'blockera');
		const breadcrumb = [
			{
				label: templatesLabel,
				onClick: onBackToTemplatesNav,
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
				onBack={isNested ? pop : onBackToTemplatesNav}
				actions={
					<TemplateOptionsTitleActions
						templateId={resolved.id}
						postType={builderConfig.entityPostType}
					/>
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
						filterId={
							partsBuilderConfig
								? builderConfig.type
								: String(urlState.filter)
						}
						templateId={resolved.id}
						onOpenNested={push}
					/>
				</div>
			</DrillDownScreen>
		);
	}

	return (
		<DrillDownScreen title={__('Template Builder', 'blockera')} flush>
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
