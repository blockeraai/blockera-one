/**
 * Isolated so getId / onReorder / renderItem stay referentially stable
 * across parent re-renders (SortableElementList memos ids from getId).
 */

import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { GatewayRow } from '../../../nested-panels';
import {
	resolveElementBuckets,
	resolveParentStampName,
} from '../element-order';
import { lookupFromInnerOrder } from '../stamp-lookup';
import { hasUnresolvedVariants } from '../resolve/resolve-variant-html';
import SortableElementList, {
	type BucketReorderPayload,
	type SortableElementRenderProps,
} from '../sortable/sortable-element-list';
import type { ControlViewState } from '../resolve/resolve-control-values';
import type {
	BlockNode,
	ControlDef,
	ControlValue,
	InnerOrderRule,
	ReorderElementsPayload,
} from '../types';
import { buildGatewayRowProps } from './gateway-row-props';

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

export function SortableElementGroup({
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
		const lookup = lookupFromInnerOrder(orderRule);
		return resolveElementBuckets(blocks, orderRule).map((bucket) => ({
			parentId: bucket.parentId,
			items: bucket.ids.map((id) => byId[id]).filter(Boolean),
			label: showParentNames
				? resolveParentStampName(blocks, bucket.parentId, lookup)
				: undefined,
		}));
	}, [blocks, items, orderRule, showParentNames, useBuckets]);
	const listLabel = useMemo(() => {
		if (useBuckets || !showParentNames) {
			return undefined;
		}
		return resolveParentStampName(
			blocks,
			orderRule.parentId,
			lookupFromInnerOrder(orderRule)
		);
	}, [blocks, orderRule, showParentNames, useBuckets]);

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
					{...buildGatewayRowProps({
						title: control.label ?? '',
						nestedPanelId: control.nestedPanel!.id,
						enabled: !!value,
						onOpenNested,
						toggle: {
							checked: !!value,
							disabled: controlDisabled,
							'aria-label': control.label || control.id,
							onChange: (next) => onChangeControl(control, next),
						},
						dragHandle,
						isDragging,
					})}
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
