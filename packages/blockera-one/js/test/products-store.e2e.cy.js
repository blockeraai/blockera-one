/**
 * Blockera One registration into the blockera/products store api.
 *
 * Category: general (theme-only wp-env, companion plugin absent).
 *
 * PHP side: packages/blockera-one/php/hooks.php registers the theme on
 * `blockera/products/registry/init`; blockera_products_l10n() localizes the
 * registry as `window.blockeraProductsData`, and `@blockera/products`
 * bootstraps it into the store on dom ready.
 */

import { createPost } from '@blockera/dev-cypress/js/helpers';

describe('Products store api → blockera-one registration', () => {
	beforeEach(() => {
		createPost();
	});

	it('localizes the server-side registry payload', () => {
		cy.window().should((win) => {
			expect(
				win.blockeraProductsData?.products?.['blockera-one'],
				'localized blockera-one product'
			).to.not.equal(undefined);
		});
	});

	it('registers the blockera-one theme into the blockera/products store', () => {
		cy.window().should((win) => {
			const select = win.wp?.data?.select('blockera/products');

			expect(select, 'blockera/products store').to.not.equal(undefined);
			expect(select.hasProduct('blockera-one')).to.equal(true);

			const product = select.getProduct('blockera-one');

			expect(product.slug).to.equal('blockera-one');
			expect(product.type).to.equal('theme');
			expect(product.status).to.equal('active');
			expect(product.isCompanion).to.equal(false);
			expect(product.version).to.be.a('string').and.not.be.empty;

			expect(select.getProductVersion('blockera-one')).to.equal(
				product.version
			);
			expect(select.getProductsByType('theme')).to.have.property(
				'blockera-one'
			);
		});
	});

	it('exposes the version-independent window bridge for inline scripts', () => {
		cy.window().should((win) => {
			expect(
				win.blockeraProducts?.select?.getProduct('blockera-one')?.slug,
				'window.blockeraProducts bridge'
			).to.equal('blockera-one');
			expect(
				win.blockeraProducts.unstableBootstrapServerSideProducts
			).to.be.a('function');
		});
	});

	it('reports no active companion product in theme-only mode', () => {
		cy.window().should((win) => {
			const select = win.wp.data.select('blockera/products');

			expect(select.getCompanionProduct()).to.equal(undefined);
			expect(select.isCompanionActive()).to.equal(false);
		});
	});
});
