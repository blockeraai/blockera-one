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
import { GatewayCard } from '../../nested-panels';
import LayoutPicker from './controls/layout-picker';
import NumberControlRow from './controls/number-control';
import SegmentedChoice from './controls/segmented-choice';
import ToggleControlRow from './controls/toggle-control';
import { hasUnresolvedVariants } from './resolve-variant-html';
import type { PanelGroupDef, TemplateOptionsConfig } from './types';
import useTemplateOptions from './use-template-options';
import './template-options-panel.scss';

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

		const controls = controlStates.filter(
			(c) =>
				c.visible &&
				group.controls.some((gc) => gc.id === c.control.id) &&
				c.control.id !== headerToggleDef?.id
		);

		const commonDisabled = !templateId;
		// Never swap/insert empty markup: controls whose pattern content is
		// still loading (or missing) stay visible but disabled.
		const headerToggleDisabled =
			commonDisabled ||
			(headerToggleView
				? hasUnresolvedVariants(headerToggleView.control)
				: false);

		// Compact gateway → nested DrillDown screen.
		if (group.nestedPanel) {
			return (
				<GatewayCard
					key={group.id}
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
				/>
			);
		}

		// Groups without a header toggle hide when empty; toggle groups always show.
		if (!headerToggleDef && controls.length === 0) {
			return null;
		}

		const showBody = headerEnabled && controls.length > 0;

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
				</div>
				{showBody && (
					<div className="admin-ui-page__content has-padding">
						<Flex direction="column" gap="12px">
							{controls.map(({ control, state, value }) => {
								const missing = state.kind === 'missing';
								// Pattern content not resolved yet (or slug
								// unregistered) — keep the control visible
								// but inert so ops never run on empty HTML.
								const waitingForContent =
									hasUnresolvedVariants(control);
								const controlDisabled =
									commonDisabled || waitingForContent;
								let controlNode = null;

								if (control.type === 'layout-picker') {
									controlNode = (
										<LayoutPicker
											label={control.label}
											value={
												typeof value === 'string'
													? value
													: null
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
								} else if (
									control.type === 'segmented-choice'
								) {
									controlNode = (
										<SegmentedChoice
											label={control.label}
											value={
												typeof value === 'string'
													? value
													: null
											}
											variants={control.variants || []}
											disabled={
												controlDisabled || missing
											}
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
						</Flex>
					</div>
				)}
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
				<Flex direction="column" gap="12px">
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
