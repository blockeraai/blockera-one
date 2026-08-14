/**
 * Pure block-tree operations for Templates Builder — barrel.
 *
 * Implementations are split by concern:
 * - `layout-transplant.ts` — layout variant transplant (areas, containers,
 *   sibling sections)
 * - `section-ops.ts` — leaf-section swap / toggle / attribute set
 * - `chrome-rail.ts` — header/footer template-part swaps + vertical rail
 * - `op-context.ts` — injected parse/serialize context + placement helper
 *
 * Parse/serialize adapters are injected so unit tests can run without WP
 * (see `shared/test/operations.spec.js`).
 */

export {
	insertAtPlacement,
	replaceSectionAtPath,
	type OpsContext,
	type ParseFn,
	type SerializeFn,
} from './op-context';
export { transplantLayout } from './layout-transplant';
export { setSectionAttribute, swapSection, toggleSection } from './section-ops';
export {
	prepareHideChromeSection,
	swapTemplatePart,
	unwrapChromeRail,
} from './chrome-rail';
