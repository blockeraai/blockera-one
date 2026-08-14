/**
 * Canvas jump for Templates Builder “Customize in editor”: switch the Site
 * Editor canvas to edit, enter pattern edit when the target is an unsynced
 * pattern, open a parent content-only pattern if an inner block is disabled,
 * select the stamped section, and open the block inspector.
 */

import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch, select, subscribe } from '@wordpress/data';

import {
	getTemplatesUrlState,
	navigateTemplates,
} from '../../templates/constants';
import { findByStamp } from './tree';
import type { BlockNode } from './types';

/** Gutenberg complementary area id for the block inspector (unified editor). */
const BLOCK_INSPECTOR_AREA = 'edit-post/block';
const INTERFACE_STORE = 'core/interface';
const SELECT_TIMEOUT_MS = 8000;
const CANVAS_IFRAME_SELECTOR =
	'iframe[name="editor-canvas"], iframe.block-editor-iframe__iframe';

function findSectionClientId(sectionId: string): string | null {
	const getBlocks = (
		select(blockEditorStore) as unknown as {
			getBlocks?: () => BlockNode[];
		}
	).getBlocks;
	if (typeof getBlocks !== 'function') {
		return null;
	}
	const match = findByStamp(getBlocks(), (stamp) => stamp?.id === sectionId);
	return match?.block?.clientId || null;
}

type BlockEditorSelect = {
	getBlockParents?: (id: string) => string[];
	getBlockName?: (id: string) => string | undefined;
	getBlockAttributes?: (id: string) => Record<string, unknown> | undefined;
	getBlockEditingMode?: (id: string) => string | undefined;
	getTemplateLock?: (id: string) => string | false | undefined;
	getSelectedBlockClientId?: () => string | null;
	getSettings?: () => { isPreviewMode?: boolean };
	getEditedContentOnlySection?: () => string | null | undefined;
	__unstableGetTemporarilyEditingAsBlocks?: () => string | null | undefined;
};

type BlockEditorDispatch = {
	selectBlock: (id: string) => void;
	flashBlock?: (id: string, timeout: number) => void;
	editContentOnlySection?: (id: string) => void;
	stopEditingContentOnlySection?: () => void;
	__unstableSetTemporarilyEditingAsBlocks?: (id?: string) => void;
};

/**
 * Gutenberg content-only sections: unsynced patterns (`metadata.patternName`),
 * synced patterns (`core/block`), template parts, and `contentOnly` locks.
 * Inner blocks use editingMode `disabled` until the section is temporarily
 * edited (`editContentOnlySection` / `__unstableSetTemporarilyEditingAsBlocks`).
 *
 * @see source-codes/block-editor/packages/block-editor/src/store/private-selectors.js
 *      isSectionBlockCandidate
 */
function isContentOnlySectionClientId(
	sel: BlockEditorSelect,
	clientId: string
): boolean {
	const name = sel.getBlockName?.(clientId);
	if (name === 'core/block' || name === 'core/template-part') {
		return true;
	}
	const attrs = sel.getBlockAttributes?.(clientId) || {};
	const metadata = (attrs.metadata || {}) as Record<string, unknown>;
	return shouldEnterPatternEditOnTarget({
		blockName: name,
		patternName: metadata.patternName,
		templateLock: sel.getTemplateLock?.(clientId),
	});
}

/**
 * Whether Customize-in-editor should enter Gutenberg pattern edit on the
 * target itself. Matches Gutenberg’s “Edit pattern” (`editContentOnlySection`
 * + `selectBlock`). Synced patterns and template parts use isolated
 * “Edit original” instead.
 *
 * @see source-codes/block-editor/packages/block-editor/src/components/block-inspector/edit-contents.js
 *      InlineEditButton
 */
export function shouldEnterPatternEditOnTarget(params: {
	blockName?: string;
	patternName?: unknown;
	templateLock?: string | false;
}): boolean {
	const { blockName, patternName, templateLock } = params;
	if (blockName === 'core/block' || blockName === 'core/template-part') {
		return false;
	}
	if (typeof patternName === 'string' && patternName) {
		return true;
	}
	return templateLock === 'contentOnly';
}

function isUnsyncedPatternSection(
	sel: BlockEditorSelect,
	clientId: string
): boolean {
	const attrs = sel.getBlockAttributes?.(clientId) || {};
	const metadata = (attrs.metadata || {}) as Record<string, unknown>;
	return shouldEnterPatternEditOnTarget({
		blockName: sel.getBlockName?.(clientId),
		patternName: metadata.patternName,
		templateLock: sel.getTemplateLock?.(clientId),
	});
}

function getEditedContentOnlySectionId(sel: BlockEditorSelect): {
	available: boolean;
	id: string | null;
} {
	if (typeof sel.getEditedContentOnlySection === 'function') {
		return {
			available: true,
			id: sel.getEditedContentOnlySection() || null,
		};
	}
	if (typeof sel.__unstableGetTemporarilyEditingAsBlocks === 'function') {
		return {
			available: true,
			id: sel.__unstableGetTemporarilyEditingAsBlocks() || null,
		};
	}
	return { available: false, id: null };
}

function findNearestContentOnlySection(
	sel: BlockEditorSelect,
	clientId: string
): string | null {
	const parents = sel.getBlockParents?.(clientId) || [];
	for (let i = parents.length - 1; i >= 0; i--) {
		if (isContentOnlySectionClientId(sel, parents[i])) {
			return parents[i];
		}
	}
	return null;
}

/**
 * Enter Gutenberg’s temporary content-only edit on a pattern/section.
 * Feature-detects the private action if a later WP build exposes it, then
 * the public deprecated wrapper.
 */
function enterContentOnlySection(
	blockEditor: BlockEditorDispatch,
	sectionClientId: string
): void {
	if (typeof blockEditor.editContentOnlySection === 'function') {
		blockEditor.editContentOnlySection(sectionClientId);
		return;
	}
	if (
		typeof blockEditor.__unstableSetTemporarilyEditingAsBlocks ===
		'function'
	) {
		blockEditor.__unstableSetTemporarilyEditingAsBlocks(sectionClientId);
	}
}

/**
 * Leave Gutenberg content-only pattern edit. Public dispatch does not expose
 * `stopEditingContentOnlySection`; calling the unstable wrapper without a
 * clientId is the same `EDIT_CONTENT_ONLY_SECTION` action with no target.
 *
 * @see source-codes/block-editor/packages/block-editor/src/store/private-actions.js
 *      stopEditingContentOnlySection
 */
export function stopContentOnlySectionEdit(): void {
	const blockEditor = dispatch(
		blockEditorStore
	) as unknown as BlockEditorDispatch;
	if (typeof blockEditor.stopEditingContentOnlySection === 'function') {
		blockEditor.stopEditingContentOnlySection();
		return;
	}
	if (
		typeof blockEditor.__unstableSetTemporarilyEditingAsBlocks ===
		'function'
	) {
		blockEditor.__unstableSetTemporarilyEditingAsBlocks();
	}
}

function getEditorCanvasIframe(): HTMLIFrameElement | null {
	if (typeof document === 'undefined') {
		return null;
	}
	return document.querySelector(
		CANVAS_IFRAME_SELECTOR
	) as HTMLIFrameElement | null;
}

function peekSelection(sectionId: string): {
	clientId: string | null;
	alreadyOk: boolean;
} {
	const clientId = findSectionClientId(sectionId);
	const sel = select(blockEditorStore) as unknown as BlockEditorSelect;
	const selected = sel.getSelectedBlockClientId?.() || null;
	const editingMode = clientId
		? sel.getBlockEditingMode?.(clientId)
		: undefined;
	const enterOnTarget = clientId
		? isUnsyncedPatternSection(sel, clientId)
		: false;
	const edited = getEditedContentOnlySectionId(sel);
	const patternEditReady =
		!enterOnTarget || !edited.available || edited.id === clientId;
	return {
		clientId,
		alreadyOk:
			!!clientId &&
			selected === clientId &&
			editingMode !== 'disabled' &&
			patternEditReady,
	};
}

function inspectCanvas(clientId: string | null): {
	isPreviewMode: boolean;
	elExists: boolean;
	elSelected: boolean;
} {
	const be = select(blockEditorStore) as unknown as BlockEditorSelect;
	const editor = select('core/editor') as unknown as {
		getEditorSettings?: () => { isPreviewMode?: boolean };
	};
	const isPreviewMode = !!(
		be.getSettings?.()?.isPreviewMode ??
		editor.getEditorSettings?.()?.isPreviewMode
	);

	const iframe = getEditorCanvasIframe();
	const docs: Document[] = [];
	if (typeof document !== 'undefined') {
		docs.push(document);
	}
	if (iframe?.contentDocument) {
		docs.push(iframe.contentDocument);
	}

	let elExists = false;
	let elSelected = false;
	if (clientId) {
		for (let i = 0; i < docs.length; i++) {
			const el = docs[i].querySelector(`[data-block="${clientId}"]`);
			if (!el) {
				continue;
			}
			elExists = true;
			if (el.classList.contains('is-selected')) {
				elSelected = true;
				break;
			}
		}
	}

	return { isPreviewMode, elExists, elSelected };
}

function selectSectionBlock(sectionId: string): boolean {
	const clientId = findSectionClientId(sectionId);
	if (!clientId) {
		return false;
	}

	const blockEditor = dispatch(
		blockEditorStore
	) as unknown as BlockEditorDispatch;
	const iface = dispatch(INTERFACE_STORE) as unknown as {
		enableComplementaryArea?: (scope: string, area: string) => void;
	};
	const sel = select(blockEditorStore) as unknown as BlockEditorSelect;

	if (isUnsyncedPatternSection(sel, clientId)) {
		// Same as Gutenberg “Edit pattern”: enter content-only edit on the
		// pattern, then select it so the inspector shows the section.
		enterContentOnlySection(blockEditor, clientId);
	} else if (sel.getBlockEditingMode?.(clientId) === 'disabled') {
		const parentSectionId = findNearestContentOnlySection(sel, clientId);
		if (parentSectionId) {
			enterContentOnlySection(blockEditor, parentSectionId);
		}
	}

	blockEditor.selectBlock(clientId);
	if (typeof blockEditor.flashBlock === 'function') {
		blockEditor.flashBlock(clientId, 500);
	}
	if (typeof iface.enableComplementaryArea === 'function') {
		iface.enableComplementaryArea('core', BLOCK_INSPECTOR_AREA);
	}
	return true;
}

/**
 * Enter canvas edit for the current template and select the stamped section.
 */
export function selectSectionInCanvas(sectionId: string): void {
	if (!sectionId) {
		return;
	}

	const { path, filter, optionsPanel } = getTemplatesUrlState();
	navigateTemplates(path, {
		filter,
		optionsPanel,
		canvas: 'edit',
	});

	selectSectionBlock(sectionId);

	const started = Date.now();
	let inTick = false;
	let lastApplyKey = '';
	let iframeDocObserved: Document | null = null;
	let iframeObserver: MutationObserver | null = null;
	let stopped = false;

	const stop = () => {
		if (stopped) {
			return;
		}
		stopped = true;
		unsubscribe();
		iframeObserver?.disconnect();
		iframeObserver = null;
	};

	const ensureIframeObserver = (onChange: () => void) => {
		const iframe = getEditorCanvasIframe();
		const doc = iframe?.contentDocument || null;
		if (!doc?.documentElement || doc === iframeDocObserved) {
			return;
		}
		iframeDocObserved = doc;
		iframeObserver?.disconnect();
		iframeObserver = new MutationObserver(onChange);
		iframeObserver.observe(doc.documentElement, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['class'],
		});
	};

	const tick = () => {
		if (stopped || inTick) {
			return;
		}
		inTick = true;
		try {
			ensureIframeObserver(tick);
			const before = peekSelection(sectionId);
			const canvasInfo = inspectCanvas(before.clientId);
			const visuallySelected =
				before.alreadyOk &&
				!canvasInfo.isPreviewMode &&
				canvasInfo.elSelected;

			if (visuallySelected) {
				stop();
				return;
			}

			const needsStoreSelect = !!before.clientId && !before.alreadyOk;
			const needsCanvasSelect =
				!!before.clientId &&
				!canvasInfo.isPreviewMode &&
				canvasInfo.elExists &&
				!canvasInfo.elSelected;
			if (needsStoreSelect || needsCanvasSelect) {
				const applyKey = `${before.clientId}:${needsStoreSelect}:${needsCanvasSelect}:${canvasInfo.isPreviewMode}`;
				if (applyKey !== lastApplyKey) {
					lastApplyKey = applyKey;
					selectSectionBlock(sectionId);
				}
			}

			if (Date.now() - started > SELECT_TIMEOUT_MS) {
				stop();
			}
		} finally {
			inTick = false;
		}
	};

	const unsubscribe = subscribe(tick);
	ensureIframeObserver(tick);
	tick();
}
