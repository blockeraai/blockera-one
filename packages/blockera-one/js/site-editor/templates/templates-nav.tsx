/**
 * Purpose-based Templates sidebar navigation (parent/child sections).
 */

import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { Flex, Tooltip } from '@blockera/controls';
import { Icon } from '@blockera/icons';

/**
 * Internal dependencies
 */
import { ROUTES } from '../constants';
import {
	FILTER_IDS,
	buildTemplateItemPath,
	getCoreActiveViewForFilter,
	getTemplatesUrlState,
	isChildrenFilter,
	navigateTemplates,
	type FilterId,
	type PartAreaId,
} from './constants';
import {
	getBaseSlugForFilter,
	getChildTemplatesForFilter,
	type TemplateLike,
} from './templates-matchers';
import {
	BLOG_POSTS_FILTER,
	buildHomepageFallbackNavItems,
	isHomepageBranchFilter,
} from './templates-homepage-resolve';
import type { NavIcon, TemplatesNavItemConfig } from './templates-nav-config';
import {
	isWooCommerceNavIcon,
	renderWooCommerceNavIcon,
} from './templates-woocommerce-icons';
import useTemplatesData, { buildChildNavItems } from './use-templates-data';

const ICON_MAP: Partial<
	Record<NavIcon, { library: 'wp' | 'ui' | 'blockera'; icon: string }>
> = {
	layout: { library: 'wp', icon: 'layout' },
	home: { library: 'wp', icon: 'home' },
	'home-base': { library: 'ui', icon: 'home-base' },
	'home-blog': { library: 'ui', icon: 'home-blog' },
	page: { library: 'wp', icon: 'page' },
	post: { library: 'ui', icon: 'post' },
	'post-new': { library: 'ui', icon: 'post-new' },
	'post-base': { library: 'ui', icon: 'post-base' },
	archive: { library: 'ui', icon: 'archive' },
	'archive-new': { library: 'ui', icon: 'archive-new' },
	'archive-base': { library: 'ui', icon: 'archive-base' },
	category: { library: 'ui', icon: 'categories' },
	tag: { library: 'wp', icon: 'tag' },
	'post-categories': { library: 'wp', icon: 'post-categories' },
	author: { library: 'wp', icon: 'comment-author-avatar' },
	search: { library: 'wp', icon: 'search' },
	'not-found': { library: 'wp', icon: 'not-found' },
	'post-not-found': { library: 'ui', icon: 'post-not-found' },
	header: { library: 'wp', icon: 'header' },
	footer: { library: 'wp', icon: 'footer' },
	sidebar: { library: 'ui', icon: 'sidebar' },
	plugins: { library: 'wp', icon: 'plugins' },
	custom: { library: 'wp', icon: 'add-template' },
	active: { library: 'wp', icon: 'yes' },
	calendar: { library: 'wp', icon: 'calendar' },
	media: { library: 'ui', icon: 'attachment' },
	'media-new': { library: 'ui', icon: 'attachment-new' },
	list: { library: 'wp', icon: 'list-view' },
	verse: { library: 'wp', icon: 'verse' },
	'blockera-one': { library: 'blockera', icon: 'blockera-one' },
};

type TemplatesNavProps = {
	onOpenPartsArea: (area: PartAreaId) => void;
};

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
	const iconSize = isChild ? 18 : 20;
	const wooIcon = isWooCommerceNavIcon(item.icon)
		? renderWooCommerceNavIcon(item.icon, iconSize)
		: null;
	// Skip ICON_MAP lookup when a vendored Woo icon already resolved.
	const iconDef = wooIcon ? null : ICON_MAP[item.icon] || ICON_MAP.layout;
	const showCount = typeof count === 'number';
	const status = item.status;
	const statusLabel = item.statusLabel;
	const statusTooltip = item.statusTooltip;

	const statusBadge =
		status && statusLabel ? (
			<span
				className={[
					'blockera-site-editor-templates-nav__status',
					`is-${status}`,
				].join(' ')}
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

	// WP Button wraps children in Tooltip context; status Tooltip must be a
	// sibling (absolutely positioned) or it becomes a nested no-op.
	return (
		<div className="blockera-site-editor-templates-nav__item-shell">
			<Button
				className={[
					'blockera-site-editor-templates-nav__item',
					isActive ? 'is-active' : '',
					isChild ? 'is-child' : '',
					isGrandchild ? 'is-grandchild' : '',
				]
					.filter(Boolean)
					.join(' ')}
				onClick={onClick}
				data-test={`blockera-site-editor-templates-nav-${item.id}`}
			>
				<Flex
					alignItems="center"
					justifyContent="space-between"
					className="blockera-site-editor-templates-nav__item-inner"
				>
					<Flex
						alignItems="center"
						justifyContent="flex-start"
						gap="10px"
						className="blockera-site-editor-templates-nav__item-label"
					>
						<span className="blockera-site-editor-templates-nav__item-icon">
							{wooIcon ? (
								wooIcon
							) : (
								<Icon
									library={iconDef!.library}
									icon={iconDef!.icon}
									iconSize={iconSize}
								/>
							)}
						</span>
						<span>{item.label}</span>
					</Flex>
					<Flex
						alignItems="center"
						gap="6px"
						className="blockera-site-editor-templates-nav__item-suffix"
					>
						{showCount ? (
							<span className="blockera-site-editor-templates-nav__count">
								{count}
							</span>
						) : null}
						<Icon library="wp" icon="chevron-right" iconSize={16} />
					</Flex>
				</Flex>
			</Button>
			{statusBadge ? (
				<span className="blockera-site-editor-templates-nav__status-slot">
					{statusTooltip ? (
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
					) : (
						statusBadge
					)}
				</span>
			) : null}
		</div>
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
	});
}

export default function TemplatesNav({ onOpenPartsArea }: TemplatesNavProps) {
	const { sections, counts, templates, findBySlug, isLoading, siteReading } =
		useTemplatesData();
	const [activeFilter, setActiveFilter] = useState<FilterId>(
		() => getTemplatesUrlState().filter
	);
	const [activePartsArea, setActivePartsArea] = useState<PartAreaId | null>(
		() => getTemplatesUrlState().partsArea
	);

	useEffect(() => {
		const sync = () => {
			const state = getTemplatesUrlState();
			setActiveFilter(state.filter);
			setActivePartsArea(state.partsArea);
		};
		sync();
		window.addEventListener('popstate', sync);
		return () => window.removeEventListener('popstate', sync);
	}, []);

	return (
		<nav
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
				<div
					key={section.id}
					className="blockera-site-editor-templates-nav__section"
				>
					{section.label ? (
						<div className="blockera-site-editor-templates-nav__section-title">
							{section.label}
						</div>
					) : null}
					<div className="blockera-site-editor-templates-nav__items">
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
							const children = buildChildNavItems(
								templates,
								item
							);
							const childCount = item.showChildren
								? getChildTemplatesForFilter(
										templates,
										item.filter
									).length
								: 0;
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
										isActive={
											isPartsActive || isFilterActive
										}
										onClick={() => {
											if (item.partsArea) {
												onOpenPartsArea(item.partsArea);
												return;
											}
											if (
												item.filter === FILTER_IDS.all
											) {
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
										const fallbackChildren =
											buildChildNavItems(
												templates,
												fallback
											);
										const fallbackChildCount =
											fallback.showChildren
												? getChildTemplatesForFilter(
														templates,
														fallback.filter
													).length
												: 0;

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
												{fallbackChildren.map(
													(child) => (
														<NavRow
															key={String(
																child.id
															)}
															item={child}
															count={
																fallbackChildCount >
																0
																	? fallbackChildCount
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
													)
												)}
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
												childCount > 0
													? childCount
													: null
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
					</div>
				</div>
			))}
		</nav>
	);
}
