/**
 * URL-backed nested panel stack (configurable query key).
 */

import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSiteEditorNavigate } from '../utils';
import { pushPanelStackQuery, readPanelStack } from './url-stack';

type UseUrlPanelStackArgs = {
	queryKey: string;
};

export type UrlPanelStackApi = {
	stack: string[];
	push: (segment: string) => void;
	pop: () => void;
	clear: () => void;
	/** Replace the entire stack (e.g. reset invalid path). */
	replace: (next: string[]) => void;
};

/**
 * Sync a slash panel stack to a URL query key. Forward pushes animate enter;
 * pop / clear use back (no enter animation).
 */
export default function useUrlPanelStack({
	queryKey,
}: UseUrlPanelStackArgs): UrlPanelStackApi {
	const [stack, setStack] = useState<string[]>(() =>
		readPanelStack(queryKey)
	);

	const sync = useCallback(() => {
		setStack(readPanelStack(queryKey));
	}, [queryKey]);

	useSiteEditorNavigate(sync);

	useEffect(() => {
		sync();
	}, [sync]);

	const push = useCallback(
		(segment: string) => {
			if (!segment) {
				return;
			}
			const next = [...readPanelStack(queryKey), segment];
			pushPanelStackQuery(queryKey, next, { direction: 'forward' });
		},
		[queryKey]
	);

	const pop = useCallback(() => {
		const current = readPanelStack(queryKey);
		if (!current.length) {
			return;
		}
		pushPanelStackQuery(queryKey, current.slice(0, -1), {
			direction: 'back',
		});
	}, [queryKey]);

	const clear = useCallback(() => {
		pushPanelStackQuery(queryKey, [], { direction: 'back' });
	}, [queryKey]);

	const replace = useCallback(
		(next: string[]) => {
			pushPanelStackQuery(queryKey, next, { direction: 'back' });
		},
		[queryKey]
	);

	return { stack, push, pop, clear, replace };
}
