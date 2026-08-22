/**
 * React session freeze for orderable lists. Lives above DrillDownScreen
 * remounts (`key={screenKey}`) so inner navigation does not re-partition.
 */

import type { ReactNode } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useState,
} from '@wordpress/element';

import type { ElementBucket } from './element-order';
import type { PanelGroupDef } from './types';
import {
	collectInnerOrderSurfaces,
	pruneFrozenOrders,
	type FrozenOrders,
} from './sortable-order-freeze';

export type SortableOrderFreezeApi = {
	get: (key: string) => ElementBucket[] | undefined;
	ensure: (key: string, buckets: ElementBucket[]) => void;
	set: (key: string, buckets: ElementBucket[]) => void;
};

const SortableOrderFreezeContext = createContext<SortableOrderFreezeApi>({
	get: () => undefined,
	ensure: () => undefined,
	set: () => undefined,
});

type ProviderProps = {
	groups: PanelGroupDef[];
	stack: string[];
	children: ReactNode;
};

export function SortableOrderFreezeProvider({
	groups,
	stack,
	children,
}: ProviderProps) {
	const surfaces = useMemo(() => collectInnerOrderSurfaces(groups), [groups]);
	const [frozen, setFrozen] = useState<FrozenOrders>({});

	useLayoutEffect(() => {
		setFrozen((prev) => pruneFrozenOrders(prev, surfaces, stack));
	}, [stack, surfaces]);

	const get = useCallback((key: string) => frozen[key], [frozen]);
	const ensure = useCallback((key: string, buckets: ElementBucket[]) => {
		setFrozen((prev) => (prev[key] ? prev : { ...prev, [key]: buckets }));
	}, []);
	const set = useCallback((key: string, buckets: ElementBucket[]) => {
		setFrozen((prev) => ({ ...prev, [key]: buckets }));
	}, []);

	const value = useMemo(() => ({ get, ensure, set }), [get, ensure, set]);

	return (
		<SortableOrderFreezeContext.Provider value={value}>
			{children}
		</SortableOrderFreezeContext.Provider>
	);
}

export function useSortableOrderFreeze(): SortableOrderFreezeApi {
	return useContext(SortableOrderFreezeContext);
}
