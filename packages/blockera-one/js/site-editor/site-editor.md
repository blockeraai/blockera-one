# Site Editor Main Panel (Blockera One)

Custom Design / Site / Features / Resources navigation for the WordPress Site Editor main sidebar, plus Styles, **Templates purpose-nav**, Site Identity, Homepage Settings, and Performance **sidebar drill-down** panels.

## Goals

- Hide core Design `ItemGroup` while keeping the WP topbar / title row, core SiteHub, and `SaveHub` footer.
- Show Blockera One branding (`MainPanelHeader`) under core SiteHub on all view-mode pages.
- Render Blockera nav with Design, Site, Features, and Resources categories (no Starter sites).
- Keep core routes for Styles, Navigation, Pages, Templates, Patterns — Styles uses core Global Styles UI + canvas as a sidebar drill-down; **Templates** uses a Blockera purpose-based sidebar (see `templates/`).
- Custom Site Identity content (logo, title, tagline — no site icon).
- Homepage Settings route (`/homepage`) for Reading-style homepage display options.
- Features → Performance (`/performance`) for site performance toggles (Disable Emojis Script first).
- Styles / Identity / Homepage / Performance / Templates collapse the main nav and render inside the primary sidebar.

## Approach

There is **no SlotFill** for Design sidebar items in `@wordpress/edit-site`. We combine two existing Blockera patterns:

1. **CSS hide + stable portal** into `.edit-site-sidebar__content` (outside core’s `key={routeKey}` screen wrapper — avoids nav remount flash on Design-root navigations).
2. **Redux route registration** on `core/edit-site` — `UNREGISTER_ROUTE` / `REGISTER_ROUTE` — same as `SiteEditorPostItemRouteRegistration` (no `@wordpress/edit-site` deep imports).

`MainPanelHeader` portals into the sidebar mount (after core SiteHub). `index.tsx` owns that composition.

Drill-down screens use a Blockera-owned `DrillDownScreen` (back → `/` + title + content) instead of importing core `SidebarNavigationScreen`.

## Layering

```
filter-ids.ts (pure ids) → templates/ host  → nested-panels/ URL stack
                         ↘ templates-builder/ → ops + stamps
Gutenberg adapters (routes/) wrap host only — do not import TB internals.
```

- **Kernel:** `templates/filter-ids.ts` — `FILTER_IDS`, children-filter helpers. No React, no history.
- **Host:** `templates/` owns purpose-nav + drill-down. It may import the Templates Builder **barrel** (`templates-builder/index.ts`), not `shared/canvas/...`.
- **Builder:** type configs and `resolve-template-id.ts` import **only** `filter-ids`. URL parse lives in `templates-url.ts`; SPA writes in `navigate-templates.ts`.
- **Nested panels:** generic URL stack. TB `NestedPanelDef` → `toNestedPanelNode()` in `resolve-options-panel.ts` is the only adapter.
- **Matchers:** `hierarchy.ts` / `filter-match.ts` / `template-display.ts`, re-exported from `templates-matchers.ts`.

PHP array key `'404'` is coerced to int `404`. Keep the `(string)` cast in `CatalogValidator.php`; do not alias the type.

## Files

| File | Role |
|------|------|
| `index.tsx` | Plugin root: body class, header portal, nav portal, routes |
| `main-panel-header.tsx` / `main-panel-header.scss` | Blockera One branding + More menu (Reset → modal) |
| `reset/` | Theme reset modal + REST client (`ResetThemeModal`, `resetTheme`) |
| `main-navigation.tsx` / `main-navigation.scss` | Design / Site / Features / Resources UI (rendered from `navigation/nav-config.ts`) |
| `components/` | Shared UI: `nav-item`, `nav-section`, `settings-panel-shell`, `drill-down-screen` |
| `hooks/` | Shared hooks: `use-edited-site-record`, `use-portal-host`, `use-clear-core-slide`, `use-sidebar-enter-class` (`useSiteEditorUrlState` lives in `@blockera/utils`) |
| `navigation/` | Nav catalog (`nav-config.ts`) + SPA history writer (`history.ts`) |
| `panels/` | Settings panels: `site-identity-panel`, `homepage-settings-panel`, `performance-panel` (+ scss) |
| `routes/` | Styles / templates / settings route registration (config-driven). `REGISTER_ROUTE` stays in `routes/index.tsx`; area wraps in `wrap-templates-areas.tsx`; settings payloads in `register-settings-routes.tsx`. |
| `styles-drill-down.tsx` | Styles wrapper: portals Style Book into drill-down title row |
| `admin-ui-card.scss` | `.blockera-se-admin-ui-card` wrapper — tighter override for core `.admin-ui-page*` |
| `styles-panel.scss` | Styles-only tweaks (hide Page header, GS navigator padding) |
| `templates/` | Templates purpose-nav feature module (see below) |
| `templates-builder/` | Template options engine (configs + shared block operations). Stamp grammar and dictionaries: [`templates-builder/STAMPS.md`](./templates-builder/STAMPS.md). |
| `nested-panels/` | URL-stacked nested drill-down panels + gateway card |
| `constants.ts` | Paths, core `uid`s, Resource URLs, selectors, setting keys |
| `utils.ts` | Path helpers, core-uid click, SPA navigate |
| `style.scss` | Shared layout glue only (hide core ItemGroup / design-root flex) |

### `templates/` module

| File | Role |
|------|------|
| `index.ts` | Public exports for route wiring |
| `filter-ids.ts` | Pure `FILTER_IDS` + children-filter helpers (TB kernel import) |
| `constants.ts` | Barrel: filter ids + URL helpers + SPA navigate |
| `templates-url.ts` | `blockera-builder` parse (purpose / parts hub / nested stack) |
| `use-templates-builder-stack.ts` | Prefix-aware nested panel stack on `blockera-builder` |
| `navigate-templates.ts` | SPA navigate (scroll, pending direction, panel stack) |
| `templates-nav-config.ts` | Static purpose-nav IA (homepage shell filled at runtime) |
| `templates-homepage-resolve.ts` | Barrel: homepage status + nav builders |
| `templates-homepage-status.ts` | Pure slug/status/path helpers |
| `templates-homepage-nav.ts` | React tooltip + Homepage / Blog·Posts nav items |
| `templates-nav.tsx` | Parent/child purpose menu UI |
| `use-templates-nav-actions.ts` | Click / navigate actions for purpose-nav rows |
| `templates-matchers.ts` | Barrel: slug / custom / author matchers |
| `hierarchy.ts` / `filter-match.ts` / `template-display.ts` | Matcher splits |
| `use-templates-data.ts` | Thin composition of records + sections + counts |
| `use-template-records.ts` | Entity fetch + active/user lookups + filter matcher |
| `build-nav-sections.ts` | Runtime section builder (homepage / CPT / Woo / authors) |
| `templates-counts.ts` | Browse counts + "Specific templates" child rows |
| `templates-drill-down.tsx` | DrillDownScreen + purpose-nav (General Area Hub) |
| `templates-hub-parts.ts` | Canonical header/footer/sidebar helpers |
| `templates-area-hub.tsx` | Live Editor banner for global site parts (+ Patterns link) |
| `templates-browse-content.tsx` | Browse gate (core / filtered / missing-base / hub empty) |
| `style.scss` | Nav + Area Hub styles |

PHP: `packages/blockera-one/php/Theme/Performance.php` — registers `blockera_one_disable_emojis` on `/wp/v2/settings` and removes WP emoji hooks when enabled.

Registered from `packages/blockera-one/js/index.js` via `blockera.after.bootstrap` as `blockera-one-site-editor-main-panel`.

## Navigation mechanics

- **Design-root** is `/` only. Main nav portals there; Styles / Templates and other drill-downs unmount it.
- **Design items:** click hidden core nav nodes by stable `uid` / `id`. Styles / Templates set forward enter animation before the uid click.
- **Styles:** override `styles` route — wrap core `areas.content` in `StylesDrillDown`. Keep core `areas.preview`; omit `areas.content`.
- **Templates:** override `templates`, `template-item`, and `template-part-item` sidebars with `TemplatesDrillDown`. Browse `/template` keeps **core PageTemplates DataViews** via `TemplatesBrowseContent`, except when a purpose filter’s **base** template is missing — then the right pane shows a missing-base card (hierarchy fallback link + Add specific template). Purpose-nav sets `activeView` for Other tabs. Selecting a purpose filter whose base exists navigates to `/wp_template/{id}` (view). **Header / Footer / Sidebar** open the site-wide part in Area Hub (banner + live Editor); **Manage All …** jumps to Patterns (`categoryId`). **Homepage** section: one **Homepage** row (latest posts: first of `front-page → home → index`; static front: `front-page` or the selected homepage page), optional **Blog Home** → `/page/{page_for_posts}` (not `home.html`), and collapsed inline fallbacks with status badges.
- **Site Identity + Homepage + Performance:** SPA navigate via `history.pushState` + `popstate`.
- **Resources:** external links with `utm_source=blockera-one-site-editor`.

## Pitfalls

1. **Do not** import `@wordpress/edit-site/build-module/*`.
2. Always `UNREGISTER_ROUTE` before registering Blockera overrides.
3. Templates purpose-filter state uses the URL query key `blockera-builder` (slash path: purpose or parts hub, then nested panels).
4. Hard-refresh after changing route registration (`didRegister` module flag).

## E2E (CI category: `site-editor`)

- `packages/blockera-one/js/test/main-panel.site-editor.e2e.cy.js` (includes Templates purpose-nav)
- Helpers: `assertSiteEditorTemplatesNav` in `packages/dev-cypress/js/helpers/site-editor-main-panel.js`

## E2E (CI category: `reset`)

- `packages/blockera-one/js/test/theme-reset.reset.e2e.cy.js` — Reset theme modal UI + one-section isolation
- Helpers: `packages/dev-cypress/js/helpers/site-editor-reset.js`

## Manual verification

- **Templates:** purpose sections; Homepage collapsed until selected (then inline Front Page / Blog Home / Index fallbacks with status badges); Blog Home when posts page is set; Header/Footer/Sidebar open Area Hub for the global part; Manage All … opens Patterns; Back from Templates returns to Design root; clicking a category with a base template opens canvas preview.
- Styles / Identity / Homepage / Performance drill-downs still work as before.
