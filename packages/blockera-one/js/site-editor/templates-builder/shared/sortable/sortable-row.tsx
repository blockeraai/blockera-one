/**
 * Sortable row, bucket droppable, and parent-name chrome.
 */

import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef } from '@wordpress/element';
import { Icon, dragHandle } from '@wordpress/icons';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';

import { bucketDroppableId } from './sortable-buckets';

export type SortableElementRenderProps = {
	dragHandle: ReactNode;
	isDragging: boolean;
};

export const HANDLE_ICON = <Icon icon={dragHandle} size={18} />;

type SortableRowProps<T> = {
	id: string;
	item: T;
	disabled?: boolean;
	renderItem: (item: T, props: SortableElementRenderProps) => ReactNode;
};

export function SortableRow<T>({
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
	renderItem: SortableRowProps<T>['renderItem'];
};

export function BucketList<T>({
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

export function ParentName({ label }: { label?: string }) {
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
