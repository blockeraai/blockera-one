/**
 * Map a control view to its inspector row.
 */

import type { ReactElement } from 'react';

/**
 * Blockera dependencies
 */
import { DEFAULT_RESOLUTION_VALUE } from '@blockera/controls';

/**
 * Internal dependencies
 */
import { GatewayRow } from '../../../nested-panels';
import AspectRatioControlRow from '../controls/aspect-ratio-control';
import BlockStyleSelect from '../controls/block-style-select';
import BorderControlRow from '../controls/border-control';
import BorderRadiusControlRow from '../controls/border-radius-control';
import ColorControlRow from '../controls/color-control';
import FontFamilyControlRow from '../controls/font-family-control';
import IconControlRow from '../controls/icon-control';
import InputControlRow from '../controls/input-control';
import ResolutionControlRow from '../controls/resolution-control';
import LayoutMatrixControlRow from '../controls/layout-matrix-control';
import LayoutPicker from '../controls/layout-picker';
import StepperControlRow from '../controls/stepper-control';
import TextAlignControlRow from '../controls/text-align-control';
import ToggleControlRow from '../controls/toggle-control';
import ToggleSelectRow from '../controls/toggle-select';
import { getBlockeraAttributeId } from '../blockera-attribute';
import { hasUnresolvedVariants } from '../resolve/resolve-variant-html';
import type {
	ControlDef,
	ControlType,
	ControlValue,
	ResolvedOptionState,
} from '../types';
import { asControlListItem } from './as-control-list-item';
import { buildGatewayRowProps } from './gateway-row-props';

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

export type ControlRendererProps = {
	control: ControlDef;
	value: ControlValue;
	state: ResolvedOptionState;
	blockName?: string;
	missing: boolean;
	controlDisabled: boolean;
	blockeraAttributeId?: string;
	onChangeControl: (control: ControlDef, next: ControlValue) => void;
	onOpenNested?: (panelId: string) => void;
};

export type ControlRenderer = (
	props: ControlRendererProps
) => ReactElement | null;

export type RenderControlArgs = {
	control: ControlDef;
	state: ResolvedOptionState;
	value: ControlValue;
	blockName?: string;
	disabled?: boolean;
	commonDisabled: boolean;
	onChangeControl: (control: ControlDef, next: ControlValue) => void;
	onOpenNested?: (panelId: string) => void;
};

function renderLayoutPicker({
	control,
	value,
	missing,
	controlDisabled,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<LayoutPicker
			label={control.label}
			value={typeof value === 'string' ? value : null}
			variants={control.variants || []}
			disabled={controlDisabled}
			columns={control.columns}
			missing={missing}
			onAddBack={() =>
				onChangeControl(control, control.variants?.[0]?.id || 'default')
			}
			onChange={(id) => onChangeControl(control, id)}
		/>
	);
}

function renderToggle({
	control,
	value,
	controlDisabled,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<ToggleControlRow
			label={control.label}
			checked={!!value}
			disabled={controlDisabled}
			columns={control.columns}
			onChange={(next) => onChangeControl(control, next)}
		/>
	);
}

function renderNumber({
	control,
	value,
	controlDisabled,
	blockeraAttributeId,
	blockName,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	const numberFallback =
		typeof control.defaultValue === 'number' ? control.defaultValue : 10;
	const numberValue =
		typeof value === 'number' && !Number.isNaN(value)
			? value
			: numberFallback;
	return (
		<StepperControlRow
			controlId={control.id}
			label={control.label}
			value={numberValue}
			min={control.min}
			max={control.max}
			step={control.step}
			disabled={controlDisabled}
			labelDescription={control.labelDescription}
			attribute={blockeraAttributeId}
			blockName={blockName}
			defaultValue={numberFallback}
			columns={control.columns}
			onChange={(next) => onChangeControl(control, next)}
		/>
	);
}

function renderInput({
	control,
	value,
	controlDisabled,
	blockeraAttributeId,
	blockName,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	const isGapPath = blockeraAttributeId === 'blockeraGap';
	// Value is already the merge-key side from
	// resolveControlViewStates — do not pick again.
	const inputValue = inputControlValue(value, isGapPath);
	return (
		<InputControlRow
			controlId={control.id}
			label={control.label}
			value={inputValue}
			disabled={controlDisabled}
			unitType={control.unitType}
			controlAddonTypes={control.controlAddonTypes}
			variableTypes={control.variableTypes}
			min={control.min}
			attribute={blockeraAttributeId}
			blockName={blockName}
			columns={control.columns}
			defaultValue={
				typeof control.defaultValue === 'string' ||
				typeof control.defaultValue === 'number'
					? control.defaultValue
					: ''
			}
			onChange={(next) =>
				onChangeControl(
					control,
					isGapPath ? wrapGapValue(next) : (next as ControlValue)
				)
			}
		/>
	);
}

function renderColor({
	control,
	value,
	controlDisabled,
	blockeraAttributeId,
	blockName,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<ColorControlRow
			controlId={control.id}
			label={control.label}
			value={value}
			disabled={controlDisabled}
			controlAddonTypes={control.controlAddonTypes}
			variableTypes={control.variableTypes}
			attribute={blockeraAttributeId}
			blockName={blockName}
			columns={control.columns}
			onChange={(next) => onChangeControl(control, next as ControlValue)}
		/>
	);
}

function renderLayoutMatrix({
	control,
	value,
	controlDisabled,
	blockeraAttributeId,
	blockName,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<LayoutMatrixControlRow
			controlId={control.id}
			label={control.label}
			value={value}
			disabled={controlDisabled}
			attribute={blockeraAttributeId}
			blockName={blockName}
			isDirectionActive={control.isDirectionActive}
			isAxisControlsActive={control.isAxisControlsActive}
			defaultDirection={control.defaultDirection}
			columns={control.columns}
			onChange={(next) => onChangeControl(control, next)}
		/>
	);
}

function renderBorder({
	control,
	value,
	controlDisabled,
	blockeraAttributeId,
	blockName,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<BorderControlRow
			controlId={control.id}
			label={control.label}
			value={value}
			disabled={controlDisabled}
			attribute={blockeraAttributeId}
			blockName={blockName}
			columns={control.columns}
			onChange={(next) => onChangeControl(control, next as ControlValue)}
		/>
	);
}

function renderBorderRadius({
	control,
	value,
	controlDisabled,
	blockeraAttributeId,
	blockName,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<BorderRadiusControlRow
			controlId={control.id}
			label={control.label}
			value={value}
			disabled={controlDisabled}
			attribute={blockeraAttributeId}
			blockName={blockName}
			columns={control.columns}
			controlAddonTypes={control.controlAddonTypes}
			variableTypes={control.variableTypes}
			onChange={(next) => onChangeControl(control, next as ControlValue)}
		/>
	);
}

function renderAspectRatio({
	control,
	value,
	controlDisabled,
	blockeraAttributeId,
	blockName,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<AspectRatioControlRow
			controlId={control.id}
			label={control.label}
			value={value}
			disabled={controlDisabled}
			attribute={blockeraAttributeId}
			blockName={blockName}
			columns={control.columns}
			onChange={(next) => onChangeControl(control, next as ControlValue)}
		/>
	);
}

function renderResolution({
	control,
	value,
	controlDisabled,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<ResolutionControlRow
			controlId={control.id}
			label={control.label}
			value={value}
			disabled={controlDisabled}
			columns={control.columns}
			defaultValue={
				typeof control.defaultValue === 'string'
					? control.defaultValue
					: DEFAULT_RESOLUTION_VALUE
			}
			onChange={(next) => onChangeControl(control, next)}
		/>
	);
}

function renderFontFamily({
	control,
	value,
	controlDisabled,
	blockeraAttributeId,
	blockName,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<FontFamilyControlRow
			controlId={control.id}
			label={control.label}
			value={value}
			disabled={controlDisabled}
			controlAddonTypes={control.controlAddonTypes}
			variableTypes={control.variableTypes}
			attribute={blockeraAttributeId}
			blockName={blockName}
			columns={control.columns}
			onChange={(next) => onChangeControl(control, next as ControlValue)}
		/>
	);
}

function renderTextAlign({
	control,
	value,
	controlDisabled,
	blockeraAttributeId,
	blockName,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<TextAlignControlRow
			controlId={control.id}
			label={control.label}
			value={value}
			disabled={controlDisabled}
			attribute={blockeraAttributeId}
			blockName={blockName}
			columns={control.columns}
			onChange={(next) => onChangeControl(control, next as ControlValue)}
		/>
	);
}

function renderGateway({
	control,
	value,
	controlDisabled,
	onChangeControl,
	onOpenNested,
}: ControlRendererProps): ReactElement | null {
	if (!control.nestedPanel) {
		return null;
	}
	const isToggleGateway = control.type === 'toggle';
	return (
		<GatewayRow
			{...buildGatewayRowProps({
				title: control.label ?? '',
				nestedPanelId: control.nestedPanel.id,
				enabled: isToggleGateway ? !!value : true,
				onOpenNested,
				toggle: isToggleGateway
					? {
							checked: !!value,
							disabled: controlDisabled,
							'aria-label': control.label || control.id,
							onChange: (next) => onChangeControl(control, next),
						}
					: undefined,
			})}
		/>
	);
}

function renderIcon({
	control,
	value,
	controlDisabled,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<IconControlRow
			controlId={control.id}
			label={control.label}
			value={value}
			disabled={controlDisabled}
			columns={control.columns}
			onChange={(next) => onChangeControl(control, next as ControlValue)}
		/>
	);
}

function renderToggleSelectRow(
	{
		control,
		value,
		controlDisabled,
		missing,
		onChangeControl,
	}: ControlRendererProps,
	defaultValue: string
): ReactElement {
	return (
		<ToggleSelectRow
			controlId={control.id}
			label={control.label}
			value={typeof value === 'string' ? value : null}
			variants={control.variants || []}
			disabled={controlDisabled || missing}
			columns={control.columns}
			defaultValue={defaultValue}
			onChange={(id) => onChangeControl(control, id)}
		/>
	);
}

function renderPlaceSection(props: ControlRendererProps): ReactElement {
	const fallback =
		typeof props.control.defaultValue === 'string'
			? props.control.defaultValue
			: 'bottom';
	return renderToggleSelectRow(props, fallback);
}

function renderToggleSelect(props: ControlRendererProps): ReactElement {
	return renderToggleSelectRow(props, '');
}

function renderBlockStyle({
	control,
	value,
	blockName,
	controlDisabled,
	missing,
	onChangeControl,
}: ControlRendererProps): ReactElement {
	return (
		<BlockStyleSelect
			controlId={control.id}
			label={control.label}
			value={typeof value === 'string' ? value : null}
			blockName={blockName}
			sectionId={control.target.id}
			disabled={controlDisabled || missing}
			columns={control.columns}
			defaultValue={
				typeof control.defaultValue === 'string'
					? control.defaultValue
					: 'default'
			}
			onChange={(id) => onChangeControl(control, id)}
		/>
	);
}

const CONTROL_RENDERERS = {
	'layout-picker': renderLayoutPicker,
	toggle: renderToggle,
	number: renderNumber,
	input: renderInput,
	color: renderColor,
	select: null, // only setBlockStyle variant is used today
	button: null, // non-visual
	'layout-matrix': renderLayoutMatrix,
	border: renderBorder,
	'border-radius': renderBorderRadius,
	'aspect-ratio': renderAspectRatio,
	resolution: renderResolution,
	'font-family': renderFontFamily,
	'text-align': renderTextAlign,
	gateway: renderGateway,
	icon: renderIcon,
	'toggle-select': renderToggleSelect,
} satisfies Record<ControlType, ControlRenderer | null>;

function resolveControlRenderer(control: ControlDef): ControlRenderer | null {
	if (control.operation === 'placeSection') {
		return renderPlaceSection;
	}
	if (control.type === 'select' && control.operation === 'setBlockStyle') {
		return renderBlockStyle;
	}
	if (control.type === 'toggle' && control.nestedPanel) {
		return renderGateway;
	}
	return CONTROL_RENDERERS[control.type];
}

export function renderControl({
	control,
	state,
	value,
	blockName,
	disabled: viewDisabled,
	commonDisabled,
	onChangeControl,
	onOpenNested,
}: RenderControlArgs): ReactElement | null {
	const missing = state.kind === 'missing';
	// Pattern content not resolved yet (or slug unregistered) — keep the
	// control visible but inert so ops never run on empty HTML.
	const waitingForContent = hasUnresolvedVariants(control);
	const controlDisabled =
		commonDisabled || waitingForContent || !!viewDisabled;
	const blockeraAttributeId = control.attributePath
		? getBlockeraAttributeId(control.attributePath) || undefined
		: undefined;
	const renderer = resolveControlRenderer(control);
	if (!renderer) {
		return null;
	}

	const controlNode = renderer({
		control,
		value,
		state,
		blockName,
		missing,
		controlDisabled,
		blockeraAttributeId,
		onChangeControl,
		onOpenNested,
	});
	if (!controlNode) {
		return null;
	}

	const item = asControlListItem(
		controlNode,
		control.id,
		control.separatorBefore
	);

	if (renderer === renderGateway) {
		return item;
	}

	return (
		<div
			key={control.id}
			data-test={`blockera-templates-builder-control-${control.id}`}
		>
			{item}
		</div>
	);
}
