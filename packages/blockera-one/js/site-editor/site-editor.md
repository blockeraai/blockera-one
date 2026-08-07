# Site Editor Main Panel (Blockera One)

Custom Design / Site / Features / Resources navigation for the WordPress Site Editor main sidebar, plus Styles, Site Identity, Homepage Settings, and Performance **sidebar drill-down** panels.

## Goals

- Hide core Design `ItemGroup` while keeping the WP topbar / title row and `SaveHub` footer.
- Replace core `.edit-site-site-hub` on all Site Editor view-mode pages (logo hover → arrow-up-left / dashboard).
- Show Blockera One branding (`MainPanelHeader`) under the hub on all view-mode pages.
- Render Blockera nav with Design, Site, Features, and Resources categories (no Starter sites).
- Keep core routes for Styles, Navigation, Pages, Templates, Patterns — Styles uses core Global Styles UI + canvas, but as a sidebar drill-down.
- Custom Site Identity content (logo, title, tagline — no site icon).
- Homepage Settings route (`/homepage`) for Reading-style homepage display options.
- Features → Performance (`/performance`) for site performance toggles (Disable Emojis Script first).
- Styles / Identity / Homepage / Performance collapse the main nav (like Templates / Pages / Patterns) and render inside the primary sidebar — **no** second `edit-site-layout__area` column.

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
| `drill-down-screen.tsx` / `drill-down-screen.scss` | Back + title (+ optional actions) chrome for Styles / Site / Features settings |
| `styles-drill-down.tsx` | Styles wrapper: portals Style Book into drill-down title row |
| `admin-ui-card.scss` | `.blockera-se-admin-ui-card` wrapper — single tighter override for core `.admin-ui-page*` |
| `styles-panel.scss` | Styles-only tweaks (hide Page header, GS navigator padding) |
| `site-identity-panel.tsx` / `site-identity-panel.scss` | Identity card (logo / title / tagline) |
| `homepage-settings-panel.tsx` / `homepage-settings-panel.scss` | Homepage card (`show_on_front` + pages) |
| `performance-panel.tsx` / `performance-panel.scss` | Features → Performance toggles |
| `routes.tsx` | Styles / identity / homepage / performance registration (sidebar-only) |
| `constants.ts` | Paths, core `uid`s, Resource URLs, selectors, setting keys |
| `utils.ts` | Path helpers, dashboard URL, core-uid click, SPA navigate (`isSiteEditorUrl` from `@blockera/utils`) |
| `style.scss` | Shared layout glue only (hide core ItemGroup / design-root flex) |

PHP: `packages/blockera-one/php/Theme/Performance.php` — registers `blockera_one_disable_emojis` on `/wp/v2/settings` and removes WP emoji hooks when enabled.

Registered from `packages/blockera-one/js/index.js` via `blockera.after.bootstrap` as `blockera-one-site-editor-main-panel` (source: `packages/blockera-one/js/site-editor/`).

## Navigation mechanics

- **Design-root** is `/` only. Main nav portals there; Styles and other drill-downs unmount it.
- **Design items:** click hidden core nav nodes by stable `uid` / `id` (SPA-safe, no router private API). Styles / Navigation / Pages / Templates / Patterns all drill down (Styles via Blockera route override; others via core screens).
- **Styles:** override `styles` route — wrap core `areas.content` in `StylesDrillDown` (DrillDownScreen + `.blockera-se-admin-ui-card`). Hide core `.admin-ui-page__header`; DOM-move `.admin-ui-page__header-actions` (Style Book; fallback `.edit-site-styles__header-actions`) into the drill-down title row and hide the core More menu. Keep core `areas.preview`; omit `areas.content`. Top Back always → `/`. Nested Global Styles backs stay core behavior.
- **Site Identity + Homepage + Performance:** SPA navigate via `history.pushState` + `popstate` with `p=/identity`, `p=/homepage`, or `p=/performance`. Routes register `areas.sidebar` (+ `mobileSidebar`) only — clone `home.areas.preview` (fallback navigation/styles) so the canvas `Editor` stays mounted; no `areas.content`. Main nav unmounts; `DrillDownScreen` shows back + title; settings use the same `.blockera-se-admin-ui-card` + `.admin-ui-page*` card chrome as Styles.
- **Resources:** external links from blockera-admin destinations with `utm_source=blockera-one-site-editor`.

## Performance setting

- Key: `blockera_one_disable_emojis` (boolean on `root/site` / `/wp/v2/settings`).
- **Default enabled:** missing / `null` / `true` → emoji scripts removed. Explicit `false` → WP emoji assets may load.
- Applied by `Blockera\One\Theme\Performance` on `init`.

## Pitfalls

1. **Do not** import `@wordpress/edit-site/build-module/*` (lock-unlock double opt-in).
2. `REGISTER_ROUTE` **appends** — always `UNREGISTER_ROUTE` before registering Blockera’s styles / identity / homepage / performance.
3. For Identity / Homepage / Performance, clone `home.areas.preview` (not `styles` — StylesPreviewArea remounts the iframe); do not rebuild Editor from edit-site. Styles keeps core `styles.areas.preview`.
4. Core Design nav `uid`s live in `constants.ts` — if WordPress renames them, Design clicks break first.
5. Hub + branding portal while `.edit-site-layout__sidebar` exists (view mode). Nav portal mounts on Design-root (`/`) only; Styles / Site / Features settings use drill-down like Pages / Templates.
6. Hard-refresh after changing route registration (`didRegister` module flag) so overrides re-apply.
7. Styles actions portal moves React-owned DOM (restore on cleanup). Core More menu is CSS-hidden in the title row (Reset styles stays on branding More). Core still skips rendering Style Book below the `medium` viewport — nothing to portal on small screens.

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
- Design-root (`/`) shows Design / Site / Features / Resources under branding.
- Core `.edit-site-site-hub` stays hidden; Blockera hub shows on all view-mode sidebar routes.
- Styles / Navigation / Pages / Templates / Patterns open drill-downs; Styles shows core Global Styles UI in the sidebar + core Style Book / Editor canvas; **no** second column.
- Site Identity / Homepage / Performance: main nav collapses; back + title in sidebar; white settings card; **no** second column; Save persists `root/site` edits.
- Top Back on Styles / Identity / Homepage / Performance returns to Design root (`/`) and restores main nav.
- Features → Performance: Disable Emojis Script defaults ON; Save removes front-end emoji assets; OFF restores them.
- Resources open Community / Roadmap / Feature Requests in a new tab.
- Hub search opens the command palette; site title opens the front end in a new tab.
- Global Styles Blockera nav and post-item route still register.
