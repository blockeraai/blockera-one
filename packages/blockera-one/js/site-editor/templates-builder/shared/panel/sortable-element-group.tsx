/**
 * Isolated so getId / onReorder / renderItem stay referentially stable
 * across parent re-renders (SortableElementList memos ids from getId).
 */

import { useCallback, useLayoutEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { GatewayRow } from '../../../nested-panels';
import {
	resolveDisplayBuckets,
	resolveElementBuckets,
	resolveParentStampName,
	type ElementBucket,
} from '../element-order';
import { lookupFromInnerOrder } from '../stamp-lookup';
import { hasUnresolvedVariants } from '../resolve/resolve-variant-html';
import { sessionOrderKeyForRule, useEditorSession } from '../../../session';
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
	entityKey: string;
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
	entityKey,
}: SortableElementGroupProps) {
	const session = useEditorSession();
	const freezeKey = sessionOrderKeyForRule(entityKey, orderRule);
	const useBuckets = !!orderRule.bucketParents?.length;
	const showParentNames = !!orderRule.showParentNames;

	const byId = useMemo(() => {
		const map: Record<string, ControlViewState> = {};
		for (let i = 0; i < items.length; i++) {
			map[items[i].control.target.id] = items[i];
		}
		return map;
	}, [items]);

	const isOn = useCallback((id: string) => !!byId[id]?.value, [byId]);

	const resolvedBuckets = useMemo(
		() => resolveElementBuckets(blocks, orderRule),
		[blocks, orderRule]
	);

	// Read every render. Memoizing on `session` keeps the first empty get()
	// when ensure() writes without a notify (listener not subscribed yet).
	const frozenForList = session.get<ElementBucket[]>(freezeKey);

	const { buckets: displayBuckets, seeded } = useMemo(
		() => resolveDisplayBuckets(resolvedBuckets, frozenForList, isOn),
		[frozenForList, isOn, resolvedBuckets]
	);

	useLayoutEffect(() => {
		if (seeded) {
			session.ensure(freezeKey, displayBuckets);
		}
	}, [displayBuckets, session, freezeKey, seeded]);

	const onReorder = useCallback(
		(orderedIds: string[]) => {
			session.set(freezeKey, [
				{ parentId: orderRule.parentId, ids: orderedIds },
			]);
			onReorderElements(orderRule, orderedIds);
		},
		[session, freezeKey, onReorderElements, orderRule]
	);
	const onReorderBuckets = useCallback(
		(payload: BucketReorderPayload) => {
			session.set(freezeKey, payload.buckets);
			onReorderElements(orderRule, payload);
		},
		[session, freezeKey, onReorderElements, orderRule]
	);

	const listBuckets = useMemo(() => {
		if (!useBuckets) {
			return undefined;
		}
		const lookup = lookupFromInnerOrder(orderRule);
		return displayBuckets.map((bucket) => ({
			parentId: bucket.parentId,
			items: bucket.ids.map((id) => byId[id]).filter(Boolean),
			label: showParentNames
				? resolveParentStampName(blocks, bucket.parentId, lookup)
				: undefined,
		}));
	}, [blocks, byId, displayBuckets, orderRule, showParentNames, useBuckets]);

	const orderedItems = useMemo(() => {
		const ids = displayBuckets.flatMap((bucket) => bucket.ids);
		return ids.map((id) => byId[id]).filter(Boolean);
	}, [byId, displayBuckets]);

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
			items={orderedItems}
			getId={getSortableItemId}
			disabled={disabled}
			data-test={`blockera-templates-builder-sortable-${groupId}`}
			onReorder={onReorder}
			buckets={listBuckets}
			onReorderBuckets={useBuckets ? onReorderBuckets : undefined}
			listLabel={listLabel}
			renderItem={renderItem}
		/>
	);
}
