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
	PointerSensor,
	closestCenter,
	useDroppable,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	type Modifier,
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	createPortal,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { Icon, dragHandle } from '@wordpress/icons';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';

export type SortableElementRenderProps = {
	dragHandle: ReactNode;
	isDragging: boolean;
};

export type SortableBucket<T> = {
	parentId: string;
	items: T[];
	/** Live parent `metadata.name` when `showParentNames` is on. */
	label?: string;
};

export type BucketReorderPayload = {
	buckets: Array<{ parentId: string; ids: string[] }>;
	move?: {
		sectionId: string;
		toParentId: string;
		index: number;
	};
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

const BUCKET_PREFIX = 'bucket:';

function bucketDroppableId(parentId: string): string {
	return `${BUCKET_PREFIX}${parentId}`;
}

function parseBucketDroppableId(id: string): string | null {
	return id.startsWith(BUCKET_PREFIX) ? id.slice(BUCKET_PREFIX.length) : null;
}

const TOGGLE_IGNORE = '.blockera-site-editor-gateway-row__toggle';

/**
 * Same as PointerSensor, but ignore the presence toggle so a click/drag
 * there cannot start a reorder.
 */
class RowPointerSensor extends PointerSensor {
	static override activators = [
		{
			eventName: 'onPointerDown' as const,
			handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
				if (!nativeEvent.isPrimary || nativeEvent.button !== 0) {
					return false;
				}
				const target = nativeEvent.target as HTMLElement | null;
				return !target?.closest(TOGGLE_IGNORE);
			},
		},
	];
}

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
	...transform,
	x: 0,
});

const DND_MODIFIERS = [restrictToVerticalAxis];

const POINTER_SENSOR_OPTIONS = {
	// Delay so a quick press stays a click; tolerance lets the
	// pointer move a bit during the hold without cancelling.
	activationConstraint: { delay: 100, tolerance: 100 },
};

const KEYBOARD_SENSOR_OPTIONS = {
	coordinateGetter: sortableKeyboardCoordinates,
};

const HANDLE_ICON = <Icon icon={dragHandle} size={18} />;

type SortableRowProps<T> = {
	id: string;
	item: T;
	disabled?: boolean;
	renderItem: SortableElementListProps<T>['renderItem'];
};

function SortableRow<T>({
	id,
	item,
	disabled,
	renderItem,
}: SortableRowProps<T>) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id,
		disabled,
	});

	// A completed drag can still emit a click on pointerup. Swallow that
	// once so drop does not open the nested panel. Clear after cancel too,
	// otherwise the next real click is lost.
	const didDrag = useRef(false);
	useEffect(() => {
		if (isDragging) {
			didDrag.current = true;
			return;
		}
		const timer = window.setTimeout(() => {
			didDrag.current = false;
		}, 0);
		return () => window.clearTimeout(timer);
	}, [isDragging]);

	const handle = (
		<span
			className="blockera-site-editor-gateway-row__drag-handle"
			aria-hidden="true"
			data-test={`blockera-templates-builder-drag-${id}`}
			onClick={(event) => {
				event.preventDefault();
				event.stopPropagation();
			}}
		>
			{HANDLE_ICON}
		</span>
	);

	return (
		<div
			ref={setNodeRef}
			className={classNames(
				'blockera-templates-builder-sortable-list__item',
				{ 'is-dragging': isDragging }
			)}
			style={{
				transform: CSS.Transform.toString(
					transform ? { ...transform, scaleX: 1, scaleY: 1 } : null
				),
				transition,
			}}
			{...attributes}
			{...listeners}
			onClickCapture={(event) => {
				if (!didDrag.current) {
					return;
				}
				didDrag.current = false;
				event.preventDefault();
				event.stopPropagation();
			}}
		>
			{renderItem(item, {
				dragHandle: handle,
				isDragging,
			})}
		</div>
	);
}

type BucketListProps<T> = {
	parentId: string;
	items: T[];
	getId: (item: T) => string;
	disabled?: boolean;
	renderItem: SortableElementListProps<T>['renderItem'];
};

function BucketList<T>({
	parentId,
	items,
	getId,
	disabled,
	renderItem,
}: BucketListProps<T>) {
	const ids = items.map(getId);
	const { setNodeRef, isOver } = useDroppable({
		id: bucketDroppableId(parentId),
		disabled,
	});

	return (
		<SortableContext
			items={ids}
			strategy={verticalListSortingStrategy}
			disabled={disabled}
		>
			<div
				ref={setNodeRef}
				className={classNames(
					'blockera-templates-builder-sortable-list__bucket',
					{
						'is-empty': items.length === 0,
						'is-over': isOver,
					}
				)}
				data-test={`blockera-templates-builder-bucket-${parentId}`}
			>
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
	);
}

function findBucketParent<T>(
	id: string,
	buckets: SortableBucket<T>[],
	getId: (item: T) => string
): string | null {
	const droppable = parseBucketDroppableId(id);
	if (droppable) {
		return droppable;
	}
	for (let i = 0; i < buckets.length; i++) {
		const bucket = buckets[i];
		for (let j = 0; j < bucket.items.length; j++) {
			if (getId(bucket.items[j]) === id) {
				return bucket.parentId;
			}
		}
	}
	return null;
}

function cloneBuckets<T>(source: SortableBucket<T>[]): SortableBucket<T>[] {
	return source.map((bucket) => ({
		parentId: bucket.parentId,
		items: bucket.items.slice(),
		label: bucket.label,
	}));
}

function ParentName({ label }: { label?: string }) {
	if (!label) {
		return null;
	}
	return (
		<div
			className="blockera-templates-builder-sortable-list__parent-name"
			data-test="blockera-templates-builder-parent-name"
		>
			{label}
		</div>
	);
}

function shouldInsertAfter(
	active: {
		rect: {
			current: {
				initial: { top: number; height: number } | null;
				translated: { top: number; height?: number } | null;
			};
		};
	},
	over: { rect: { top: number; height: number } } | null,
	delta?: { y: number }
): boolean {
	if (!over) {
		return false;
	}
	const initial = active.rect.current.initial;
	const translated = active.rect.current.translated;
	let centerY: number | null = null;
	if (initial && delta) {
		centerY = initial.top + initial.height / 2 + delta.y;
	} else if (translated) {
		centerY = translated.top + (translated.height ?? 0) / 2;
	}
	if (centerY === null) {
		return false;
	}
	return centerY > over.rect.top + over.rect.height / 2;
}

function bucketOrdersEqual<T>(
	left: SortableBucket<T>[],
	right: SortableBucket<T>[],
	getId: (item: T) => string
): boolean {
	if (left.length !== right.length) {
		return false;
	}
	for (let i = 0; i < left.length; i++) {
		if (
			left[i].parentId !== right[i].parentId ||
			left[i].items.length !== right[i].items.length
		) {
			return false;
		}
		for (let j = 0; j < left[i].items.length; j++) {
			if (getId(left[i].items[j]) !== getId(right[i].items[j])) {
				return false;
			}
		}
	}
	return true;
}

function moveItemBetweenBuckets<T>(
	source: SortableBucket<T>[],
	activeKey: string,
	overKey: string,
	getId: (item: T) => string,
	insertAfter = false
): SortableBucket<T>[] | null {
	if (activeKey === overKey) {
		return null;
	}
	const fromParent = findBucketParent(activeKey, source, getId);
	const toParent = findBucketParent(overKey, source, getId);
	if (!fromParent || !toParent) {
		return null;
	}
	const next = cloneBuckets(source);
	const fromBucket = next.find((bucket) => bucket.parentId === fromParent);
	const toBucket = next.find((bucket) => bucket.parentId === toParent);
	if (!fromBucket || !toBucket) {
		return null;
	}
	if (fromParent === toParent) {
		// Same group: drop on a row takes that row's index (dnd-kit arrayMove).
		if (parseBucketDroppableId(overKey)) {
			return null;
		}
		const from = fromBucket.items.findIndex(
			(entry) => getId(entry) === activeKey
		);
		const to = fromBucket.items.findIndex(
			(entry) => getId(entry) === overKey
		);
		if (from < 0 || to < 0 || from === to) {
			return null;
		}
		fromBucket.items = arrayMove(fromBucket.items, from, to);
	} else {
		// Cross group: insertAfter lets a drop land after the last row.
		const itemIndex = fromBucket.items.findIndex(
			(item) => getId(item) === activeKey
		);
		if (itemIndex < 0) {
			return null;
		}
		const [item] = fromBucket.items.splice(itemIndex, 1);
		let index = toBucket.items.findIndex(
			(entry) => getId(entry) === overKey
		);
		if (parseBucketDroppableId(overKey) || index < 0) {
			index = toBucket.items.length;
		} else if (insertAfter) {
			index += 1;
		}
		toBucket.items.splice(index, 0, item);
	}
	if (bucketOrdersEqual(source, next, getId)) {
		return null;
	}
	return next;
}

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
			const liveBuckets = draftBuckets;
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
		[
			buckets,
			disabled,
			getId,
			ids,
			onReorder,
			onReorderBuckets,
			useBuckets,
			draftBuckets,
		]
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
