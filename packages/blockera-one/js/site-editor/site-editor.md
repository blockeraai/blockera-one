# Site Editor Main Panel (Blockera One)

Custom Design / Site / Features / Resources navigation for the WordPress Site Editor main sidebar, plus Styles, **Templates purpose-nav**, Site Identity, Homepage Settings, and Performance **sidebar drill-down** panels.

## Goals

- Hide core Design `ItemGroup` while keeping the WP topbar / title row and `SaveHub` footer.
- Replace core `.edit-site-site-hub` on all Site Editor view-mode pages (logo hover → arrow-up-left / dashboard).
- Show Blockera One branding (`MainPanelHeader`) under the hub on all view-mode pages.
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

`SiteHub` and `MainPanelHeader` are separate components with separate stylesheets. `index.tsx` composes them in the sidebar mount.

Drill-down screens use a Blockera-owned `DrillDownScreen` (back → `/` + title + content) instead of importing core `SidebarNavigationScreen`.

## Files

| File | Role |
|------|------|
| `index.tsx` | Plugin root: body class, compose hub + header portal, nav portal, routes |
| `site-hub.tsx` / `site-hub.scss` | Blockera SiteHub (dashboard / title / command palette) |
| `main-panel-header.tsx` / `main-panel-header.scss` | Blockera One branding + More menu (Reset styles) |
| `main-navigation.tsx` / `main-navigation.scss` | Design / Site / Features / Resources UI |
| `drill-down-screen.tsx` / `drill-down-screen.scss` | Back + title (+ optional actions / `onBack`) chrome |
| `styles-drill-down.tsx` | Styles wrapper: portals Style Book into drill-down title row |
| `admin-ui-card.scss` | `.blockera-se-admin-ui-card` wrapper — tighter override for core `.admin-ui-page*` |
| `styles-panel.scss` | Styles-only tweaks (hide Page header, GS navigator padding) |
| `templates/` | Templates purpose-nav feature module (see below) |
| `site-identity-panel.tsx` / `site-identity-panel.scss` | Identity card (logo / title / tagline) |
| `homepage-settings-panel.tsx` / `homepage-settings-panel.scss` | Homepage card (`show_on_front` + pages) |
| `performance-panel.tsx` / `performance-panel.scss` | Features → Performance toggles |
| `routes.tsx` | Styles / templates / identity / homepage / performance registration |
| `constants.ts` | Paths, core `uid`s, Resource URLs, selectors, setting keys |
| `utils.ts` | Path helpers, dashboard URL, core-uid click, SPA navigate |
| `style.scss` | Shared layout glue only (hide core ItemGroup / design-root flex) |

### `templates/` module

| File | Role |
|------|------|
| `index.ts` | Public exports for route wiring |
| `constants.ts` | `boFilter` / `partsArea` query helpers + SPA navigate |
| `templates-nav-config.ts` | Static purpose-nav IA (homepage shell filled at runtime) |
| `templates-homepage-resolve.ts` | Homepage / Blog·Posts + fallback badges from Reading settings |
| `templates-matchers.ts` | Slug / custom / author matchers |
| `use-templates-data.ts` | Entity fetch, counts, dynamic CPT/author/homepage rows |
| `templates-drill-down.tsx` | DrillDownScreen + menu ↔ parts sub-screen |
| `templates-nav.tsx` | Parent/child purpose menu UI |
| `templates-parts-screen.tsx` | Templates-owned parts list by area |
| `style.scss` | Nav / parts styles |

PHP: `packages/blockera-one/php/Theme/Performance.php` — registers `blockera_one_disable_emojis` on `/wp/v2/settings` and removes WP emoji hooks when enabled.

Registered from `packages/blockera-one/js/index.js` via `blockera.after.bootstrap` as `blockera-one-site-editor-main-panel`.

## Navigation mechanics

- **Design-root** is `/` only. Main nav portals there; Styles / Templates and other drill-downs unmount it.
- **Design items:** click hidden core nav nodes by stable `uid` / `id`. Styles / Templates set forward enter animation before the uid click.
- **Styles:** override `styles` route — wrap core `areas.content` in `StylesDrillDown`. Keep core `areas.preview`; omit `areas.content`.
- **Templates:** override `templates`, `template-item`, and `template-part-item` sidebars with `TemplatesDrillDown`. Browse `/template` keeps **core PageTemplates DataViews** via `TemplatesBrowseContent`, except when a purpose filter’s **base** template is missing — then the right pane shows a missing-base card (hierarchy fallback link + Add specific template). Purpose-nav sets `activeView` for Other tabs. Selecting a purpose filter whose base exists navigates to `/wp_template/{id}` (view). Template parts: active parts only; click → live preview. **Homepage** section: one **Homepage** row (latest posts: first of `front-page → home → index`; static front: `front-page` or the selected homepage page), optional **Blog Home** → `/page/{page_for_posts}` (not `home.html`), and collapsed inline fallbacks with status badges.
- **Site Identity + Homepage + Performance:** SPA navigate via `history.pushState` + `popstate`.
- **Resources:** external links with `utm_source=blockera-one-site-editor`.

## Pitfalls

1. **Do not** import `@wordpress/edit-site/build-module/*`.
2. Always `UNREGISTER_ROUTE` before registering Blockera overrides.
3. Templates purpose-filter state uses URL query keys `boFilter` and `partsArea`.
4. Hard-refresh after changing route registration (`didRegister` module flag).

## E2E (CI category: `site-editor`)

- `packages/blockera-one/js/test/main-panel.site-editor.e2e.cy.js` (includes Templates purpose-nav)
- Helpers: `assertSiteEditorTemplatesNav` in `packages/dev-cypress/js/helpers/site-editor-main-panel.js`

## Manual verification

- **Templates:** purpose sections; Homepage collapsed until selected (then inline Front Page / Blog Home / Index fallbacks with status badges); Blog Home when posts page is set; Header opens parts sub-screen; Back from parts returns to Templates menu; Back from Templates returns to Design root; clicking a category with a base template opens canvas preview.
- Styles / Identity / Homepage / Performance drill-downs still work as before.
