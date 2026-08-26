/**
 * Nested builder panel stack backed by `blockera-builder` (prefix-aware).
 */

import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { UrlPanelStackApi } from '../nested-panels';
import { useSiteEditorNavigate } from '../utils';
import { navigateTemplates } from './navigate-templates';
import { getTemplatesUrlState } from './templates-url';

/**
 * Read/write the nested options stack without dropping the purpose or parts-hub
 * prefix on `blockera-builder`.
 */
export default function useTemplatesBuilderStack(): UrlPanelStackApi {
	const [stack, setStack] = useState<string[]>(
		() => getTemplatesUrlState().optionsPanel
	);

	const sync = useCallback(() => {
		setStack(getTemplatesUrlState().optionsPanel);
	}, []);

	useSiteEditorNavigate(sync);

	const write = useCallback(
		(next: string[], direction: 'forward' | 'back') => {
			const { path, filter, partsArea } = getTemplatesUrlState();
			navigateTemplates(path, {
				filter,
				partsArea,
				optionsPanel: next,
				direction,
			});
		},
		[]
	);

	const push = useCallback(
		(segment: string) => {
			if (!segment) {
				return;
			}
			write([...getTemplatesUrlState().optionsPanel, segment], 'forward');
		},
		[write]
	);

	const pop = useCallback(() => {
		const current = getTemplatesUrlState().optionsPanel;
		if (!current.length) {
			return;
		}
		write(current.slice(0, -1), 'back');
	}, [write]);

	const clear = useCallback(() => {
		write([], 'back');
	}, [write]);

	const replace = useCallback(
		(next: string[]) => {
			write(next, 'back');
		},
		[write]
	);

	return { stack, push, pop, clear, replace };
}
