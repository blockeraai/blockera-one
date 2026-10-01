# Agents — Blockera One

Block theme (FSE) for the Site Builder. Theme packages live in GP: `blockera-one`.

## Inspect

- Shared: [`packages/global-packages/packages/dev-tools/ai/index.md`](packages/global-packages/packages/dev-tools/ai/index.md)
- Product: [`.ai/index.md`](.ai/index.md)
- Stamps: [`packages/global-packages/packages/blockera-one/js/site-editor/templates-builder/STAMPS.md`](packages/global-packages/packages/blockera-one/js/site-editor/templates-builder/STAMPS.md) (Cursor overlay `templates-builder-stamps.mdc`)
- Gutenberg / WordPress: `source-codes/`

## Constraints

- Active product **blockera-one**. GP writes: `packages/global-packages/`.
- Changelog/README: [`…/ai/workflows/changelog-and-readme.md`](packages/global-packages/packages/dev-tools/ai/workflows/changelog-and-readme.md)
- Scripts from **this** root: `npm run test:e2e`, `test:js`, `test:unit:php` — [`…/ai/workflows/product-scripts-and-deps.md`](packages/global-packages/packages/dev-tools/ai/workflows/product-scripts-and-deps.md)
- Do not invent stamp grammar; update `STAMPS.md` in the same change as stamp dictionaries/markup.

## Declared GP packages

<!-- generated:declared-gp-packages -->
Read [`.ai/declared-gp-packages.md`](.ai/declared-gp-packages.md) before changing PHPUnit, Jest, PHPCS, ESLint, Stylelint, Cypress spec/CI filters, or CI package filters. `project:bootstrap` rewrites that file from `config/assets.php` `list` handles (fallback: `package.json` `dependencies` / `devDependencies` and `composer.json` `require` / `require-dev`). Do **not** add a GP package to those setups if it is missing from the generated list.
<!-- /generated:declared-gp-packages -->
