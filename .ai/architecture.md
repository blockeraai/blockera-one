# Blockera One architecture

FSE theme. PHP under `packages/blockera-one/php/` (theme, patterns, template builder). Site Editor UI under `packages/blockera-one/js/site-editor/` including **templates builder**.

Admin companion: `packages/blockera-admin-one`.

## Stamps

`metadata.blockeraOne.stamp` grammar and catalogs: `packages/blockera-one/js/site-editor/templates-builder/STAMPS.md`. Runtime: `shared/stamp.ts`. Do not duplicate catalog tables in other docs.

## Tests

From theme root: `npm run test:e2e`, `test:js`, `test:unit:php`, `test:snapshots:php`. Playwright: `test:e2e:base` when present.

## Source-codes

Same Gutenberg / WordPress routing as other products (`source-codes/`).
