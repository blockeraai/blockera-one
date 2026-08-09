/**
 * Templates purpose-nav → WooCommerce Templates section.
 *
 * Category: woocommerce (CI matrix via `*.woocommerce.e2e.cy.js`)
 * wp-env: `.github/wp-env-configs/woocommerce.json`
 *
 * WC ships archive/single/cart/checkout/order/coming-soon/attribute/search as
 * plugin templates. Category / Tag / Brand are registry taxonomy templates
 * without plugin HTML — install theme fixtures so the full Shop nest is testable.
 */

import {
	SITE_EDITOR_TEST_IDS,
	openSiteEditorViewMode,
	assertSiteEditorChrome,
	assertSiteEditorMainNav,
	openTemplatesPurposeNav,
	assertTemplatesWooCommerceSection,
	getTemplatesWooCommerceSection,
	openTemplatesWooCommerceItem,
	enterSiteEditorCanvasEditFromPreview,
	clickSiteEditorOpenNavigation,
	installWooCommerceTaxonomyTemplateFixtures,
	removeWooCommerceTaxonomyTemplateFixtures,
} from '@blockera/dev-cypress/js/helpers';

describe('Blockera One → Templates WooCommerce purpose-nav', () => {
	function openFreshSiteEditor() {
		openSiteEditorViewMode('/');
		assertSiteEditorChrome();
		assertSiteEditorMainNav();
	}

	before(() => {
		removeWooCommerceTaxonomyTemplateFixtures();
		installWooCommerceTaxonomyTemplateFixtures();
	});

	after(() => {
		removeWooCommerceTaxonomyTemplateFixtures();
	});

	describe('Default WC state', () => {
		it('shows WooCommerce Templates before Other with curated order and labels', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesWooCommerceSection();
		});
	});

	describe('Shop Page', () => {
		it('opens Shop Page canvas and keeps shop children nested', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			openTemplatesWooCommerceItem(
				SITE_EDITOR_TEST_IDS.templatesNavWooArchiveProduct
			);

			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavWooArchiveProduct
			).should('have.class', 'is-active');

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNavWooArchiveProduct)
				.parents('.blockera-site-editor-templates-nav__item-shell')
				.parent()
				.within(() => {
					[
						SITE_EDITOR_TEST_IDS.templatesNavWooProductCat,
						SITE_EDITOR_TEST_IDS.templatesNavWooProductTag,
						SITE_EDITOR_TEST_IDS.templatesNavWooProductBrand,
						SITE_EDITOR_TEST_IDS.templatesNavWooProductAttribute,
						SITE_EDITOR_TEST_IDS.templatesNavWooProductSearch,
					].forEach((testId) => {
						cy.getByDataTest(testId).should(
							'have.class',
							'is-child'
						);
					});
				});
		});
	});

	describe('Shop children', () => {
		const shopChildren = [
			{
				name: 'Products by Category',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooProductCat,
			},
			{
				name: 'Products by Tag',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooProductTag,
			},
			{
				name: 'Products by Brand',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooProductBrand,
			},
			{
				name: 'Products by Attribute',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooProductAttribute,
			},
			{
				name: 'Product Search Page',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooProductSearch,
			},
		];

		shopChildren.forEach(({ name, testId }) => {
			it(`opens ${name} with matching boFilter`, () => {
				openFreshSiteEditor();
				openTemplatesPurposeNav();
				openTemplatesWooCommerceItem(testId);
			});
		});
	});

	describe('Checkout journey tops', () => {
		const topLevel = [
			{
				name: 'Single Product',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooSingleProduct,
			},
			{
				name: 'Cart Page',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooCart,
			},
			{
				name: 'Checkout Page',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooCheckout,
			},
			{
				name: 'Order Confirmation',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooOrderConfirmation,
			},
			{
				name: 'Coming Soon Page',
				testId: SITE_EDITOR_TEST_IDS.templatesNavWooComingSoon,
			},
		];

		topLevel.forEach(({ name, testId }) => {
			it(`opens ${name} with matching boFilter`, () => {
				openFreshSiteEditor();
				openTemplatesPurposeNav();
				openTemplatesWooCommerceItem(testId);
			});
		});
	});

	describe('Exclusions', () => {
		it('keeps WC rows out of Other author and CPT product purpose rows', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			assertTemplatesWooCommerceSection({
				assertOrder: false,
				assertLabels: false,
				assertNesting: false,
			});

			// No duplicate WC data-test under Page / Archive purpose sections.
			[
				SITE_EDITOR_TEST_IDS.templatesNavWooArchiveProduct,
				SITE_EDITOR_TEST_IDS.templatesNavWooSingleProduct,
				SITE_EDITOR_TEST_IDS.templatesNavWooCart,
				SITE_EDITOR_TEST_IDS.templatesNavWooCheckout,
			].forEach((testId) => {
				cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav)
					.find(`[data-test="${testId}"]`)
					.should('have.length', 1);
			});
		});
	});

	describe('Open Navigation restore', () => {
		it('returns from Shop Page canvas edit with boFilter and Templates nav', () => {
			openFreshSiteEditor();
			openTemplatesPurposeNav();

			openTemplatesWooCommerceItem(
				SITE_EDITOR_TEST_IDS.templatesNavWooArchiveProduct
			);

			enterSiteEditorCanvasEditFromPreview();

			cy.location('search', { timeout: 20000 }).should(
				'include',
				'canvas=edit'
			);

			clickSiteEditorOpenNavigation();

			cy.location('search', { timeout: 20000 }).should((search) => {
				const decoded = decodeURIComponent(String(search));
				expect(decoded).to.include('boFilter=child:archive-product');
				expect(decoded).to.not.include('canvas=edit');
			});

			cy.getByDataTest(SITE_EDITOR_TEST_IDS.templatesNav).should('exist');
			getTemplatesWooCommerceSection().should('exist');
			cy.getByDataTest(
				SITE_EDITOR_TEST_IDS.templatesNavWooArchiveProduct
			).should('have.class', 'is-active');
		});
	});
});
