/**
 * One Site Editor visit bag. Cleared only when this provider unmounts.
 * The store is a module singleton: route sidebars are not React children
 * of this provider.
 */

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from '@wordpress/element';

import type { EditorSessionApi } from './bag';
import {
	getVisitSession,
	resetVisitSession,
	subscribeVisitSession,
} from './visit';

type ProviderProps = {
	children: ReactNode;
};

export function EditorSessionProvider({ children }: ProviderProps) {
	useEffect(() => {
		return () => {
			resetVisitSession();
		};
	}, []);
	return children;
}

export function useEditorSession(): EditorSessionApi {
	const [version, setVersion] = useState(0);
	useEffect(() => {
		return subscribeVisitSession(() => {
			setVersion((n) => n + 1);
		});
	}, []);
	// New wrapper per notify so list freeze memos can depend on `session`
	// without cloning the bag on every parent render.
	return useMemo(() => {
		void version;
		const api = getVisitSession();
		return {
			get: api.get,
			set: api.set,
			ensure: api.ensure,
			delete: api.delete,
		};
	}, [version]);
}
