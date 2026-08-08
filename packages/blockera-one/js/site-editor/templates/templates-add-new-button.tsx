/**
 * Header “Add template” action for Custom browse — public APIs only.
 * Opens a create-custom-template modal (same button chrome as core PageTemplates).
 */

import {
	Button,
	Modal,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	FILTER_IDS,
	TEMPLATE_POST_TYPE,
	buildTemplateItemPath,
	navigateTemplates,
	type FilterId,
} from './constants';

function slugifyTemplateTitle(title: string): string {
	const slug = title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug || 'wp-custom-template';
}

function AddCustomTemplateModal({
	onClose,
	browseFilter,
}: {
	onClose: () => void;
	browseFilter: FilterId;
}) {
	const [title, setTitle] = useState('');
	const [isBusy, setIsBusy] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const defaultTitle = __('Custom Template', 'blockera');

	const { saveEntityRecord } = useDispatch(coreStore) as {
		saveEntityRecord: (
			kind: string,
			name: string,
			record: Record<string, unknown>,
			options?: { throwOnError?: boolean }
		) => Promise<{ id?: string | number; title?: unknown }>;
	};
	const { createSuccessNotice, createErrorNotice } = useDispatch(
		noticesStore
	) as {
		createSuccessNotice: (msg: string, opts?: { type?: string }) => void;
		createErrorNotice: (msg: string, opts?: { type?: string }) => void;
	};

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const onCreate = async (event: { preventDefault: () => void }) => {
		event.preventDefault();
		if (isBusy) {
			return;
		}
		setIsBusy(true);
		const resolvedTitle = title.trim() || defaultTitle;
		const slug = slugifyTemplateTitle(resolvedTitle);

		try {
			// is_wp_suggestion: false → custom page template (is_custom).
			const newTemplate = await saveEntityRecord(
				'postType',
				TEMPLATE_POST_TYPE,
				{
					slug,
					title: resolvedTitle,
					status: 'publish',
					meta: {
						is_wp_suggestion: false,
					},
				},
				{ throwOnError: true }
			);

			createSuccessNotice(
				sprintf(
					/* translators: %s: template title */
					__('"%s" successfully created.', 'blockera'),
					decodeEntities(
						(typeof newTemplate.title === 'object' &&
						newTemplate.title &&
						'rendered' in (newTemplate.title as object)
							? (newTemplate.title as { rendered?: string })
									.rendered
							: (newTemplate.title as string)) || resolvedTitle
					) || __('(no title)', 'blockera')
				),
				{ type: 'snackbar' }
			);

			onClose();

			if (newTemplate.id !== undefined) {
				navigateTemplates(buildTemplateItemPath(newTemplate.id), {
					filter: browseFilter,
					partsArea: null,
					activeView: null,
					canvas: 'edit',
				});
			}
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
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<Modal
			title={__('Add template', 'blockera')}
			onRequestClose={onClose}
			size="small"
			className="edit-site-add-new-template__modal"
		>
			<form onSubmit={onCreate}>
				<VStack spacing={6}>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={__('Name', 'blockera')}
						value={title}
						onChange={setTitle}
						placeholder={defaultTitle}
						disabled={isBusy}
						ref={inputRef}
						help={__(
							'Describe the template, e.g. "Post with sidebar". A custom template can be manually applied to any post or page.',
							'blockera'
						)}
					/>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={onClose}
							disabled={isBusy}
						>
							{__('Cancel', 'blockera')}
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
							isBusy={isBusy}
							aria-disabled={isBusy}
						>
							{__('Create', 'blockera')}
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}

type TemplatesAddNewButtonProps = {
	/** Filter preserved when navigating after create. */
	browseFilter?: FilterId;
};

/**
 * Primary header action matching core PageTemplates Add button.
 */
export default function TemplatesAddNewButton({
	browseFilter = FILTER_IDS.custom,
}: TemplatesAddNewButtonProps) {
	const [showModal, setShowModal] = useState(false);

	const addNewLabel = useSelect((select) => {
		const postType = (
			select(coreStore) as {
				getPostType: (
					name: string
				) => { labels?: { add_new_item?: string } } | undefined;
			}
		).getPostType(TEMPLATE_POST_TYPE);
		return postType?.labels?.add_new_item || __('Add Template', 'blockera');
	}, []);

	return (
		<>
			<Button
				variant="primary"
				onClick={() => setShowModal(true)}
				label={addNewLabel}
				size="compact"
				__next40pxDefaultSize
				data-test="blockera-site-editor-templates-add"
			>
				{addNewLabel}
			</Button>
			{showModal ? (
				<AddCustomTemplateModal
					onClose={() => setShowModal(false)}
					browseFilter={browseFilter}
				/>
			) : null}
		</>
	);
}
