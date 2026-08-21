/**
 * Multi-parent bucket math for Templates Builder sortable lists.
 */

import { arrayMove } from '@dnd-kit/sortable';

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

const BUCKET_PREFIX = 'bucket:';

export function bucketDroppableId(parentId: string): string {
	return `${BUCKET_PREFIX}${parentId}`;
}

export function parseBucketDroppableId(id: string): string | null {
	return id.startsWith(BUCKET_PREFIX) ? id.slice(BUCKET_PREFIX.length) : null;
}

export function findBucketParent<T>(
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

export function cloneBuckets<T>(
	source: SortableBucket<T>[]
): SortableBucket<T>[] {
	return source.map((bucket) => ({
		parentId: bucket.parentId,
		items: bucket.items.slice(),
		label: bucket.label,
	}));
}

export function shouldInsertAfter(
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

export function bucketOrdersEqual<T>(
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

export function moveItemBetweenBuckets<T>(
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
