# Templates Builder Catalog (PHP API)

The variant catalog is the public API for child themes (and future template
types). PHP owns **which** variants exist; WordPress patterns own **what**
they look like; JS only wires controls and applies operations.

- Schema (single source of truth): `packages/blockera-one/schemas/template-builder-catalog.schema.json`
- Assembler: `packages/blockera-one/php/Theme/TemplateBuilder/Catalog.php`
- Payload printed on the Site Editor screen: `window.blockeraOneTemplateBuilder = { catalog: …, metaItemsDesign: … }` (inline, before `wp-core-data`)

## Payload shape

```php
[
    'archive' => [                       // template type
        'posts-listing' => [ Variant… ], // pool (first item = toggle-on default)
        'page-header'   => [ Variant… ],
        'pagination'    => [ Variant… ],
        'layout'        => [ Variant… ],
        'header'        => [ Variant… ], // templatePart (stacked) + pattern (vertical rail)
        'footer'        => [ Variant… ],
    ],
    'single' => [ … ],                   // + page overlay pools `page-page-header`, `page-article`
    '404' => [ … ],                      // JSON/JS key is the string "404"; PHP array keys coerce it to int
    'global-sidebar' => [ … ],           // sidebar part widget restore pools
]
```

JS controls bind to pools by id (`catalogPool` in `<type>/config.ts`);
`shared/resolve/hydrate-config.ts` fills each control's `variants` from the pool.

## Variant keys

| Key | Kind | Required | Description |
| --- | --- | --- | --- |
| `id` | both | yes | Kebab-case id; becomes the stamp variant `{role}/{poolId}:{id}` |
| `label` | both | yes | Translated picker label |
| `kind` | both | `templatePart` only | `pattern` (default) or `templatePart` |
| `patternSlug` | pattern | yes | Registered pattern slug (`namespace/name`) resolved from the core patterns store |
| `slug` | templatePart | yes | Theme template part slug (`parts/<slug>.html`) |
| `area` | templatePart | no | Template part area (`header` / `footer` / …) |
| `tagName` | templatePart | no | HTML tag for the rendered part |
| `thumbnail` | both | no | Layout-picker tile URL (`get_theme_file_uri()` so a child theme can override the file) |
| `placement` | both | no | `{ relativeTo: <stamp id>, position: before\|after\|inside-start\|inside-end }` — where the section lives when this design is applied |
| `areas` | pattern | no | Area stamp ids a layout variant exposes (`content` required by the area lint) |
| `chromeLayout` | both | no | `stacked` or `vertical-rail` (site header/footer frame). `vertical-rail` variants are pattern-kind — the pattern ships the full rail frame (see “Chrome” below) |
| `disabled` | pattern / disabled | no | When `true` the layout-picker tile is visible but not selectable |
| `badge` | pattern / disabled | no | Overlay label on a disabled tile (e.g. `Coming soon`) |

A **disabled variant** (coming-soon tile) omits `patternSlug` and requires `disabled: true`. It is a third schema kind (`disabledVariant`) so a click cannot swap empty markup.

Unknown keys are rejected (`additionalProperties: false`). Every schema key
must be consumed by `shared/resolve/hydrate-config.ts` (`SUPPORTED_VARIANT_KEYS`) —
the schema-sync jest test fails when either side drifts.

## Child-theme recipes

Restyle an existing variant — ship a pattern with the **same slug**; no PHP
or JS needed (core child-theme pattern override):

```
my-child/patterns/archive/builder-listing-list.php
  → Slug: blockera-one/builder-archive-listing-list
```

Add / remove / relabel / reorder variants — hook the per-type filter:

```php
// Add a listing.
add_filter( 'blockera-one/template-builder/catalog/archive', function ( $pools ) {
    $pools['posts-listing'][] = array(
        'id'          => 'magazine',
        'label'       => __( 'Magazine', 'my-child' ),
        'patternSlug' => 'my-child/builder-archive-listing-magazine',
        'thumbnail'   => get_stylesheet_directory_uri() . '/assets/thumbs/magazine.svg',
    );
    return $pools;
} );

// Remove grid-3, rename List.
add_filter( 'blockera-one/template-builder/catalog/archive', function ( $pools ) {
    $pools['posts-listing'] = array_values( array_filter(
        $pools['posts-listing'],
        static fn( $variant ) => 'grid-3' !== $variant['id']
    ) );
    $pools['posts-listing'][0]['label'] = __( 'Classic', 'my-child' );
    return $pools;
} );
```

The global filter `blockera-one/template-builder/catalog` runs after every
per-type filter and receives the full `type → pools` array.

## Post Meta Items Design

`window.blockeraOneTemplateBuilder.metaItemsDesign` is a separate payload
key (not part of the catalog schema). PHP owns the shared item map and
optional per-listing recipes so child themes can override prefixes,
suffixes, icons, and which Items Design a listing applies — without a JS
rebuild.

`default.items` is the shared map (all listings inherit it). There is **no
default preset**: a listing without a `listings` stamp entry keeps the
pattern markup as authored.

`listings` is keyed by the listing **stamp** (`section/posts-listing:{variant}`).
Each entry may set `preset` (`simple` / `labels` / `icons`) and/or overlay
`items` (merged over `default.items` by suffix, then by design). Built-in:
only full-width sets `preset => icons`. List / grid stay date-only unless
a child theme adds a stamp entry. Listing swap still applies the preset so
a filter overlay is honored; full-width also bakes the calendar icon into
the pattern for first paint.

```php
[
    'default'  => [
        'items' => [
            'author-name' => [
                'simple' => [ 'icon' => '', 'prefix' => '', 'suffix' => '' ],
                'labels' => [ 'icon' => '', 'prefix' => 'By', 'suffix' => '' ],
                'icons'  => [
                    'icon'   => [ 'icon' => 'comment-author-avatar', 'library' => 'wp' ],
                    'prefix' => '',
                    'suffix' => '',
                ],
            ],
            // post-date, tags, …
        ],
    ],
    'listings' => [
        'section/posts-listing:full-width' => [
            'preset' => 'icons',
            // optional: 'items' => [ … ] overlay on default items
        ],
    ],
]
```

`icon` is `''` (omit / remove) or a Blockera IconControl object (`library`
can be `wp`, `feather`, …). Any non-empty prefix, suffix, or icon in a
design is created — Labels is not locked to prefix-only.

```php
add_filter( 'blockera-one/template-builder/meta-items-design', function ( $payload ) {
    $payload['default']['items']['author-name']['labels']['prefix'] = __( 'Written by', 'my-child' );
    $payload['default']['items']['author-name']['labels']['suffix'] = '.';
    $payload['default']['items']['author-name']['icons']['icon']    = array(
        'library' => 'feather',
        'icon'    => 'user',
    );
    $payload['listings']['section/posts-listing:list'] = array(
        'preset' => 'labels',
    );
    return $payload;
} );
```

New variants use the child text domain in the slug
(`my-child/builder-archive-listing-magazine`) but keep the
`builder-<section>-<variant>` filename shape so they stay greppable.

## Pattern file contract (`builder-*`)

- File: `patterns/<type>/builder-<section>-<variant>.php` — the folder
  scopes the type; the **slug keeps it** because pattern slugs are global
  and other types reuse section names (`page-header`, `pagination`, …)
- Header: `Slug: blockera-one/builder-<type>-<section>-<variant>`,
  `Categories: blockera-one/template-builder`, `Inserter: no`
- Root block stamps `metadata.blockeraOne` = `section/{poolId}:{variantId}`
  (`layout/…` for layout pool variants — the role prefix is part of the
  stamp string)
- Layout variants keep the `area/content` area (and `area/sidebar-area`
  when they have a sidebar) — enforced by
  `templates-builder/shared/test/template-builder.spec.js`
- Listing variants that nest pagination keep the `section/pagination:…`
  stamp so `swapHints.reapplyControls` still works

Stacked chrome (site header/footer) stays **template parts**, not patterns:
catalog rows use `kind: templatePart` and JS generates the self-closing
`wp:template-part` comment (`shared/template-part-html.ts`). A child theme
restyles `parts/header.html`, or adds a new header by shipping
`parts/foo.html` plus a catalog row.

The **vertical rail** header is the exception because it re-frames the whole
page: its variant is pattern-kind and the pattern ships the entire frame —
`container/chrome-rail:vertical-rail` columns, the stamped
`section/header:vertical-header` template-part, and an **empty**
`area/rail-body-area` column the swap op fills
with the live layout (`patterns/archive/builder-header-vertical.php`).
Child themes restyle the rail (column widths, padding) by overriding that
pattern slug; the op keeps working as long as the override keeps the
`area/rail-body-area` stamp (a missing stamp falls back to the last column).

## Adding a template type

1. `patterns/<type>/builder-*.php` with stamps (slugs `blockera-one/builder-<type>-*`)
2. `php/Theme/TemplateBuilder/<Type>Catalog.php` extending `AbstractCatalog`
   (use the `patternVariant()` / `templatePartVariant()` builders) and list
   it in `Catalog::TYPE_CATALOGS` — schema, validator, and JS hydrate need
   no changes
3. `templates-builder/<type>/config.ts` — heuristics, groups,
   `catalogPool`s — plus `<type>/stamps.ts` only when the type has type-only
   ids (`stamps: []` on the registration until then)
4. Export the registration from `<type>/index.ts` and list it in
   `registry.ts` `REGISTRATIONS`
5. `templates/<slug>.html` at the WordPress path (do not nest)

## Checklists

### Add a control type

1. Add the member to `ControlType` in `shared/types.ts` (document non-visual types).
2. Add a `CONTROL_RENDERERS` entry in `shared/panel/render-control.tsx`
   (`satisfies Record<ControlType, …>` — `null` is allowed for reserved types).
3. Add `shared/controls/<name>-control/` (component + `index.ts`).
4. Optional: a feature factory under `shared/features/` that emits the control.
5. Unit tests under `shared/test/` (renderer + value resolution if the op is new).

`controls/select-control/` is reserved (`null` in the renderer map) until its
feature lands.

### Add a template family (or join via overlay)

1. Compose groups from `shared/sections/` (`siteHeaderGroup`, `pageHeaderGroup`,
   `singularContentGroup`, `postsLoopGroup`, `paginationGroup`, `postNavigationGroup`,
   `postCommentsGroup`, `notFoundGroup`, `sidebarGroup`, `sidebarBlocksGroup`,
   `siteFooterGroup`, plus section-block factories). Keep the type folder thin.
2. For a sibling purpose that is almost the same family, set
   `templateOverrides[filterId]` (`removeGroups` / `removeControls` / `addGroups`
   / `patchControls` / `patchGroups` / `injectControls`) instead of cloning the config. Registry memoizes overlays
   per `${type}:${filter}`.
3. Export `BuilderTypeRegistration` `{ config, stamps, when? }`. Use `when`
   for gated types (Woo shop).
4. PHP: `<Type>Catalog extends AbstractCatalog` (reuse `chromeHeaderPool` /
   `chromeFooterPool` / `postMetaPools` / `listingElementPool` when they fit).
   Keep `php/tests/fixtures/template-builder-catalog.json` in sync.
5. Patterns: `patterns/<type>/builder-*.php`. Shared Post Meta item markup
   lives under `patterns/post-meta/`.

### Add a broadcast setting

1. Extend `BroadcastId` in `shared/types.ts` and add a handler in
   `shared/ops/broadcast/` registered on `BROADCAST_HANDLERS`
   (`satisfies Record<BroadcastId, …>`).
2. Add the stored key to `TemplateSettingsRecord` + PHP
   `Theme\TemplateSettings` schema/sanitize.
3. Add a control with `operation: 'broadcastSetting'`, `broadcastId`, and
   `settingPath`. Parts screens use `createPartsAreaConfig({ groups })`.
4. Pure tests for the handler + planner; PHPUnit sanitize coverage.
5. Persistence is the editor multi-entity save panel (entities stay dirty).

Sidebar width is the first consumer (`global-sidebar` Settings, stored
`sidebar_width`, baked into `container/sidebar-column` +
`container/content-column`). Header sticky is the second (`global-header`
Settings, stored `header_sticky`, sticky position on `layout/site-header`
and `section/header`).

### i18n domains

JS inspector copy in type configs and `shared/sections` uses the `'blockera'`
domain (existing Site Editor strings). PHP catalog labels
(`ArchiveCatalog` / `AbstractCatalog` / `MetaItemsDesign`) use
`'blockera-one'`. Do not mix the two in one file.

### E2e selectors

Keep these `data-test` values stable; extend rather than rename:

| Selector | Where |
| --- | --- |
| `blockera-templates-builder-panel` | Panel root (`data-dirty="true"` when unsaved) |
| `blockera-templates-builder-group-{group.id}` | Group card |
| `blockera-templates-builder-header-toggle-{group.id}` | Group header `FormToggle` |
| `blockera-templates-builder-gateway-{id}` | Nested-panel gateway row |
| `blockera-templates-builder-control-{control.id}` | Non-gateway control row |
| `blockera-templates-builder-sortable-{group.id}` | Sortable element list |
| `blockera-templates-builder-more` / `-reset` | Title-action menu |

Smoke spec: `packages/blockera-one/js/test/templates-builder-panel.templates-2.e2e.cy.js`.

## Validation (dev mode only)

`CatalogValidator` runs only when:

```php
( defined( 'BLOCKERA_SB_MODE' ) && 'development' === BLOCKERA_SB_MODE )
    || wp_is_development_mode( 'theme' );
```

Production sites skip the schema load and all checks. On a violation the
validator calls `_doing_it_wrong( 'blockera-one/template-builder/catalog', … )`
naming the type, pool, variant id, and failing rule, then **drops that
variant** (an empty pool is removed) so the panel never renders a broken
tile. Child-theme developers see the warnings via `WP_DEBUG` /
`wp_is_development_mode( 'theme' )`.

CI coverage:

- PHPUnit `Theme/TemplateBuilderTest` — default pools validate cleanly, one
  failing case per rule, filter add/remove scenarios, inline-script output
- Jest `shared/test/hydrate-config.spec.js` — schema-sync (every schema key
  supported by hydrate and vice versa) against the shared fixture
  `php/tests/fixtures/template-builder-catalog.json` (also asserted equal to
  the real PHP output by PHPUnit)
- Jest `shared/test/template-builder.spec.js` — area consistency, stamp
  validation, `builder-*` header contract, unique `blockeraCompatId` per
  builder pattern file, every catalog `patternSlug` maps to a pattern file
  `Slug:` header (and no orphan builder patterns)
