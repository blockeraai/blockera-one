/**
 * Right-pane empty state when a purpose filter’s base template is missing.
 * Shows hierarchy fallback (clickable) + “Add specific template” (core create flow).
 */

import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Blockera dependencies
 */
import { Flex } from '@blockera/controls';

/**
 * Internal dependencies
 */
import '../admin-ui-card.scss';
import { ROUTES } from '../constants';
import {
	TEMPLATE_POST_TYPE,
	buildTemplateItemPath,
	getCoreActiveViewForFilter,
	navigateTemplates,
	type FilterId,
} from './constants';
import {
	findExistingFallbackSlug,
	getBaseSlugForFilter,
	getFilterIdForSlug,
	getTemplateTitle,
	type TemplateLike,
} from './templates-matchers';
import useTemplatesData from './use-templates-data';

type TemplatesMissingBaseProps = {
	filter: FilterId;
};

function getTypeLabel(
	slug: string,
	defaultTypes: Array<{ slug: string; title?: string }>
): string {
	const match = defaultTypes.find((type) => type.slug === slug);
	if (match?.title) {
		return match.title;
	}
	return slug;
}

export default function TemplatesMissingBase({
	filter,
}: TemplatesMissingBaseProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { findBySlug } = useTemplatesData();
	const baseSlug = getBaseSlugForFilter(filter);

	const defaultTypes = useSelect((select) => {
		const theme = (
			select(coreStore) as {
				getCurrentTheme: () => {
					default_template_types?: Array<{
						slug: string;
						title?: string;
						description?: string;
					}>;
				};
			}
		).getCurrentTheme();
		return theme?.default_template_types || [];
	}, []);

	const { saveEntityRecord } = useDispatch(coreStore) as {
		saveEntityRecord: (
			kind: string,
			name: string,
			record: Record<string, unknown>,
			options?: { throwOnError?: boolean }
		) => Promise<TemplateLike>;
	};
	const { createSuccessNotice, createErrorNotice } = useDispatch(
		noticesStore
	) as {
		createSuccessNotice: (msg: string, opts?: { type?: string }) => void;
		createErrorNotice: (msg: string, opts?: { type?: string }) => void;
	};

	if (!baseSlug) {
		return null;
	}

	const fallbackSlug = findExistingFallbackSlug(baseSlug, findBySlug);
	const fallbackTemplate = fallbackSlug
		? findBySlug(fallbackSlug)
		: undefined;
	let fallbackLabel = '';
	if (fallbackTemplate) {
		fallbackLabel = getTemplateTitle(fallbackTemplate);
	} else if (fallbackSlug) {
		fallbackLabel = getTypeLabel(fallbackSlug, defaultTypes);
	}

	const missingLabel = getTypeLabel(baseSlug, defaultTypes);

	const openFallbackFilter = () => {
		if (!fallbackSlug) {
			return;
		}
		const nextFilter = getFilterIdForSlug(fallbackSlug);
		const base = findBySlug(fallbackSlug);
		if (base?.id !== undefined) {
			navigateTemplates(buildTemplateItemPath(base.id), {
				filter: nextFilter,
				partsArea: null,
				activeView: null,
			});
			return;
		}
		navigateTemplates(ROUTES.templates, {
			filter: nextFilter,
			partsArea: null,
			activeView: getCoreActiveViewForFilter(nextFilter),
		});
	};

	const createSpecificTemplate = async () => {
		if (isSubmitting) {
			return;
		}
		setIsSubmitting(true);
		const typeInfo = defaultTypes.find((type) => type.slug === baseSlug);
		const title = typeInfo?.title || missingLabel;
		const description = typeInfo?.description || '';

		try {
			const newTemplate = await saveEntityRecord(
				'postType',
				TEMPLATE_POST_TYPE,
				{
					description,
					slug: String(baseSlug),
					status: 'publish',
					title,
					meta: {
						is_wp_suggestion: true,
					},
				},
				{ throwOnError: true }
			);

			createSuccessNotice(
				sprintf(
					/* translators: %s: template title */
					__('"%s" successfully created.', 'blockera'),
					decodeEntities(
						(typeof newTemplate.title === 'object'
							? newTemplate.title?.rendered
							: newTemplate.title) || title
					) || __('(no title)', 'blockera')
				),
				{ type: 'snackbar' }
			);

			if (newTemplate.id !== undefined) {
				navigateTemplates(buildTemplateItemPath(newTemplate.id), {
					filter,
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
			setIsSubmitting(false);
		}
	};

	const message = fallbackSlug
		? createInterpolateElement(
				sprintf(
					/* translators: 1: missing template type name, 2: fallback template title */
					__(
						'There is no specific <strong>%1$s</strong> template. This view uses <link>%2$s</link> instead.',
						'blockera'
					),
					missingLabel,
					fallbackLabel
				),
				{
					strong: <strong />,
					link: (
						// eslint-disable-next-line jsx-a11y/anchor-has-content -- children from interpolate
						<Button
							variant="link"
							className="blockera-site-editor-templates-missing__fallback-link"
							onClick={openFallbackFilter}
						/>
					),
				}
			)
		: sprintf(
				/* translators: %s: missing template type */
				__(
					'There is no specific %s template, and no fallback template was found.',
					'blockera'
				),
				missingLabel
			);

	return (
		<div
			className="blockera-site-editor-templates-missing blockera-se-admin-ui-card admin-ui-page"
			data-test="blockera-site-editor-templates-missing"
		>
			<div className="admin-ui-page__header">
				<div className="admin-ui-page__header-content">
					<h2 className="admin-ui-page__header-title">
						{missingLabel}
					</h2>
				</div>
			</div>
			<div className="admin-ui-page__content has-padding">
				<Flex direction="column" gap="16px" alignItems="flex-start">
					<p className="blockera-site-editor-templates-missing__message">
						{message}
					</p>
					<Button
						variant="primary"
						onClick={createSpecificTemplate}
						disabled={isSubmitting}
						data-test="blockera-site-editor-templates-add-specific"
					>
						{isSubmitting
							? __('Creating…', 'blockera')
							: __('Add a specific template', 'blockera')}
					</Button>
				</Flex>
			</div>
		</div>
	);
}
