/**
 * Archive Templates options panel — Blocksy-style controls that live-edit
 * the template block tree. Persistence uses the Site Editor native Save.
 */

import { Button, FormToggle, Modal } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { Flex } from '@blockera/controls';

/**
 * Internal dependencies
 */
import { GatewayCard, GatewayRow } from '../../../nested-panels';
import GroupCard from '../../../components/group-card';
import { hasUnresolvedVariants } from '../resolve/resolve-variant-html';
import GroupHeaderEdit from '../group-header-edit';
import {
	getGroupInnerOrder,
	isSortableElementControl,
	resolveElementOrder,
} from '../element-order';
import type { ControlViewState } from '../resolve/resolve-control-values';
import type {
	BlockNode,
	ControlDef,
	ControlValue,
	InnerOrderRule,
	PanelGroupDef,
	ReorderElementsPayload,
	TemplateOptionsConfig,
} from '../types';
import useTemplateOptions from '../use-template-options';
import { buildGatewayRowProps } from './gateway-row-props';
import { renderControl } from './render-control';
import { SortableElementGroup } from './sortable-element-group';
import '../controls/shared/_controls.scss';
import './template-options-panel.scss';

export { asControlListItem } from './as-control-list-item';
export { TemplateOptionsTitleActions } from './template-options-title-actions';

type TemplateOptionsPanelProps = {
	config: TemplateOptionsConfig;
	filterId: string;
	templateId: string | number | null;
	/** Groups for the current nested screen (defaults to config root). */
	groups?: PanelGroupDef[];
	/** Open a nested panel by its nestedPanel.id (gateway rows). */
	onOpenNested?: (panelId: string) => void;
};

type PanelGroupShellProps = {
	group: PanelGroupDef;
	controlStates: ControlViewState[];
	blocks: BlockNode[];
	templateId: string | number | null;
	onChangeControl: (control: ControlDef, next: ControlValue) => void;
	onReorderElements: (
		rule: InnerOrderRule,
		payload: ReorderElementsPayload
	) => void;
	onOpenNested?: (panelId: string) => void;
};

function PanelGroupShell({
	group,
	controlStates,
	blocks,
	templateId,
	onChangeControl,
	onReorderElements,
	onOpenNested,
}: PanelGroupShellProps) {
	const headerToggleDef = group.headerToggle;
	const commonDisabled = !templateId;

	const { headerToggleView, headerEnabled, customizeView, controls } =
		useMemo(() => {
			const headerView = headerToggleDef
				? controlStates.find((c) => c.control.id === headerToggleDef.id)
				: null;
			const enabled = headerToggleDef ? !!headerView?.value : true;
			const visibleControls = controlStates.filter(
				(c) =>
					c.visible &&
					group.controls.some((gc) => gc.id === c.control.id) &&
					c.control.id !== headerToggleDef?.id
			);
			// Canvas-jump actions live on the heading Edit button.
			const customize =
				visibleControls.find(
					(c) =>
						c.control.operation === 'selectInCanvas' &&
						c.control.type !== 'gateway'
				) || null;
			const bodyControls = visibleControls.filter(
				(c) =>
					c.control.operation !== 'selectInCanvas' ||
					c.control.type === 'gateway'
			);
			return {
				headerToggleView: headerView,
				headerEnabled: enabled,
				customizeView: customize,
				controls: bodyControls,
			};
		}, [controlStates, group.controls, headerToggleDef]);

	const { orderRule, sortableViews, staticControls } = useMemo(() => {
		const rule =
			group.sortable &&
			controls.some((c) => isSortableElementControl(c.control))
				? getGroupInnerOrder(group)
				: null;
		if (!rule) {
			return {
				orderRule: null,
				sortableViews: [] as ControlViewState[],
				staticControls: controls,
			};
		}
		const order = resolveElementOrder(blocks, rule);
		const orderRank: Record<string, number> = {};
		for (let i = 0; i < order.length; i++) {
			orderRank[order[i]] = i;
		}
		const sortable = controls
			.filter((c) => isSortableElementControl(c.control))
			.sort((a, b) => {
				const ai = orderRank[a.control.target.id] ?? 999;
				const bi = orderRank[b.control.target.id] ?? 999;
				return ai - bi;
			});
		const sortableControlIds = new Set(sortable.map((c) => c.control.id));
		return {
			orderRule: rule,
			sortableViews: sortable,
			staticControls: controls.filter(
				(c) => !sortableControlIds.has(c.control.id)
			),
		};
	}, [blocks, controls, group]);

	const handleOpenNested = useCallback(() => {
		if (group.nestedPanel && onOpenNested) {
			onOpenNested(group.nestedPanel.id);
		}
	}, [group.nestedPanel, onOpenNested]);

	const handleHeaderToggle = useCallback(
		(next: boolean) => {
			if (headerToggleDef) {
				onChangeControl(headerToggleDef, next);
			}
		},
		[headerToggleDef, onChangeControl]
	);

	const handleHeaderFormToggle = useCallback(() => {
		if (headerToggleDef && headerToggleView) {
			onChangeControl(headerToggleDef, !headerToggleView.value);
		}
	}, [headerToggleDef, headerToggleView, onChangeControl]);

	const headerToggleDisabled =
		commonDisabled ||
		(headerToggleView
			? hasUnresolvedVariants(headerToggleView.control)
			: false);

	const gatewayRow =
		group.nestedPanel && headerEnabled && group.controls.length > 0 ? (
			<GatewayRow
				{...buildGatewayRowProps({
					title:
						group.nestedPanel.gatewayLabel ||
						group.nestedPanel.title,
					nestedPanelId: group.nestedPanel.id,
					enabled: headerEnabled,
					onOpenNested,
				})}
			/>
		) : null;

	// Groups without a header toggle hide when empty; toggle groups always show.
	if (
		!headerToggleDef &&
		controls.length === 0 &&
		!customizeView &&
		!gatewayRow &&
		!group.keepVisible
	) {
		return null;
	}

	const customizeDisabled =
		commonDisabled ||
		(customizeView
			? hasUnresolvedVariants(customizeView.control) ||
				customizeView.state.kind === 'missing'
			: true);
	const headerEdit = customizeView ? (
		<GroupHeaderEdit
			controlId={customizeView.control.id}
			sectionId={customizeView.control.target.id}
			disabled={customizeDisabled}
		/>
	) : null;

	const showBody =
		headerEnabled &&
		(controls.length > 0 || !!gatewayRow || !!group.keepVisible);

	const body = showBody ? (
		<>
			{orderRule && sortableViews.length > 0 && (
				<SortableElementGroup
					items={sortableViews}
					groupId={group.id}
					orderRule={orderRule}
					blocks={blocks}
					disabled={commonDisabled}
					onReorderElements={onReorderElements}
					onChangeControl={onChangeControl}
					onOpenNested={onOpenNested}
				/>
			)}
			{staticControls.map(
				({
					control,
					state,
					value,
					blockName,
					disabled: viewDisabled,
				}) =>
					renderControl({
						control,
						state,
						value,
						blockName,
						disabled: viewDisabled,
						commonDisabled,
						onChangeControl,
						onOpenNested,
					})
			)}
			{gatewayRow}
		</>
	) : null;

	if (group.nestedPanel) {
		return (
			<GatewayCard
				key={group.id}
				className="blockera-templates-builder-group"
				title={group.title}
				enabled={headerEnabled}
				data-test={`blockera-templates-builder-group-${group.id}`}
				toggle={
					headerToggleDef && headerToggleView
						? {
								checked: !!headerToggleView.value,
								disabled: headerToggleDisabled,
								'aria-label':
									headerToggleDef.label || headerToggleDef.id,
								onChange: handleHeaderToggle,
							}
						: undefined
				}
				onOpen={onOpenNested ? handleOpenNested : undefined}
			>
				{body}
			</GatewayCard>
		);
	}

	return (
		<GroupCard
			key={group.id}
			title={group.title}
			className={classNames(
				'blockera-templates-builder-group',
				'is-stacked'
			)}
			data-test={`blockera-templates-builder-group-${group.id}`}
			isHeaderCollapsed={!showBody}
			headerActions={
				headerEdit || (headerToggleDef && headerToggleView) ? (
					<Flex
						gap="8px"
						alignItems="center"
						className="blockera-templates-builder-group__header-actions"
					>
						{headerEdit}
						{headerToggleDef && headerToggleView && (
							<span
								className="blockera-templates-builder-group__header-toggle"
								data-test={`blockera-templates-builder-header-toggle-${group.id}`}
							>
								<FormToggle
									checked={!!headerToggleView.value}
									disabled={headerToggleDisabled}
									onChange={handleHeaderFormToggle}
									aria-label={
										headerToggleDef.label ||
										headerToggleDef.id
									}
								/>
							</span>
						)}
					</Flex>
				) : undefined
			}
		>
			{body}
		</GroupCard>
	);
}

export default function TemplateOptionsPanel({
	config,
	filterId,
	templateId,
	groups: groupsProp,
	onOpenNested,
}: TemplateOptionsPanelProps) {
	const {
		blocks,
		controlStates,
		isDirty,
		onChangeControl,
		onReorderElements,
		confirmMessage,
		confirmPending,
		cancelPending,
	} = useTemplateOptions(templateId, config, filterId);

	const screenGroups = groupsProp || config.groups;

	const handleOpenNested = useCallback(
		(panelId: string) => {
			onOpenNested?.(panelId);
		},
		[onOpenNested]
	);
	const nestedOpen = onOpenNested ? handleOpenNested : undefined;

	const groups = screenGroups.map((group) => (
		<PanelGroupShell
			key={group.id}
			group={group}
			controlStates={controlStates}
			blocks={blocks}
			templateId={templateId}
			onChangeControl={onChangeControl}
			onReorderElements={onReorderElements}
			onOpenNested={nestedOpen}
		/>
	));

	return (
		<div
			className="blockera-templates-builder-panel"
			data-test="blockera-templates-builder-panel"
			data-dirty={isDirty ? 'true' : 'false'}
		>
			{!templateId ? (
				<p className="blockera-templates-builder-empty">
					{__(
						'This template is not available yet. Create it from the theme to customize options.',
						'blockera'
					)}
				</p>
			) : null}
			<Flex direction="column" gap="16px">
				{groups}
			</Flex>
			{confirmMessage && (
				<Modal
					title={__('Confirm layout change', 'blockera')}
					onRequestClose={cancelPending}
				>
					<p>{confirmMessage}</p>
					<Flex
						gap="8px"
						alignItems="center"
						justifyContent="flex-end"
					>
						<Button variant="tertiary" onClick={cancelPending}>
							{__('Cancel', 'blockera')}
						</Button>
						<Button variant="primary" onClick={confirmPending}>
							{__('Continue', 'blockera')}
						</Button>
					</Flex>
				</Modal>
			)}
		</div>
	);
}
