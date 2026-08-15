/**
 * Archive Templates options panel — Blocksy-style controls that live-edit
 * the template block tree. Persistence uses the Site Editor native Save.
 */

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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { parse as parseBlocks } from '@wordpress/blocks';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { Flex } from '@blockera/controls';

/**
 * Internal dependencies
 */
import { GatewayCard, GatewayRow } from '../../nested-panels';
import BlockStyleSelect from './controls/block-style-select';
import ColorControlRow from './controls/color-control';
import InputControlRow from './controls/input-control';
import LayoutPicker from './controls/layout-picker';
import NumberControlRow from './controls/number-control';
import SegmentedChoice from './controls/segmented-choice';
import ToggleControlRow from './controls/toggle-control';
import ToggleSelectRow from './controls/toggle-select';
import { hasUnresolvedVariants } from './resolve-variant-html';
import GroupHeaderEdit from './group-header-edit';
import { getBlockeraAttributeId } from './blockera-attribute';
import type {
	ControlValue,
	PanelGroupDef,
	TemplateOptionsConfig,
} from './types';
import useTemplateOptions from './use-template-options';
import './template-options-panel.scss';

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

type TemplateOptionsTitleActionsProps = {
	templateId: string | number | null;
};

/**
 * Powered-by mark + more menu for the drill-down title row (Reset the Template).
 */
export function TemplateOptionsTitleActions({
	templateId,
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
			const themeFile = (await apiFetch({
				path: `/wp/v2/templates/${templateId}?context=edit&source=theme`,
			})) as { content?: { raw?: string } | string };
			const raw =
				typeof themeFile.content === 'string'
					? themeFile.content
					: themeFile.content?.raw || '';
			const blocks = parseBlocks(raw);
			editEntityRecord('postType', 'wp_template', templateId, {
				blocks,
				content: raw,
				source: 'theme',
			});
			await saveEditedEntityRecord('postType', 'wp_template', templateId);
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
		controlStates,
		isDirty,
		onChangeControl,
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
				(c) => c.control.operation === 'selectInCanvas'
			) || null;
		const controls = visibleControls.filter(
			(c) => c.control.operation !== 'selectInCanvas'
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
			!gatewayRow
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

		const showBody = headerEnabled && (controls.length > 0 || !!gatewayRow);

		const body = showBody ? (
			<div className="admin-ui-page__content has-padding">
				<Flex direction="column" gap="16px">
					{controls.map(({ control, state, value, blockName }) => {
						const missing = state.kind === 'missing';
						// Pattern content not resolved yet (or slug
						// unregistered) — keep the control visible
						// but inert so ops never run on empty HTML.
						const waitingForContent =
							hasUnresolvedVariants(control);
						const controlDisabled =
							commonDisabled || waitingForContent;
						const blockeraAttributeId = control.attributePath
							? getBlockeraAttributeId(control.attributePath) ||
								undefined
							: undefined;
						let controlNode = null;

						if (control.type === 'layout-picker') {
							controlNode = (
								<LayoutPicker
									label={control.label}
									value={
										typeof value === 'string' ? value : null
									}
									variants={control.variants || []}
									disabled={controlDisabled}
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
									title={control.label}
									enabled={!!value}
									data-test={`blockera-templates-builder-gateway-${control.nestedPanel.id}`}
									toggle={{
										checked: !!value,
										disabled: controlDisabled,
										'aria-label': control.label,
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
						} else if (control.type === 'segmented-choice') {
							controlNode = (
								<SegmentedChoice
									label={control.label}
									value={
										typeof value === 'string' ? value : null
									}
									variants={control.variants || []}
									disabled={controlDisabled || missing}
									onChange={(id) =>
										onChangeControl(control, id)
									}
								/>
							);
						} else if (control.type === 'number') {
							controlNode = (
								<NumberControlRow
									label={control.label}
									value={Number(value) || 10}
									min={control.min}
									max={control.max}
									step={control.step}
									disabled={commonDisabled}
									onChange={(next) =>
										onChangeControl(control, next)
									}
								/>
							);
						} else if (control.type === 'input') {
							const isGapPath =
								blockeraAttributeId === 'blockeraGap';
							controlNode = (
								<InputControlRow
									controlId={control.id}
									label={control.label}
									value={inputControlValue(value, isGapPath)}
									disabled={commonDisabled}
									unitType={control.unitType}
									controlAddonTypes={
										control.controlAddonTypes
									}
									variableTypes={control.variableTypes}
									min={control.min}
									attribute={blockeraAttributeId}
									blockName={blockName}
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

						return (
							<div
								key={control.id}
								className={
									control.separatorBefore
										? 'blockera-templates-builder-control has-separator-before'
										: 'blockera-templates-builder-control'
								}
							>
								{controlNode}
							</div>
						);
					})}
					{gatewayRow}
				</Flex>
			</div>
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
									'aria-label': headerToggleDef.label,
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
			<section
				key={group.id}
				className={classNames(
					'blockera-se-admin-ui-card',
					'admin-ui-page',
					'blockera-templates-builder-group',
					{ 'is-header-collapsed': !showBody }
				)}
				data-test={`blockera-templates-builder-group-${group.id}`}
			>
				<div className="admin-ui-page__header">
					<Flex
						gap="8px"
						alignItems="center"
						justifyContent="space-between"
						className="admin-ui-page__header-content"
					>
						<h2 className="admin-ui-page__header-title">
							{group.title}
						</h2>
						{(headerEdit ||
							(headerToggleDef && headerToggleView)) && (
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
											aria-label={headerToggleDef.label}
										/>
									</span>
								)}
							</Flex>
						)}
					</Flex>
				</div>
				{body}
			</section>
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
