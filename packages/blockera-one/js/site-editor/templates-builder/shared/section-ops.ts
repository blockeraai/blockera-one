/**
 * Leaf-section operations barrel. Implementations live next door:
 * swap-section, toggle-section, section-attribute, inner-order-ops.
 */

export { swapSection } from './swap-section';
export { toggleSection } from './toggle-section';
export {
	ensurePaginationNavLabels,
	setSectionAttribute,
	setSectionBlockStyle,
} from './section-attribute';
export {
	moveInnerSection,
	orderInnerSections,
	placeSection,
} from './inner-order-ops';
