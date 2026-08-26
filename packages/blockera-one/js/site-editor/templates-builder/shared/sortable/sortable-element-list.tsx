/**
 * Pointer-sortable list for Templates Builder element rows.
 * The dragged row follows the mouse (DragOverlay); siblings reflow live.
 * The block tree is updated only on drop.
 *
 * DragOverlay is portaled to document.body so position:fixed is viewport-
 * relative. The Site Editor sidebar uses will-change:transform, which would
 * otherwise make fixed coords sit below the pointer.
 */

import type { ReactNode } from 'react';
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
	createPortal,
	useCallback,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Blockera dependencies
 */
import {
	type BucketReorderPayload,
	type SortableBucket,
	bucketOrdersEqual,
	cloneBuckets,
	findBucketParent,
	moveItemBetweenBuckets,
	shouldInsertAfter,
} from './sortable-buckets';
import {
	DND_MODIFIERS,
	KEYBOARD_SENSOR_OPTIONS,
	POINTER_SENSOR_OPTIONS,
	RowPointerSensor,
} from './sortable-sensors';
import {
	BucketList,
	HANDLE_ICON,
	ParentName,
	SortableRow,
} from './sortable-row';
import type { SortableElementRenderProps } from './sortable-row';

export type {
	BucketReorderPayload,
	SortableBucket,
	SortableElementRenderProps,
};

export type SortableElementListProps<T> = {
	items: T[];
	getId: (item: T) => string;
	onReorder: (orderedIds: string[]) => void;
	/** Multi-parent lists (loop-item media vs content). */
	buckets?: SortableBucket<T>[];
	onReorderBuckets?: (payload: BucketReorderPayload) => void;
	/** Single-list parent name when `showParentNames` is on. */
	listLabel?: string;
	renderItem: (item: T, props: SortableElementRenderProps) => ReactNode;
	disabled?: boolean;
	'data-test'?: string;
};

export default function SortableElementList<T>({
	items,
	getId,
	onReorder,
	buckets,
	onReorderBuckets,
	listLabel,
	renderItem,
	disabled,
	'data-test': dataTest,
}: SortableElementListProps<T>) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
	const [draftBuckets, setDraftBuckets] = useState<
		SortableBucket<T>[] | null
	>(null);
	const useBuckets = !!buckets?.length && !!onReorderBuckets;
	const displayBuckets = draftBuckets || buckets;
	// Drop reads this so onDragEnd stays stable; listing draftBuckets as
	// a callback dep rebinds DndContext on every placeholder move.
	const draftBucketsRef = useRef(draftBuckets);
	draftBucketsRef.current = draftBuckets;

	const ids = useMemo(() => items.map(getId), [items, getId]);
	const allItems = useMemo(() => {
		if (!useBuckets || !displayBuckets) {
			return items;
		}
		const merged: T[] = [];
		for (let i = 0; i < displayBuckets.length; i++) {
			merged.push(...displayBuckets[i].items);
		}
		return merged;
	}, [displayBuckets, items, useBuckets]);

	const sensors = useSensors(
		useSensor(RowPointerSensor, POINTER_SENSOR_OPTIONS),
		useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS)
	);

	const onDragStart = useCallback(
		(event: DragStartEvent) => {
			setActiveId(String(event.active.id));
			const rect = event.active.rect.current.initial;
			setOverlayWidth(rect?.width ?? null);
			if (useBuckets && buckets) {
				setDraftBuckets(cloneBuckets(buckets));
			}
		},
		[buckets, useBuckets]
	);

	const onDragOver = useCallback(
		(event: DragOverEvent) => {
			if (!useBuckets || !buckets) {
				return;
			}
			const overKey = event.over ? String(event.over.id) : null;
			if (!overKey) {
				return;
			}
			const activeKey = String(event.active.id);
			const insertAfter = shouldInsertAfter(
				event.active,
				event.over,
				event.delta
			);
			setDraftBuckets((current) => {
				const source = current || cloneBuckets(buckets);
				const moved = moveItemBetweenBuckets(
					source,
					activeKey,
					overKey,
					getId,
					insertAfter
				);
				if (!moved) {
					return current || source;
				}
				return moved;
			});
		},
		[buckets, getId, useBuckets]
	);

	const onDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			setActiveId(null);
			setOverlayWidth(null);
			const liveBuckets = draftBucketsRef.current;
			setDraftBuckets(null);
			if (disabled || !over) {
				return;
			}

			if (useBuckets && buckets && onReorderBuckets) {
				const activeKey = String(active.id);
				// Persist the live placeholder. Recomputing from the drop
				// target shifts the item by one because over-id and
				// insertAfter can change on pointerup.
				const sourceBuckets = liveBuckets || buckets;
				const fromParent = findBucketParent(activeKey, buckets, getId);
				const liveParent = findBucketParent(
					activeKey,
					sourceBuckets,
					getId
				);
				if (!fromParent || !liveParent) {
					return;
				}
				if (bucketOrdersEqual(sourceBuckets, buckets, getId)) {
					return;
				}
				const current = sourceBuckets.map((bucket) => ({
					parentId: bucket.parentId,
					ids: bucket.items.map(getId),
				}));
				const dest = current.find(
					(bucket) => bucket.parentId === liveParent
				);
				onReorderBuckets({
					buckets: current,
					move:
						fromParent !== liveParent
							? {
									sectionId: activeKey,
									toParentId: liveParent,
									index: dest
										? dest.ids.indexOf(activeKey)
										: 0,
								}
							: undefined,
				});
				return;
			}

			if (active.id === over.id) {
				return;
			}
			const activeKey = String(active.id);
			const overKey = String(over.id);
			const from = ids.indexOf(activeKey);
			const to = ids.indexOf(overKey);
			if (from < 0 || to < 0 || from === to) {
				return;
			}
			onReorder(arrayMove(ids, from, to));
		},
		[buckets, disabled, getId, ids, onReorder, onReorderBuckets, useBuckets]
	);

	const onDragCancel = useCallback(() => {
		setActiveId(null);
		setOverlayWidth(null);
		setDraftBuckets(null);
	}, []);

	const activeItem = activeId
		? allItems.find((item) => getId(item) === activeId)
		: undefined;

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={DND_MODIFIERS}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragEnd={onDragEnd}
			onDragCancel={onDragCancel}
		>
			{useBuckets && displayBuckets ? (
				<div
					className="blockera-templates-builder-sortable-list"
					data-test={dataTest}
				>
					{displayBuckets.map((bucket, index) => (
						<div key={bucket.parentId}>
							{index > 0 && (
								<hr className="blockera-templates-builder-sortable-list__separator" />
							)}
							<ParentName label={bucket.label} />
							<BucketList
								parentId={bucket.parentId}
								items={bucket.items}
								getId={getId}
								disabled={disabled}
								renderItem={renderItem}
							/>
						</div>
					))}
				</div>
			) : (
				<SortableContext
					items={ids}
					strategy={verticalListSortingStrategy}
					disabled={disabled}
				>
					<div
						className="blockera-templates-builder-sortable-list"
						data-test={dataTest}
					>
						<ParentName label={listLabel} />
						{items.map((item) => {
							const id = getId(item);
							return (
								<SortableRow
									key={id}
									id={id}
									item={item}
									disabled={disabled}
									renderItem={renderItem}
								/>
							);
						})}
					</div>
				</SortableContext>
			)}
			{createPortal(
				<DragOverlay dropAnimation={null} zIndex={100000}>
					{activeItem ? (
						<div
							className="blockera-templates-builder-sortable-list__overlay"
							style={
								overlayWidth
									? { width: overlayWidth }
									: undefined
							}
						>
							{renderItem(activeItem, {
								dragHandle: (
									<span
										className="blockera-site-editor-gateway-row__drag-handle"
										aria-hidden="true"
									>
										{HANDLE_ICON}
									</span>
								),
								isDragging: true,
							})}
						</div>
					) : null}
				</DragOverlay>,
				document.body
			)}
		</DndContext>
	);
}
