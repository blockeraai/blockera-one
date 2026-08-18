/**
 * Archive Templates options panel — Blocksy-style controls that live-edit
 * the template block tree. Persistence uses the Site Editor native Save.
 */

import type { ReactElement } from 'react';

import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	DropdownMenu,
	FormToggle,
	MenuGroup,
	MenuItem,
	Modal,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import {
	cloneElement,
	isValidElement,
	useCallback,
	useMemo,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { parse as parseBlocks } from '@wordpress/blocks';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { ControlContextProvider, Flex } from '@blockera/controls';

/**
 * Internal dependencies
 */
import { GatewayCard, GatewayRow } from '../../nested-panels';
import GroupCard from '../../components/group-card';
import BlockStyleSelect from './controls/block-style-select';
import BorderControlRow from './controls/border-control';
import ColorControlRow from './controls/color-control';
import InputControlRow from './controls/input-control';
import LayoutMatrixControlRow from './controls/layout-matrix-control';
import LayoutPicker from './controls/layout-picker';
import StepperControlRow from './controls/stepper-control';
import ToggleControlRow from './controls/toggle-control';
import ToggleSelectRow from './controls/toggle-select';
import { hasUnresolvedVariants } from './resolve-variant-html';
import GroupHeaderEdit from './group-header-edit';
import { getBlockeraAttributeId } from './blockera-attribute';
import {
	getGroupInnerOrder,
	isSortableElementControl,
	resolveElementBuckets,
	resolveElementOrder,
	resolveParentStampName,
} from './element-order';
import SortableElementList, {
	type BucketReorderPayload,
	type SortableElementRenderProps,
} from './sortable-element-list';
import type { ControlViewState } from './resolve-control-values';
import type {
	BlockNode,
	BuilderEntityPostType,
	ControlDef,
	ControlValue,
	InnerOrderRule,
	PanelGroupDef,
	ReorderElementsPayload,
	TemplateOptionsConfig,
} from './types';
import useTemplateOptions from './use-template-options';
import './controls/shared/_controls.scss';
import './template-options-panel.scss';

type ControlRootProps = {
	className?: string;
	children?: unknown;
};

/**
 * List item without an extra wrapper: key + optional separator class go on
 * the control root (BaseControl / GatewayRow). Walk through
 * ControlContextProvider so className lands on the actual field.
 */
export function asControlListItem(
	controlNode: ReactElement<ControlRootProps>,
	id: string,
	separatorBefore?: boolean
): ReactElement {
	if (!separatorBefore) {
		return cloneElement(controlNode, { key: id });
	}

	const extraClass = 'has-separator-before';

	if (
		controlNode.type === ControlContextProvider &&
		isValidElement<ControlRootProps>(controlNode.props.children)
	) {
		const child = controlNode.props.children;
		return cloneElement(
			controlNode,
			{ key: id },
			cloneElement(child, {
				className: classNames(child.props.className, extraClass),
			})
		);
	}

	return cloneElement(controlNode, {
		key: id,
		className: classNames(controlNode.props.className, extraClass),
	});
}

function wrapGapValue(next: unknown): Record<string, unknown> {
	return {
		lock: true,
		gap: next,
		columns: '',
		rows: '',
	};
}

/**
 * Gap is stored as `{ lock, gap, columns, rows }`. Only unwrap that shape —
 * font-size (and other) value-addon objects must pass through intact.
 */
function inputControlValue(value: unknown, unwrapGap: boolean): unknown {
	if (
		unwrapGap &&
		value &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		'gap' in (value as Record<string, unknown>)
	) {
		return (value as { gap: unknown }).gap;
	}
	return value ?? '';
}

type TemplateOptionsPanelProps = {
	config: TemplateOptionsConfig;
	filterId: string;
	templateId: string | number | null;
	/** Groups for the current nested screen (defaults to config root). */
	groups?: PanelGroupDef[];
	/** Open a nested panel by its nestedPanel.id (gateway rows). */
	onOpenNested?: (panelId: string) => void;
};

function getSortableItemId(item: ControlViewState): string {
	return item.control.target.id;
}

type SortableElementGroupProps = {
	items: ControlViewState[];
	groupId: string;
	orderRule: InnerOrderRule;
	blocks: BlockNode[];
	disabled: boolean;
	onReorderElements: (
		rule: InnerOrderRule,
		payload: ReorderElementsPayload
	) => void;
	onChangeControl: (control: ControlDef, next: ControlValue) => void;
	onOpenNested?: (panelId: string) => void;
};

/**
 * Isolated so getId / onReorder / renderItem stay referentially stable
 * across parent re-renders (SortableElementList memos ids from getId).
 */
function SortableElementGroup({
	items,
	groupId,
	orderRule,
	blocks,
	disabled,
	onReorderElements,
	onChangeControl,
	onOpenNested,
}: SortableElementGroupProps) {
	const onReorder = useCallback(
		(orderedIds: string[]) => {
			onReorderElements(orderRule, orderedIds);
		},
		[onReorderElements, orderRule]
	);
	const onReorderBuckets = useCallback(
		(payload: BucketReorderPayload) => {
			onReorderElements(orderRule, payload);
		},
		[onReorderElements, orderRule]
	);
	const useBuckets = !!orderRule.bucketParents?.length;
	const showParentNames = !!orderRule.showParentNames;
	const buckets = useMemo(() => {
		if (!useBuckets) {
			return undefined;
		}
		const byId: Record<string, ControlViewState> = {};
		for (let i = 0; i < items.length; i++) {
			byId[items[i].control.target.id] = items[i];
		}
		return resolveElementBuckets(blocks, orderRule).map((bucket) => ({
			parentId: bucket.parentId,
			items: bucket.ids.map((id) => byId[id]).filter(Boolean),
			label: showParentNames
				? resolveParentStampName(blocks, bucket.parentId)
				: undefined,
		}));
	}, [blocks, items, orderRule, showParentNames, useBuckets]);
	const listLabel =
		!useBuckets && showParentNames
			? resolveParentStampName(blocks, orderRule.parentId)
			: undefined;

	const renderItem = useCallback(
		(
			item: ControlViewState,
			{ dragHandle, isDragging }: SortableElementRenderProps
		) => {
			const { control, value, disabled: viewDisabled } = item;
			const waitingForContent = hasUnresolvedVariants(control);
			const controlDisabled =
				disabled || waitingForContent || !!viewDisabled;
			return (
				<GatewayRow
					title={control.label ?? ''}
					enabled={!!value}
					dragHandle={dragHandle}
					isDragging={isDragging}
					data-test={`blockera-templates-builder-gateway-${control.nestedPanel!.id}`}
					toggle={{
						checked: !!value,
						disabled: controlDisabled,
						'aria-label': control.label || control.id,
						onChange: (next) => onChangeControl(control, next),
					}}
					onOpen={
						onOpenNested
							? () => onOpenNested(control.nestedPanel!.id)
							: undefined
					}
				/>
			);
		},
		[disabled, onChangeControl, onOpenNested]
	);

	return (
		<SortableElementList
			items={items}
			getId={getSortableItemId}
			disabled={disabled}
			data-test={`blockera-templates-builder-sortable-${groupId}`}
			onReorder={onReorder}
			buckets={buckets}
			onReorderBuckets={useBuckets ? onReorderBuckets : undefined}
			listLabel={listLabel}
			renderItem={renderItem}
		/>
	);
}

type TemplateOptionsTitleActionsProps = {
	templateId: string | number | null;
	postType?: BuilderEntityPostType;
};

/**
 * Powered-by mark + more menu for the drill-down title row (Reset the Template).
 */
export function TemplateOptionsTitleActions({
	templateId,
	postType = 'wp_template',
}: TemplateOptionsTitleActionsProps) {
	const [isResetting, setIsResetting] = useState(false);
	const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch(
		coreStore
	) as unknown as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: string | number,
			edits: Record<string, unknown>
		) => void;
		saveEditedEntityRecord: (
			kind: string,
			name: string,
			key: string | number
		) => Promise<unknown>;
	};

	const resetToTheme = async () => {
		if (!templateId) {
			return;
		}
		setIsResetConfirmOpen(false);
		setIsResetting(true);
		try {
			const restBase =
				postType === 'wp_template_part'
					? 'template-parts'
					: 'templates';
			const themeFile = (await apiFetch({
				path: `/wp/v2/${restBase}/${templateId}?context=edit&source=theme`,
			})) as { content?: { raw?: string } | string };
			const raw =
				typeof themeFile.content === 'string'
					? themeFile.content
					: themeFile.content?.raw || '';
			const blocks = parseBlocks(raw);
			editEntityRecord('postType', postType, templateId, {
				blocks,
				content: raw,
				source: 'theme',
			});
			await saveEditedEntityRecord('postType', postType, templateId);
		} finally {
			setIsResetting(false);
		}
	};

	return (
		<div className="blockera-templates-builder-title-actions">
			<DropdownMenu
				icon={moreVertical}
				label={__('More', 'blockera')}
				className="blockera-templates-builder-title-actions__more"
				popoverProps={{
					placement: 'bottom-end',
					className:
						'blockera-templates-builder-title-actions__more-popover',
				}}
				toggleProps={{
					size: 'compact',
					disabled: !templateId || isResetting,
					'data-test': 'blockera-templates-builder-more',
				}}
			>
				{({ onClose }) => (
					<MenuGroup>
						<MenuItem
							data-test="blockera-templates-builder-reset"
							disabled={!templateId || isResetting}
							onClick={() => {
								onClose();
								setIsResetConfirmOpen(true);
							}}
						>
							{__('Reset the Template', 'blockera')}
						</MenuItem>
					</MenuGroup>
				)}
			</DropdownMenu>
			{isResetConfirmOpen && (
				<Modal
					title={__('Reset the Template', 'blockera')}
					onRequestClose={() => {
						if (!isResetting) {
							setIsResetConfirmOpen(false);
						}
					}}
				>
					<p>
						{__(
							'Reset this template to the theme default? Your customizations to this template will be removed.',
							'blockera'
						)}
					</p>
					<Flex
						gap="8px"
						alignItems="center"
						justifyContent="flex-end"
					>
						<Button
							variant="tertiary"
							disabled={isResetting}
							onClick={() => setIsResetConfirmOpen(false)}
						>
							{__('Cancel', 'blockera')}
						</Button>
						<Button
							variant="primary"
							isBusy={isResetting}
							disabled={isResetting}
							onClick={() => {
								void resetToTheme();
							}}
						>
							{__('Reset', 'blockera')}
						</Button>
					</Flex>
				</Modal>
			)}
		</div>
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

	const groups = screenGroups.map((group) => {
		const headerToggleDef = group.headerToggle;
		const headerToggleView = headerToggleDef
			? controlStates.find((c) => c.control.id === headerToggleDef.id)
			: null;
		const headerEnabled = headerToggleDef
			? !!headerToggleView?.value
			: true;

		const visibleControls = controlStates.filter(
			(c) =>
				c.visible &&
				group.controls.some((gc) => gc.id === c.control.id) &&
				c.control.id !== headerToggleDef?.id
		);
		// Canvas-jump actions live on the heading Edit button.
		const customizeView =
			visibleControls.find(
				(c) =>
					c.control.operation === 'selectInCanvas' &&
					c.control.type !== 'gateway'
			) || null;
		const controls = visibleControls.filter(
			(c) =>
				c.control.operation !== 'selectInCanvas' ||
				c.control.type === 'gateway'
		);

		const commonDisabled = !templateId;
		// Never swap/insert empty markup: controls whose pattern content is
		// still loading (or missing) stay visible but disabled.
		const headerToggleDisabled =
			commonDisabled ||
			(headerToggleView
				? hasUnresolvedVariants(headerToggleView.control)
				: false);

		const gatewayRow =
			group.nestedPanel && headerEnabled && group.controls.length > 0 ? (
				<GatewayRow
					title={
						group.nestedPanel.gatewayLabel ||
						group.nestedPanel.title
					}
					enabled={headerEnabled}
					data-test={`blockera-templates-builder-gateway-${group.nestedPanel.id}`}
					onOpen={
						onOpenNested
							? () => onOpenNested(group.nestedPanel!.id)
							: undefined
					}
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

		const orderRule =
			group.sortable &&
			controls.some((c) => isSortableElementControl(c.control))
				? getGroupInnerOrder(group)
				: null;
		const order = orderRule ? resolveElementOrder(blocks, orderRule) : [];
		const orderRank: Record<string, number> = {};
		for (let i = 0; i < order.length; i++) {
			orderRank[order[i]] = i;
		}
		const sortableViews = orderRule
			? controls
					.filter((c) => isSortableElementControl(c.control))
					.sort((a, b) => {
						const ai = orderRank[a.control.target.id] ?? 999;
						const bi = orderRank[b.control.target.id] ?? 999;
						return ai - bi;
					})
			: [];
		const sortableControlIds = new Set(
			sortableViews.map((c) => c.control.id)
		);
		const staticControls = orderRule
			? controls.filter((c) => !sortableControlIds.has(c.control.id))
			: controls;

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
					}) => {
						const missing = state.kind === 'missing';
						// Pattern content not resolved yet (or slug
						// unregistered) — keep the control visible
						// but inert so ops never run on empty HTML.
						const waitingForContent =
							hasUnresolvedVariants(control);
						const controlDisabled =
							commonDisabled ||
							waitingForContent ||
							!!viewDisabled;
						const blockeraAttributeId = control.attributePath
							? getBlockeraAttributeId(control.attributePath) ||
								undefined
							: undefined;
						let controlNode = null;

						if (control.type === 'gateway' && control.nestedPanel) {
							controlNode = (
								<GatewayRow
									title={control.label ?? ''}
									enabled={true}
									data-test={`blockera-templates-builder-gateway-${control.nestedPanel.id}`}
									onOpen={
										onOpenNested
											? () =>
													onOpenNested(
														control.nestedPanel!.id
													)
											: undefined
									}
								/>
							);
						} else if (control.type === 'layout-picker') {
							controlNode = (
								<LayoutPicker
									label={control.label}
									value={
										typeof value === 'string' ? value : null
									}
									variants={control.variants || []}
									disabled={controlDisabled}
									columns={control.columns}
									missing={missing}
									onAddBack={() =>
										onChangeControl(
											control,
											control.variants?.[0]?.id ||
												'default'
										)
									}
									onChange={(id) =>
										onChangeControl(control, id)
									}
								/>
							);
						} else if (
							control.type === 'toggle' &&
							control.nestedPanel
						) {
							controlNode = (
								<GatewayRow
									title={control.label ?? ''}
									enabled={!!value}
									data-test={`blockera-templates-builder-gateway-${control.nestedPanel.id}`}
									toggle={{
										checked: !!value,
										disabled: controlDisabled,
										'aria-label':
											control.label || control.id,
										onChange: (next) =>
											onChangeControl(control, next),
									}}
									onOpen={
										onOpenNested
											? () =>
													onOpenNested(
														control.nestedPanel!.id
													)
											: undefined
									}
								/>
							);
						} else if (control.type === 'toggle') {
							controlNode = (
								<ToggleControlRow
									label={control.label}
									checked={!!value}
									disabled={controlDisabled}
									columns={control.columns}
									onChange={(next) =>
										onChangeControl(control, next)
									}
								/>
							);
						} else if (control.operation === 'placeSection') {
							controlNode = (
								<ToggleSelectRow
									controlId={control.id}
									label={control.label}
									value={
										typeof value === 'string' ? value : null
									}
									variants={control.variants || []}
									disabled={controlDisabled || missing}
									columns={control.columns}
									defaultValue={
										typeof control.defaultValue === 'string'
											? control.defaultValue
											: 'bottom'
									}
									onChange={(id) =>
										onChangeControl(control, id)
									}
								/>
							);
						} else if (control.type === 'border') {
							controlNode = (
								<BorderControlRow
									controlId={control.id}
									label={control.label}
									value={value}
									disabled={commonDisabled}
									attribute={blockeraAttributeId}
									blockName={blockName}
									columns={control.columns}
									onChange={(next) =>
										onChangeControl(
											control,
											next as ControlValue
										)
									}
								/>
							);
						} else if (control.type === 'number') {
							const numberFallback =
								typeof control.defaultValue === 'number'
									? control.defaultValue
									: 10;
							const numberValue =
								typeof value === 'number' &&
								!Number.isNaN(value)
									? value
									: numberFallback;
							controlNode = (
								<StepperControlRow
									controlId={control.id}
									label={control.label}
									value={numberValue}
									min={control.min}
									max={control.max}
									step={control.step}
									disabled={commonDisabled}
									labelDescription={control.labelDescription}
									attribute={blockeraAttributeId}
									blockName={blockName}
									defaultValue={numberFallback}
									columns={control.columns}
									onChange={(next) =>
										onChangeControl(control, next)
									}
								/>
							);
						} else if (control.type === 'input') {
							const isGapPath =
								blockeraAttributeId === 'blockeraGap';
							// Value is already the merge-key side from
							// resolveControlViewStates — do not pick again.
							const inputValue = inputControlValue(
								value,
								isGapPath
							);
							controlNode = (
								<InputControlRow
									controlId={control.id}
									label={control.label}
									value={inputValue}
									disabled={commonDisabled}
									unitType={control.unitType}
									controlAddonTypes={
										control.controlAddonTypes
									}
									variableTypes={control.variableTypes}
									min={control.min}
									attribute={blockeraAttributeId}
									blockName={blockName}
									columns={control.columns}
									defaultValue={
										typeof control.defaultValue ===
											'string' ||
										typeof control.defaultValue === 'number'
											? control.defaultValue
											: ''
									}
									onChange={(next) =>
										onChangeControl(
											control,
											isGapPath
												? wrapGapValue(next)
												: (next as ControlValue)
										)
									}
								/>
							);
						} else if (control.type === 'layout-matrix') {
							controlNode = (
								<LayoutMatrixControlRow
									controlId={control.id}
									label={control.label}
									value={value}
									disabled={commonDisabled}
									attribute={blockeraAttributeId}
									blockName={blockName}
									isDirectionActive={
										control.isDirectionActive
									}
									isAxisControlsActive={
										control.isAxisControlsActive
									}
									defaultDirection={control.defaultDirection}
									columns={control.columns}
									onChange={(next) =>
										onChangeControl(control, next)
									}
								/>
							);
						} else if (control.type === 'color') {
							controlNode = (
								<ColorControlRow
									controlId={control.id}
									label={control.label}
									value={value}
									disabled={commonDisabled}
									controlAddonTypes={
										control.controlAddonTypes
									}
									variableTypes={control.variableTypes}
									attribute={blockeraAttributeId}
									blockName={blockName}
									columns={control.columns}
									onChange={(next) =>
										onChangeControl(
											control,
											next as ControlValue
										)
									}
								/>
							);
						} else if (
							control.type === 'select' &&
							control.operation === 'setBlockStyle'
						) {
							controlNode = (
								<BlockStyleSelect
									controlId={control.id}
									label={control.label}
									value={
										typeof value === 'string' ? value : null
									}
									blockName={blockName}
									sectionId={control.target.id}
									disabled={controlDisabled || missing}
									columns={control.columns}
									defaultValue={
										typeof control.defaultValue === 'string'
											? control.defaultValue
											: 'default'
									}
									onChange={(id) =>
										onChangeControl(control, id)
									}
								/>
							);
						}

						if (!controlNode) {
							return null;
						}

						return asControlListItem(
							controlNode,
							control.id,
							control.separatorBefore
						);
					}
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
										headerToggleDef.label ||
										headerToggleDef.id,
									onChange: (next) =>
										onChangeControl(headerToggleDef, next),
								}
							: undefined
					}
					onOpen={
						onOpenNested
							? () => onOpenNested(group.nestedPanel!.id)
							: undefined
					}
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
										onChange={() =>
											onChangeControl(
												headerToggleDef,
												!headerToggleView.value
											)
										}
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
	});

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
			) : (
				<Flex direction="column" gap="16px">
					{groups}
				</Flex>
			)}
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
