# Site Editor Main Panel (Blockera One)

Custom Design / Site / Features / Resources navigation for the WordPress Site Editor main sidebar, plus Site Identity, Homepage Settings, and Performance **sidebar drill-down** panels.

## Goals

- Hide core Design `ItemGroup` while keeping the WP topbar / title row and `SaveHub` footer.
- Replace core `.edit-site-site-hub` on all Site Editor view-mode pages (logo hover → arrow-up-left / dashboard).
- Show Blockera One branding (`MainPanelHeader`) under the hub on all view-mode pages.
- Render Blockera nav with Design, Site, Features, and Resources categories (no Starter sites).
- Keep core routes for Styles, Navigation, Pages, Templates, Patterns.
- Custom Site Identity content (logo, title, tagline — no site icon).
- Homepage Settings route (`/homepage`) for Reading-style homepage display options.
- Features → Performance (`/performance`) for site performance toggles (Disable Emojis Script first).
- Identity / Homepage / Performance collapse the main nav (like Templates / Pages / Patterns) and render inside the primary sidebar — **no** second `edit-site-layout__area` column.

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
| `drill-down-screen.tsx` / `drill-down-screen.scss` | Back + title chrome for Site / Features settings |
| `site-identity-panel.tsx` / `site-identity-panel.scss` | Identity card (logo / title / tagline) |
| `homepage-settings-panel.tsx` / `homepage-settings-panel.scss` | Homepage card (`show_on_front` + pages) |
| `performance-panel.tsx` / `performance-panel.scss` | Features → Performance toggles |
| `blockera-se-admin-ui-page.scss` | White card layout (`.blockera-se-admin-ui-page*`) |
| `routes.tsx` | Identity / homepage / performance registration (sidebar-only) |
| `constants.ts` | Paths, core `uid`s, Resource URLs, selectors, setting keys |
| `utils.ts` | Path helpers, dashboard URL, core-uid click, SPA navigate (`isSiteEditorUrl` from `@blockera/utils`) |
| `style.scss` | Shared layout glue only (hide core ItemGroup / design-root flex) |

PHP: `packages/blockera-one/php/Theme/Performance.php` — registers `blockera_one_disable_emojis` on `/wp/v2/settings` and removes WP emoji hooks when enabled.

Registered from `packages/blockera-one/js/index.js` via `blockera.after.bootstrap` as `blockera-one-site-editor-main-panel` (source: `packages/blockera-one/js/site-editor/`).

## Navigation mechanics

- **Design items:** click hidden core nav nodes by stable `uid` / `id` (SPA-safe, no router private API). Styles stays on Design-root (main nav visible). Navigation / Pages / Templates / Patterns drill down via core screens.
- **Site Identity + Homepage + Performance:** SPA navigate via `history.pushState` + `popstate` with `p=/identity`, `p=/homepage`, or `p=/performance`. Routes register `areas.sidebar` (+ `mobileSidebar`) only — clone `home.areas.preview` (fallback navigation/styles) so the canvas `Editor` stays mounted; no `areas.content`. Main nav unmounts; `DrillDownScreen` shows back + title; settings card renders in the sidebar.
- **Resources:** external links from blockera-admin destinations with `utm_source=blockera-one-site-editor`.

## Performance setting

- Key: `blockera_one_disable_emojis` (boolean on `root/site` / `/wp/v2/settings`).
- **Default enabled:** missing / `null` / `true` → emoji scripts removed. Explicit `false` → WP emoji assets may load.
- Applied by `Blockera\One\Theme\Performance` on `init`.

## Pitfalls

1. **Do not** import `@wordpress/edit-site/build-module/*` (lock-unlock double opt-in).
2. `REGISTER_ROUTE` **appends** — always `UNREGISTER_ROUTE` before registering Blockera’s identity / homepage / performance.
3. Clone `home.areas.preview` (not `styles` — StylesPreviewArea remounts the iframe); do not rebuild Editor from edit-site.
4. Core Design nav `uid`s live in `constants.ts` — if WordPress renames them, Design clicks break first.
5. Hub + branding portal while `.edit-site-layout__sidebar` exists (view mode). Nav portal mounts on Design-root routes only (`/` + `/styles`); Site / Features settings use drill-down like Pages / Templates.

## E2E (CI category: `site-editor`)

Specs (auto-discovered by `.github/scripts/list-e2e-test-categories.js` → Cypress matrix in `.github/workflows/cypress-e2e-tests.yml`):

- `packages/blockera-one/js/test/main-panel.site-editor.e2e.cy.js`
- `packages/blockera-one/js/test/identity-homepage.site-editor.e2e.cy.js`
- `packages/blockera-one/js/test/performance.site-editor.e2e.cy.js`

Helpers: `packages/dev-cypress/js/helpers/site-editor-main-panel.js`
(`assertSiteEditorDrillDown`, `clickSiteEditorDrillDownBack` for sidebar-only panels).

```bash
npm run test:e2e -- --spec 'packages/**-one(-**|)/**/*.site-editor.e2e.cy.js'
```

## Manual verification

- Site Editor view mode: Blockera site hub (not core); logo hover shows arrow-up-left; click goes to Dashboard.
- Blockera One branding appears under the hub on all view-mode routes (including Pages / Templates drill-downs).
- Design-root shows Design / Site / Features / Resources under branding.
- Core `.edit-site-site-hub` stays hidden; Blockera hub shows on all view-mode sidebar routes.
- Styles keeps main nav; Navigation / Pages / Templates / Patterns open the same core screens as before.
- Site Identity / Homepage / Performance: main nav collapses; back + title in sidebar; white settings card; **no** second column; Save persists `root/site` edits.
- Back on those screens returns to Design root (`/`) and restores main nav.
- Features → Performance: Disable Emojis Script defaults ON; Save removes front-end emoji assets; OFF restores them.
- Resources open Community / Roadmap / Feature Requests in a new tab.
- Hub search opens the command palette; site title opens the front end in a new tab.
- Global Styles Blockera nav and post-item route still register.
