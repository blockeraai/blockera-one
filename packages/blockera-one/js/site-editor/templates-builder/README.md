# Templates Builder

Config-driven options panel for the Site Editor Templates menu. v1 ships the **Archive** template type only.

## Split of ownership

| Layer | Owns |
| --- | --- |
| PHP catalog (`php/Theme/TemplateBuilder/`) | Variant lists per type → pool (id, label, patternSlug / part slug, thumbnail, placement, areas, chromeLayout) |
| Theme patterns (`patterns/<type>/builder-*.php`) & parts (`parts/*.html`) | Variant markup (single source of truth) |
| JS type config (`<type>/config.ts`) | Groups, controls, operations, conditions, `swapHints`, `catalogPool`, section heuristics |
| Core patterns store (`getBlockPatterns()`) | Pattern `content` resolved at runtime |
| Ops engine (`shared/operations.ts`) | Parse HTML → stamp → swap / transplant |

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
  registry.ts           # central type-config registry (returns hydrated configs)
  CATALOG.md            # PHP catalog / child-theme API docs
  shared/               # engine + panel + controls (type-agnostic)
    hydrate-config.ts       # PHP catalog → control variants
    resolve-variant-html.ts # patterns store / template-part → variant.html
    template-part-html.ts   # stamped wp:template-part comment builder
    stamps.ts               # shared stamp dictionary (cross-type ids)
  archive/              # archive type: config + stamps.ts (no markup, no thumbnails)
```

Add a new template type by:

1. Creating `templates-builder/<type>/config.ts` (heuristics, groups, `catalogPool`s) and `<type>/stamps.ts` (`role/id` dictionary list for the lint)
2. Registering its config in `registry.ts` (`CONFIGS`) and its dictionary in `STAMP_DICTIONARIES`
3. Adding a `<Type>Catalog` PHP class + theme patterns under `patterns/<type>/builder-*.php` (slugs `blockera-one/builder-<type>-*`)
4. Keeping WordPress template files at `templates/<slug>.html` (core path — do not nest)

See “Adding a template type” in [CATALOG.md](./CATALOG.md).

## Theme files (archive)

| Role | Path |
| --- | --- |
| Template | `templates/archive.html` |
| Builder patterns | `patterns/archive/builder-*.php` (slugs `blockera-one/builder-archive-*`) |
| Picker thumbnails | `assets/templates-builder/archive/*.svg` |
| Default pools | `packages/blockera-one/php/Theme/TemplateBuilder/ArchiveCatalog.php` |

## Stamps

`metadata.blockeraOne` is a single string: `role/id` or `role/id:variant`.
`role` is the closed enum `layout | section | area | container`; id and
variant are kebab-case. `/` binds the role to the id, `:` binds the variant.

```
"metadata":{"blockeraOne":"section/posts-listing:list"}      ← section + variant
"metadata":{"blockeraOne":"layout/archive-body:no-sidebar"}  ← layout + variant
"metadata":{"blockeraOne":"area/content"}                    ← area
"metadata":{"blockeraOne":"container/layout-columns"}        ← container
```

Rules:

- Each block carries **exactly one** stamp (one role per block).
- The role lives in the stamp itself — markup is self-describing and the
  runtime (`shared/stamp.ts` `parseStamp`) needs no role registry. The
  stamp dictionaries (`shared/stamps.ts` + `<type>/stamps.ts` as `role/id`
  lists, aggregated by `registry.ts`) are reference data for the lint spec
  only.
- Ids must be globally unique across template types; uniqueness and
  markup ↔ dictionary role consistency are enforced by
  `shared/test/template-builder.spec.js`.
- The layout root doubles as the `main` container for attribute carry-over.
- The sidebar template-part sits inside a `sidebar-area` group so the area
  and the section stay on separate blocks.
- Toggling a section off removes it permanently; toggling back on inserts
  the control's default variant — the first variant of its catalog pool.
- A variant may declare a `placement` (`relativeTo` stamp id + position).
  Swapping to that design relocates the section there, toggling the section
  on inserts it there, and layout transplants re-attach it there (e.g. the
  Simple title lives inside the `content` area while Banner sits at the
  `archive-body` root). Variants without a placement swap in place, and the
  control-level `insert` rule is the toggle-on fallback.
- Stamps must sit on the **expanded** block tree: swaps insert pattern
  content, never a `core/pattern` block. Nested stamps (pagination inside a
  listing) live in the pattern files.
- The vertical-rail chrome frame is pattern-owned:
  `container/chrome-rail:vertical-rail` columns with a pre-stamped header
  part and an **empty** `area/rail-body-area`
  column the swap op fills with the live layout. Unwrap resolves the
  header/layout by stamp anywhere inside the rail, with a positional
  column fallback for trees saved before the pattern-based rail.

## Runtime data flow

1. PHP prints `window.blockeraOneTemplateBuilder.catalog` on the Site Editor
   screen (`Theme\TemplateBuilder`, dev-mode-validated against
   `schemas/template-builder-catalog.schema.json`).
2. `registry.ts` returns configs hydrated by `shared/hydrate-config.ts`
   (`catalogPool` → `variants`, memoized per type).
3. `shared/use-template-options.ts` selects `getBlockPatterns()` +
   `hasFinishedResolution` from `core-data` and maps every variant through
   `shared/resolve-variant-html.ts` (pattern `content` or generated
   `wp:template-part` comment) before any operation runs.
4. While patterns load, pickers that need pattern content are disabled; a
   variant whose pattern is missing after resolution is dropped from the
   picker. Operations never run with empty HTML.

## Architecture

1. **Anchors** — the `metadata.blockeraOne` stamp string on theme templates/patterns (see Stamps above).
2. **Detection** — `shared/resolve-state.ts` (stamps first, heuristics fallback).
3. **Operations** — `shared/operations.ts` (`transplantLayout`, `swapSection`, `toggleSection`, `setSectionAttribute`).
4. **Config** — per-type folder (e.g. `archive/config.ts`); hydrated + resolved via `registry.ts` and the hooks above.
5. **Panel** — `shared/template-options-panel.tsx`, shown from `TemplatesDrillDown` when `boFilter` matches a registered type.
6. **PHP** — `Theme\TemplateBuilder` (variant catalog + filters) and `Theme\TemplateSettings` (`posts_per_page` per purpose via `pre_get_posts`).

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
