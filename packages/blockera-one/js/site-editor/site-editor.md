# Site Editor Main Panel (Blockera One)

Custom Design / Site / Resources navigation for the WordPress Site Editor main sidebar, plus Site Identity and Homepage Settings secondary panels.

## Goals

- Hide core Design `ItemGroup` while keeping the WP topbar / title row and `SaveHub` footer.
- Replace core `.edit-site-site-hub` on all Site Editor view-mode pages (logo hover → arrow-up-left / dashboard).
- Show Blockera One branding (`MainPanelHeader`) under the hub on all view-mode pages.
- Render Blockera nav with Design, Site, and Resources categories (no Starter sites).
- Keep core routes for Styles, Navigation, Pages, Templates, Patterns (and Identity path).
- Custom Site Identity content (logo, title, tagline — no site icon).
- New Homepage Settings route (`/homepage`) for Reading-style homepage display options.

## Approach

There is **no SlotFill** for Design sidebar items in `@wordpress/edit-site`. We combine two existing Blockera patterns:

1. **CSS hide + stable portal** into `.edit-site-sidebar__content` (outside core’s `key={routeKey}` screen wrapper — avoids nav remount flash on Design-root navigations).
2. **Redux route registration** on `core/edit-site` — `UNREGISTER_ROUTE` / `REGISTER_ROUTE` — same as `SiteEditorPostItemRouteRegistration` (no `@wordpress/edit-site` deep imports).

`SiteHub` and `MainPanelHeader` are separate components with separate stylesheets. `index.tsx` composes them in the sidebar mount.

## Files

| File | Role |
|------|------|
| `index.tsx` | Plugin root: body class, compose hub + header portal, nav portal, routes |
| `site-hub.tsx` / `site-hub.scss` | Blockera SiteHub (dashboard / title / command palette) |
| `main-panel-header.tsx` / `main-panel-header.scss` | Blockera One branding + More menu (Reset styles) |
| `main-navigation.tsx` / `main-navigation.scss` | Design / Site / Resources UI |
| `site-identity-panel.tsx` / `site-identity-panel.scss` | Secondary panel for logo / title / tagline |
| `homepage-settings-panel.tsx` / `homepage-settings-panel.scss` | Secondary panel for `show_on_front` + pages |
| `blockera-se-admin-ui-page.scss` | Independent copy of core Admin UI Page layout (`.blockera-se-admin-ui-page*`) |
| `routes.tsx` | Identity override + homepage registration |
| `constants.ts` | Paths, core `uid`s, Resource URLs, selectors |
| `utils.ts` | Path helpers, dashboard URL, core-uid click, SPA navigate (`isSiteEditorUrl` from `@blockera/utils`) |
| `style.scss` | Shared layout glue only (hide core ItemGroup / design-root flex) |

Registered from `packages/blockera-one/js/index.js` via `blockera.after.bootstrap` as `blockera-one-site-editor-main-panel` (source: `packages/blockera-one/js/site-editor/`).

## Navigation mechanics

- **Design items:** click hidden core nav nodes by stable `uid` / `id` (SPA-safe, no router private API).
- **Site Identity + Homepage:** SPA navigate via `history.pushState` + `popstate` with `p=/identity` or `p=/homepage` (no full reload). Runtime WP may not ship a core Identity route/nav item — Blockera registers both routes by cloning `styles` sidebar/preview areas.
- **Resources:** external links from blockera-admin destinations with `utm_source=blockera-one-site-editor`.

## Pitfalls

1. **Do not** import `@wordpress/edit-site/build-module/*` (lock-unlock double opt-in).
2. `REGISTER_ROUTE` **appends** — if core later adds `identity`, unregister it before registering Blockera’s version.
3. Clone `styles.areas.sidebar` / `preview` (not core identity — it may be absent); do not rebuild Editor from edit-site.
4. Core Design nav `uid`s live in `constants.ts` — if WordPress renames them, Design clicks break first.
5. Hub + branding portal while `.edit-site-layout__sidebar` exists (view mode). Nav portal mounts on Design-root routes; drill-down screens use core UI as usual.

## E2E (CI category: `site-editor`)

Specs (auto-discovered by `.github/scripts/list-e2e-test-categories.js` → Cypress matrix):

- `packages/blockera-one/js/test/main-panel.site-editor.e2e.cy.js`
- `packages/blockera-one/js/test/identity-homepage.site-editor.e2e.cy.js`

Helpers: `packages/dev-cypress/js/helpers/site-editor-main-panel.js`

```bash
npm run test:e2e -- --spec 'packages/**-one(-**|)/**/*.site-editor.e2e.cy.js'
```

## Manual verification

- Site Editor view mode: Blockera site hub (not core); logo hover shows arrow-up-left; click goes to Dashboard.
- Blockera One branding appears under the hub on all view-mode routes (including Pages / Templates drill-downs).
- Design-root shows Design / Site / Resources under branding.
- Core `.edit-site-site-hub` stays hidden; Blockera hub shows on all view-mode sidebar routes.
- Styles / Navigation / Pages / Templates / Patterns open the same core screens as before.
- Site Identity opens a 380px panel; logo / title / tagline edit `root/site` and Save persists.
- Homepage Settings opens `/homepage` panel; posts vs static page + selects work with Save.
- Resources open Community / Roadmap / Feature Requests in a new tab.
- Hub search opens the command palette; site title opens the front end in a new tab.
- Global Styles Blockera nav and post-item route still register.
