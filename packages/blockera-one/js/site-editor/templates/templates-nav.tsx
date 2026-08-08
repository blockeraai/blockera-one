/**
 * Purpose-based Templates sidebar navigation (parent/child sections).
 */

import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { Flex } from '@blockera/controls';
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
import type { NavIcon, TemplatesNavItemConfig } from './templates-nav-config';
import useTemplatesData, { buildChildNavItems } from './use-templates-data';

const ICON_MAP: Record<
	NavIcon,
	{ library: 'wp' | 'ui' | 'tabler' | 'blockera'; icon: string }
> = {
	layout: { library: 'wp', icon: 'layout' },
	home: { library: 'wp', icon: 'home' },
	page: { library: 'wp', icon: 'page' },
	post: { library: 'wp', icon: 'post' },
	archive: { library: 'wp', icon: 'archive' },
	category: { library: 'ui', icon: 'categories' },
	tag: { library: 'wp', icon: 'tag' },
	author: { library: 'wp', icon: 'comment-author-avatar' },
	search: { library: 'wp', icon: 'search' },
	'not-found': { library: 'wp', icon: 'not-found' },
	header: { library: 'wp', icon: 'header' },
	footer: { library: 'wp', icon: 'footer' },
	sidebar: { library: 'wp', icon: 'columns' },
	plugins: { library: 'wp', icon: 'plugins' },
	custom: { library: 'wp', icon: 'add-template' },
	active: { library: 'wp', icon: 'yes' },
	calendar: { library: 'wp', icon: 'calendar' },
	media: { library: 'wp', icon: 'media' },
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
	onClick,
}: {
	item: TemplatesNavItemConfig;
	/** Shown only for browse/list destinations with at least one item. */
	count?: number | null;
	isActive: boolean;
	isChild?: boolean;
	onClick: () => void;
}) {
	const iconDef = ICON_MAP[item.icon] || ICON_MAP.layout;
	const showCount = typeof count === 'number';

	return (
		<Button
			className={[
				'blockera-site-editor-templates-nav__item',
				isActive ? 'is-active' : '',
				isChild ? 'is-child' : '',
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
						<Icon
							library={iconDef.library}
							icon={iconDef.icon}
							iconSize={isChild ? 18 : 20}
						/>
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
	);
}

/**
 * True when clicking the row navigates to a single-template live canvas preview.
 * Browse / DataViews / parts-list destinations return false (those keep a count).
 */
function opensLivePreview(
	item: TemplatesNavItemConfig,
	findBySlug: (slug: string) => TemplateLike | undefined
): boolean {
	if (item.partsArea) {
		return false;
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
			filter === FILTER_IDS.custom || isChildrenFilter(filter)
				? null
				: (mappedActiveView ?? null),
	});
}

export default function TemplatesNav({ onOpenPartsArea }: TemplatesNavProps) {
	const { sections, counts, templates, findBySlug, isLoading } =
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
							const isPartsActive =
								!!item.partsArea &&
								activePartsArea === item.partsArea;
							const isFilterActive =
								!item.partsArea &&
								!activePartsArea &&
								activeFilter === item.filter;
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
