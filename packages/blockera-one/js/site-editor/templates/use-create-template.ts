/**
 * Shared create-template flow: saveEntityRecord + snackbar notices + open the
 * new template canvas. Dedupes TemplatesAddNewButton and TemplatesMissingBase.
 */

import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_POST_TYPE,
	buildTemplateItemPath,
	navigateTemplates,
	type FilterId,
} from './constants';

type CreatedTemplate = {
	id?: string | number;
	title?: string | { rendered?: string } | null;
};

export type CreateTemplateAndOpenArgs = {
	/** wp_template fields (slug, title, meta, …); `status: 'publish'` is added. */
	record: Record<string, unknown>;
	/** Success-notice fallback when the API returns no title. */
	fallbackTitle: string;
	/** Filter query preserved on the new template canvas. */
	filter?: FilterId | null;
	/** Runs after the success notice, before navigation (e.g. close modal). */
	onSuccess?: () => void;
};

function getCreatedTitle(template: CreatedTemplate): string | undefined {
	if (typeof template.title === 'object' && template.title) {
		return template.title.rendered;
	}
	return (template.title as string | undefined) || undefined;
}

export default function useCreateTemplateAndOpen(): (
	args: CreateTemplateAndOpenArgs
) => Promise<boolean> {
	const { saveEntityRecord } = useDispatch(coreStore) as unknown as {
		saveEntityRecord: (
			kind: string,
			name: string,
			record: Record<string, unknown>,
			options?: { throwOnError?: boolean }
		) => Promise<CreatedTemplate>;
	};
	const { createSuccessNotice, createErrorNotice } = useDispatch(
		noticesStore
	) as unknown as {
		createSuccessNotice: (msg: string, opts?: { type?: string }) => void;
		createErrorNotice: (msg: string, opts?: { type?: string }) => void;
	};

	return async ({
		record,
		fallbackTitle,
		filter,
		onSuccess,
	}: CreateTemplateAndOpenArgs): Promise<boolean> => {
		try {
			const newTemplate = await saveEntityRecord(
				'postType',
				TEMPLATE_POST_TYPE,
				{ status: 'publish', ...record },
				{ throwOnError: true }
			);

			createSuccessNotice(
				sprintf(
					/* translators: %s: template title */
					__('"%s" successfully created.', 'blockera'),
					decodeEntities(
						getCreatedTitle(newTemplate) || fallbackTitle
					) || __('(no title)', 'blockera')
				),
				{ type: 'snackbar' }
			);

			onSuccess?.();

			if (newTemplate.id !== undefined) {
				navigateTemplates(buildTemplateItemPath(newTemplate.id), {
					filter,
					partsArea: null,
					activeView: null,
					canvas: 'edit',
				});
			}
			return true;
		} catch (error) {
			const err = error as { message?: string; code?: string };
			createErrorNotice(
				err?.message && err.code !== 'unknown_error'
					? err.message
					: __(
							'An error occurred while creating the template.',
							'blockera'
						),
				{ type: 'snackbar' }
			);
			return false;
		}
	};
}
