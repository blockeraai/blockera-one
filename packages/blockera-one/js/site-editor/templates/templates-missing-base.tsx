/**
 * Right-pane empty state when a purpose filter’s base template is missing.
 * Shows hierarchy fallback (clickable) + “Add specific template” (core create flow).
 */

import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { DynamicHtmlFormatter } from '@blockera/controls';

/**
 * Internal dependencies
 */
import GroupCard from '../components/group-card';
import { ROUTES } from '../constants';
import {
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
} from './templates-matchers';
import useCreateTemplateAndOpen from './use-create-template';
import useTemplatesData from './use-templates-data';
import './templates-missing-base.scss';

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
			select(coreStore) as unknown as {
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

	const createTemplateAndOpen = useCreateTemplateAndOpen();

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

		await createTemplateAndOpen({
			record: {
				description,
				slug: String(baseSlug),
				title,
				meta: {
					is_wp_suggestion: true,
				},
			},
			fallbackTitle: title,
			filter,
		});
		setIsSubmitting(false);
	};

	const message = fallbackSlug ? (
		<DynamicHtmlFormatter
			text={sprintf(
				/* translators: 1: missing template type name, 2: fallback template title */
				__(
					'There is no specific %1$s template. This view uses %2$s instead.',
					'blockera'
				),
				'{missing}',
				'{fallback}'
			)}
			replacements={{
				missing: <strong>{missingLabel}</strong>,
				fallback: (
					<Button
						variant="link"
						className="blockera-site-editor-templates-missing__fallback-link"
						data-test="blockera-site-editor-templates-missing-fallback"
						onClick={openFallbackFilter}
					>
						{fallbackLabel}
					</Button>
				),
			}}
		/>
	) : (
		sprintf(
			/* translators: %s: missing template type */
			__(
				'There is no specific %s template, and no fallback template was found.',
				'blockera'
			),
			missingLabel
		)
	);

	return (
		<GroupCard
			as="div"
			title={missingLabel}
			className="blockera-site-editor-templates-missing"
			data-test="blockera-site-editor-templates-missing"
		>
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
		</GroupCard>
	);
}
