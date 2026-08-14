/**
 * Header “Add template” action for Custom browse — public APIs only.
 * Opens a create-custom-template modal (same button chrome as core PageTemplates).
 */

import { Button, Modal, TextControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { Flex } from '@blockera/controls';

/**
 * Internal dependencies
 */
import { FILTER_IDS, TEMPLATE_POST_TYPE, type FilterId } from './constants';
import useCreateTemplateAndOpen from './use-create-template';

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
	const defaultTitle = __('Custom Template', 'blockera');

	const createTemplateAndOpen = useCreateTemplateAndOpen();

	const onCreate = async (event: { preventDefault: () => void }) => {
		event.preventDefault();
		if (isBusy) {
			return;
		}
		setIsBusy(true);
		const resolvedTitle = title.trim() || defaultTitle;
		const slug = slugifyTemplateTitle(resolvedTitle);

		// is_wp_suggestion: false → custom page template (is_custom).
		await createTemplateAndOpen({
			record: {
				slug,
				title: resolvedTitle,
				meta: {
					is_wp_suggestion: false,
				},
			},
			fallbackTitle: resolvedTitle,
			filter: browseFilter,
			onSuccess: onClose,
		});
		setIsBusy(false);
	};

	return (
		<Modal
			title={__('Add template', 'blockera')}
			onRequestClose={onClose}
			size="small"
			focusOnMount="firstContentElement"
			className="edit-site-add-new-template__modal"
		>
			<form onSubmit={onCreate}>
				<Flex direction="column" gap="24px">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={__('Name', 'blockera')}
						value={title}
						onChange={setTitle}
						placeholder={defaultTitle}
						disabled={isBusy}
						help={__(
							'Describe the template, e.g. "Post with sidebar". A custom template can be manually applied to any post or page.',
							'blockera'
						)}
					/>
					<Flex
						gap="8px"
						alignItems="center"
						justifyContent="flex-end"
					>
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
					</Flex>
				</Flex>
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
		const { getPostType } = select(coreStore) as unknown as {
			getPostType: (
				name: string
			) => { labels?: { add_new_item?: string } } | undefined;
		};
		return (
			getPostType(TEMPLATE_POST_TYPE)?.labels?.add_new_item ||
			__('Add Template', 'blockera')
		);
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
