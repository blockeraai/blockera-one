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
	useSensor,
	useSensors,
	type DragEndEvent,
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

export type SortableElementListProps<T> = {
	items: T[];
	getId: (item: T) => string;
	onReorder: (orderedIds: string[]) => void;
	renderItem: (item: T, props: SortableElementRenderProps) => ReactNode;
	disabled?: boolean;
	'data-test'?: string;
};

const TOGGLE_IGNORE = '.blockera-site-editor-gateway-row__toggle';

/**
 * Same as PointerSensor, but ignore the presence toggle so a click/drag
 * there cannot start a reorder.
 */
class RowPointerSensor extends PointerSensor {
	static activators = [
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

export default function SortableElementList<T>({
	items,
	getId,
	onReorder,
	renderItem,
	disabled,
	'data-test': dataTest,
}: SortableElementListProps<T>) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [overlayWidth, setOverlayWidth] = useState<number | null>(null);

	const ids = useMemo(() => items.map(getId), [items, getId]);

	const sensors = useSensors(
		useSensor(RowPointerSensor, POINTER_SENSOR_OPTIONS),
		useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS)
	);

	const onDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(String(event.active.id));
		const rect = event.active.rect.current.initial;
		setOverlayWidth(rect?.width ?? null);
	}, []);

	const onDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			setActiveId(null);
			setOverlayWidth(null);
			if (disabled || !over || active.id === over.id) {
				return;
			}
			const from = ids.indexOf(String(active.id));
			const to = ids.indexOf(String(over.id));
			if (from < 0 || to < 0 || from === to) {
				return;
			}
			onReorder(arrayMove(ids, from, to));
		},
		[disabled, ids, onReorder]
	);

	const onDragCancel = useCallback(() => {
		setActiveId(null);
		setOverlayWidth(null);
	}, []);

	const activeItem = activeId
		? items.find((item) => getId(item) === activeId)
		: undefined;

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={DND_MODIFIERS}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onDragCancel={onDragCancel}
		>
			<SortableContext
				items={ids}
				strategy={verticalListSortingStrategy}
				disabled={disabled}
			>
				<div
					className="blockera-templates-builder-sortable-list"
					data-test={dataTest}
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
