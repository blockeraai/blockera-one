/**
 * Purpose-based Templates sidebar navigation (parent/child sections).
 */

import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { Tooltip } from '@blockera/controls';

/**
 * Internal dependencies
 */
import Nav from '../components/nav';
import NavItem from '../components/nav-item';
import NavSection from '../components/nav-section';
import { ROUTES } from '../constants';
import {
	FILTER_IDS,
	buildTemplateItemPath,
	getCoreActiveViewForFilter,
	isChildrenFilter,
	navigateTemplates,
	type PartAreaId,
} from './constants';
import useTemplatesUrlState from './use-templates-url-state';
import { getBaseSlugForFilter, type TemplateLike } from './templates-matchers';
import {
	BLOG_POSTS_FILTER,
	buildHomepageFallbackNavItems,
	isHomepageBranchFilter,
} from './templates-homepage-resolve';
import type { TemplatesNavItemConfig } from './templates-nav-config';
import useTemplatesData, { buildChildNavItems } from './use-templates-data';
import './templates-nav.scss';

type TemplatesNavProps = {
	onOpenPartsArea: (area: PartAreaId) => void;
};

/**
 * Thin adapter mapping a Templates nav item config to the shared NavItem
 * (icon object + status badge with optional tooltip).
 */
function NavRow({
	item,
	count,
	isActive,
	isChild = false,
	isGrandchild = false,
	onClick,
}: {
	item: TemplatesNavItemConfig;
	/** Shown only for browse/list destinations with at least one item. */
	count?: number | null;
	isActive: boolean;
	isChild?: boolean;
	/** Nested under an already-child row (e.g. Child templates under Front Page). */
	isGrandchild?: boolean;
	onClick: () => void;
}) {
	const status = item.status;
	const statusLabel = item.statusLabel;
	const statusTooltip = item.statusTooltip;

	const statusBadge =
		status && statusLabel ? (
			<span
				className={classNames(
					'blockera-site-editor-templates-nav__status',
					`is-${status}`
				)}
				data-test={`blockera-site-editor-templates-nav-${item.id}-status`}
				role="button"
				tabIndex={0}
				onClick={onClick}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						onClick();
					}
				}}
			>
				{statusLabel}
			</span>
		) : null;

	let badge = null;

	if (statusBadge && statusTooltip) {
		badge = (
			<Tooltip
				text={statusTooltip}
				width="200px"
				delay={200}
				hideOnClick={false}
				style={{
					'--tooltip-bg': '#2f9e5b',
				}}
			>
				{statusBadge}
			</Tooltip>
		);
	} else if (statusBadge) {
		badge = statusBadge;
	}

	let indent = 0;

	if (isGrandchild) {
		indent = 2;
	} else if (isChild) {
		indent = 1;
	}

	return (
		<NavItem
			label={item.label}
			icon={item.icon}
			isActive={isActive}
			onClick={onClick}
			count={typeof count === 'number' ? count : null}
			indent={indent}
			badge={badge}
			data-test={`blockera-site-editor-templates-nav-${item.id}`}
		/>
	);
}

/**
 * True when clicking the row navigates to a single-template live canvas preview.
 * Browse / DataViews destinations return false (those keep a count).
 */
function opensLivePreview(
	item: TemplatesNavItemConfig,
	findBySlug: (slug: string) => TemplateLike | undefined
): boolean {
	if (item.partsArea) {
		return true;
	}

	if (item.entityPath) {
		return true;
	}

	if (item.filter === FILTER_IDS.all || isChildrenFilter(item.filter)) {
		return false;
	}

	const baseSlug =
		item.baseSlug || getBaseSlugForFilter(item.filter) || undefined;

	// No base slug → Other tabs (Custom / author buckets) → DataViews.
	if (!baseSlug) {
		return false;
	}

	return !!findBySlug(baseSlug);
}

function selectFilter(
	item: TemplatesNavItemConfig,
	findBySlug: (slug: string) => TemplateLike | undefined
): void {
	const filter = item.filter;

	// Homepage / Blog·Posts → selected page entity (not home.html).
	if (item.entityPath) {
		navigateTemplates(item.entityPath, {
			filter,
			partsArea: null,
			activeView: null,
			direction: 'forward',
		});
		return;
	}

	const baseSlug = item.baseSlug || getBaseSlugForFilter(filter) || undefined;
	const base = baseSlug ? findBySlug(baseSlug) : undefined;

	if (base?.id !== undefined) {
		navigateTemplates(buildTemplateItemPath(base.id), {
			filter,
			partsArea: null,
			activeView: null,
			direction: 'forward',
		});
		return;
	}

	const mappedActiveView = getCoreActiveViewForFilter(filter);

	// Browse: core PageTemplates, or Blockera filtered DataViews (Custom / children).
	navigateTemplates(ROUTES.templates, {
		filter,
		partsArea: null,
		activeView:
			filter === FILTER_IDS.custom ||
			isChildrenFilter(filter) ||
			filter === BLOG_POSTS_FILTER
				? null
				: (mappedActiveView ?? null),
		direction: 'forward',
	});
}

export default function TemplatesNav({ onOpenPartsArea }: TemplatesNavProps) {
	const { sections, counts, templates, findBySlug, isLoading, siteReading } =
		useTemplatesData();
	const { filter: activeFilter, partsArea: activePartsArea } =
		useTemplatesUrlState();

	return (
		<Nav
			className="blockera-site-editor-templates-nav"
			aria-label={__('Templates filters', 'blockera')}
			data-test="blockera-site-editor-templates-nav"
		>
			{isLoading ? (
				<p className="blockera-site-editor-templates-nav__loading">
					{__('Loading…', 'blockera')}
				</p>
			) : null}

			{sections.map((section) => (
				<NavSection key={section.id} title={section.label}>
					{section.items.map((item) => {
						const browseCount =
							counts[String(item.id)] ??
							counts[String(item.filter)] ??
							0;

						// Advanced rows (e.g. Taxonomies): only when base or children exist.
						if (item.hideWhenEmpty && browseCount === 0) {
							return null;
						}

						const homepageFallbacks = item.showHomepageFallbacks
							? buildHomepageFallbackNavItems(
									findBySlug,
									siteReading
								)
							: [];
						const showHomepageFallbacks =
							homepageFallbacks.length > 0 &&
							!activePartsArea &&
							isHomepageBranchFilter(
								activeFilter,
								item,
								homepageFallbacks
							);
						const children = buildChildNavItems(templates, item);
						const navChildren = item.navChildren || [];
						const isPartsActive =
							!!item.partsArea &&
							activePartsArea === item.partsArea;
						const isFilterActive =
							!item.partsArea &&
							!activePartsArea &&
							(activeFilter === item.filter ||
								(item.showHomepageFallbacks &&
									isHomepageBranchFilter(
										activeFilter,
										item,
										homepageFallbacks
									)));
						const showCount =
							!opensLivePreview(item, findBySlug) &&
							browseCount > 0;

						return (
							<div key={String(item.id)}>
								<NavRow
									item={item}
									count={showCount ? browseCount : null}
									isActive={isPartsActive || isFilterActive}
									onClick={() => {
										if (item.partsArea) {
											onOpenPartsArea(item.partsArea);
											return;
										}
										if (item.filter === FILTER_IDS.all) {
											navigateTemplates(
												ROUTES.templates,
												{
													clearFilter: true,
													partsArea: null,
													activeView: 'active',
												}
											);
											return;
										}
										selectFilter(item, findBySlug);
									}}
								/>
								{(showHomepageFallbacks
									? homepageFallbacks
									: []
								).map((fallback) => {
									const fallbackChildren = buildChildNavItems(
										templates,
										fallback
									);

									return (
										<div key={String(fallback.id)}>
											<NavRow
												item={fallback}
												isChild
												isActive={
													!activePartsArea &&
													activeFilter ===
														fallback.filter
												}
												onClick={() =>
													selectFilter(
														fallback,
														findBySlug
													)
												}
											/>
											{fallbackChildren.map((child) => (
												<NavRow
													key={String(child.id)}
													item={child}
													count={
														child.count > 0
															? child.count
															: null
													}
													isChild
													isGrandchild
													isActive={
														!activePartsArea &&
														activeFilter ===
															child.filter
													}
													onClick={() =>
														selectFilter(
															child,
															findBySlug
														)
													}
												/>
											))}
										</div>
									);
								})}
								{navChildren.map((child) => (
									<NavRow
										key={String(child.id)}
										item={child}
										isChild
										isActive={
											!activePartsArea &&
											activeFilter === child.filter
										}
										onClick={() =>
											selectFilter(child, findBySlug)
										}
									/>
								))}
								{children.map((child) => (
									<NavRow
										key={String(child.id)}
										item={child}
										count={
											child.count > 0 ? child.count : null
										}
										isChild
										isActive={
											!activePartsArea &&
											activeFilter === child.filter
										}
										onClick={() =>
											selectFilter(child, findBySlug)
										}
									/>
								))}
							</div>
						);
					})}
				</NavSection>
			))}
		</Nav>
	);
}
