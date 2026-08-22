# Templates Builder

Config-driven options panel for the Site Editor Templates menu. Ships the
**Archive** family (archive / search / home / index), the **Singular** family
(single post / page overlay), a thin **404** type, and first-class **header /
footer / sidebar** part panels.

## Split of ownership

| Layer | Owns |
| --- | --- |
| PHP catalog (`php/Theme/TemplateBuilder/`) | Variant lists per type → pool (id, label, patternSlug / part slug, thumbnail, placement, areas, chromeLayout) |
| Theme patterns (`patterns/<type>/builder-*.php`, `patterns/post-meta/builder-*.php`) & parts (`parts/*.html`) | Variant markup (single source of truth) |
| JS type config (`<type>/config.ts`) | Groups, controls, operations, conditions, `swapHints`, `catalogPool`, section heuristics |
| Core patterns store (`getBlockPatterns()`) | Pattern `content` resolved at runtime |
| Ops engine (`shared/ops/`) | Parse HTML → stamp → swap / transplant / broadcast |

Markup never lives in JS (except test fixtures and the generated
`core/template-part` comments for **stacked** chrome). The vertical-rail
chrome frame is a pattern like every other variant
(`patterns/archive/builder-header-vertical.php`). Child themes restyle a
variant by overriding its pattern file, or add/remove variants via the
`blockera-one/template-builder/catalog/{type}` filter — see
[CATALOG.md](./CATALOG.md) for the full catalog API and recipes.

## Folder layout

```
templates-builder/
  index.ts              # thin public API
  registry.ts           # REGISTRATIONS / stamp merge / getOptionsConfigFor*
  registry-overrides.ts # templateOverrides transform / inject
  STAMPS.md             # stamp grammar, roles, shared vs type catalogs
  CATALOG.md            # PHP catalog / child-theme API + authoring checklists
  shared/               # engine + panel + controls (type-agnostic)
    resolve/            # hydrate-config, control/state/variant/template-id resolvers
    canvas/             # scroll/select stamped blocks in the Site Editor iframe
    sortable/           # sensors, buckets, row, list controller
    ops/                # apply-operation dispatcher, handlers, broadcast, meta
    panel/              # inspector panel + template-options-panel.scss
    sections/           # group factories + createPartsAreaConfig
    stamp-ids.ts        # ops-hardcoded stamp id tokens (keep in sync with STAMPS.md)
    stamps.ts           # shared stamp dictionary (cross-type ids)
    op-context.ts       # parse/serialize inject + placement
    section-ops.ts      # leaf-section ops barrel
    template-part-html.ts
  archive/              # archive family config (`stamps: []` until type-only ids)
  single/               # singular family (single + page overlay)
  not-found/            # 404 type (config.type is `404`)
  global-header/        # header part (layout/site-header) + sticky broadcast
  global-footer/        # footer part (layout/site-footer)
  global-sidebar/       # sidebar part (layout/site-sidebar) + width + widget elements
```

Add a new template type by:

1. Creating `templates-builder/<type>/config.ts` (compose `shared/sections` factories + optional `templateOverrides`). Add `<type>/stamps.ts` only when the type has type-only ids; otherwise `stamps: []` on the registration.
2. Exporting the `BuilderTypeRegistration` from `<type>/index.ts` (registration only) and listing it in `registry.ts` `REGISTRATIONS`. `GLOBAL_*_OPTIONS_CONFIG` stays on `<type>/config.ts`; public aliases come from `registry.ts`.
3. Adding a `<Type>Catalog` PHP class + theme patterns under `patterns/<type>/builder-*.php` (and `patterns/post-meta/` when reusing Post Meta)
4. Keeping WordPress template files at `templates/<slug>.html` (core path — do not nest)

See “Adding a template type” in [CATALOG.md](./CATALOG.md).

## Theme files (archive)

| Role | Path |
| --- | --- |
| Template | `templates/archive.html` (`search.html`, `home.html`, `index.html` share the family) |
| Builder patterns | `patterns/archive/builder-*.php` (slugs `blockera-one/builder-archive-*`) |
| Post Meta patterns | `patterns/post-meta/builder-*.php` (shared item/row restore pools) |
| Picker thumbnails | `assets/templates-builder/archive/*.svg` |
| Default pools | `packages/blockera-one/php/Theme/TemplateBuilder/ArchiveCatalog.php` |

## Theme files (singular)

| Role | Path |
| --- | --- |
| Templates | `templates/single.html`, `templates/page.html`, `templates/page-no-title.html` |
| Builder patterns | `patterns/single/builder-*.php`, `patterns/page/builder-*.php` |
| Default pools | `SingleCatalog.php` (`single` + `page-page-header` / `page-article` overlay pools) |

## Theme files (404)

| Role | Path |
| --- | --- |
| Template | `templates/404.html` |
| Builder patterns | `patterns/404/builder-*.php` (slugs `blockera-one/builder-404-*`) |
| Default pools | `NotFoundCatalog.php` (catalog key `404`) |

## Theme files (sidebar part)

| Role | Path |
| --- | --- |
| Part | `parts/sidebar.html` → `patterns/hidden-sidebar.php` |
| Widget restore patterns | `patterns/sidebar/builder-*.php` |
| Default pools | `SidebarCatalog.php` (catalog key `global-sidebar`) |

## Stamps

See [STAMPS.md](./STAMPS.md) for grammar, roles, shared vs type catalogs,
naming rules, and how to add or promote a stamp. Keep that file updated
when dictionaries or markup change.

```
"metadata":{"blockeraOne":{"stamp":"section/posts-listing:list"}}
"metadata":{"blockeraOne":{"stamp":"layout/main:no-sidebar"}}
"metadata":{"blockeraOne":{"stamp":"area/content"}}
```

Short runtime notes (full rules in STAMPS.md):

- Each block carries **exactly one** stamp on `metadata.blockeraOne.stamp`. Dictionaries are lint
  reference data; `parseStamp` reads that string on the block.
- The layout root doubles as the `main` container for attribute carry-over.
- The sidebar template-part sits inside a `sidebar-area` group so the area
  and the section stay on separate blocks.
- Toggling a section off removes it permanently; toggling back on inserts
  the control's default variant — the first variant of its catalog pool.
- A variant may declare a `placement` (`relativeTo` stamp id + position).
  Banner page-header sits at the `main` root; Simple title lives
  inside `content`.
- Stamps must sit on the **expanded** block tree: swaps insert pattern
  content, never a `core/pattern` block.
- The vertical-rail chrome frame is pattern-owned:
  `container/chrome-rail:vertical-rail` with an empty `area/rail-body-area`
  the swap op fills with the live layout.

## Runtime data flow

1. PHP prints `window.blockeraOneTemplateBuilder.catalog` on the Site Editor
   screen (`Theme\TemplateBuilder`, dev-mode-validated against
   `schemas/template-builder-catalog.schema.json`).
2. `registry.ts` returns configs hydrated by `shared/resolve/hydrate-config.ts`
   (`catalogPool` → `variants`, memoized per type / `${type}:${filter}` overlay).
3. `shared/use-template-options.ts` selects `getBlockPatterns()` +
   `hasFinishedResolution` from `core-data` and maps every variant through
   `shared/resolve/resolve-variant-html.ts` (pattern `content` or generated
   `wp:template-part` comment) before any operation runs.
4. While patterns load, pickers that need pattern content are disabled; a
   variant whose pattern is missing after resolution is dropped from the
   picker. Operations never run with empty HTML.

## Architecture

1. **Anchors** — `metadata.blockeraOne.stamp` on theme templates/patterns (see [STAMPS.md](./STAMPS.md)).
2. **Detection** — `shared/resolve/resolve-state.ts` (stamps first, heuristics fallback).
3. **Operations** — `shared/ops/apply-operation.ts` dispatcher (`OPERATION_HANDLERS` is exhaustive over `OperationKind`).
4. **Config** — per-type folder (e.g. `archive/config.ts` composed from `shared/sections`); hydrated + overlay-resolved via `registry.ts`.
5. **Panel** — `shared/panel/template-options-panel.tsx`, shown from `TemplatesDrillDown` when `blockera-builder` matches a registered type.
6. **PHP** — `Theme\TemplateBuilder` (variant catalog + filters) and `Theme\TemplateSettings` (`posts_per_page` per purpose + broadcast keys such as `sidebar_width` and `header_sticky`).

## Lint / tests

```bash
npm run test:js -- --testPathPattern templates-builder
```

Pattern/catalog integrity (area consistency, stamp validation, header
contract, catalog ↔ pattern files) is enforced by
`shared/test/template-builder.spec.js`, part of the suite above (run it
alone via `--testPathPattern template-builder`).

PHPUnit: `packages/blockera-one/php/tests/Theme/TemplateBuilderTest.php`
(catalog defaults vs the shared fixture, validator rules, filters, enqueue).
