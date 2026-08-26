/**
 * Shared typed access to the edited `root/site` entity record.
 * Panels persist through the Site Editor native Save Hub.
 */

import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

export default function useEditedSiteRecord<
	T extends Record<string, unknown>,
>(): {
	record: T | undefined;
	editSite: (edits: Partial<T>) => void;
} {
	const record = useSelect((select) => {
		const { getEditedEntityRecord } = select(coreStore) as unknown as {
			getEditedEntityRecord: (
				kind: string,
				name: string
			) => T | undefined;
		};
		return getEditedEntityRecord('root', 'site');
	}, []);

	const { editEntityRecord } = useDispatch(coreStore) as unknown as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: undefined,
			edits: Partial<T>
		) => void;
	};

	const editSite = useCallback(
		(edits: Partial<T>) => {
			editEntityRecord('root', 'site', undefined, edits);
		},
		[editEntityRecord]
	);

	return { record, editSite };
}
