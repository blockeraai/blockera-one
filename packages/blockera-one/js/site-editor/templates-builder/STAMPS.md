# Templates Builder stamps

Living source of truth for stamp grammar, roles, and dictionaries. Written
for agents first; developers use the same rules. Update this file in the
same change that adds, moves, or renames a stamp.

Runtime parsing lives in `shared/stamp.ts` (`parseStamp`, `formatStamp`).
Dictionaries are reference data for lint only — `shared/test/template-builder.spec.js`
checks uniqueness and markup ↔ dictionary role consistency.

Ops-hardcoded id tokens live in `shared/stamp-ids.ts` (`STAMP_IDS`,
`FULL_WIDTH_LISTING_STAMP`). Keep those constants aligned with the catalog
tables below whenever an id used by meta/layout/broadcast ops changes.

## Grammar

`metadata.blockeraOne` is an object. The stamp lives in `.stamp`:

```
role/id
role/id:variant
```

Optional keys on the same object: `metaParts`, `metaSeparator`. Extra keys
are allowed. Empty optional keys are omitted.

- `role` is the closed enum `layout | section | area | container`.
- `id` and `variant` are kebab-case (`[a-z0-9-]+`).
- `/` binds role to id. `:` binds variant to id.
- One stamp per block. Markup is self-describing; the runtime does not
  look up roles from the dictionaries.

```
"metadata":{"blockeraOne":{"stamp":"section/posts-listing:list"}}
"metadata":{"blockeraOne":{"stamp":"layout/main:no-sidebar"}}
"metadata":{"blockeraOne":{"stamp":"area/content"}}
```

## Roles

| Role | Meaning | Typical block |
| --- | --- | --- |
| `layout` | Root of a template or template-part. The builder `layoutId`. One per entity. | `core/group` (`tagName:main` on templates) |
| `section` | Swappable or toggleable region. | group, query, template-part, query-title |
| `area` | Fill / transplant slot the ops engine writes into. | group wrapping carried-over content |
| `container` | Structural wrapper that is not swapped as a section. | columns, chrome-rail, inner stacks |

On `wp_template` types the layout root is also the `main` container used
for attribute carry-over.

The stamp id is for the ops engine. Gutenberg List View shows
`metadata.name`, which is independent of the id and should read as
content to the user. Inner-region containers especially: name
`container/start` **Post Banner** when it holds a banner, or
`container/media` **Media Blocks** / **Media Column** — not `Start` or
`Media`. Do not invent a stamp id to match the label.

Post Meta List View names (ops and patterns share this contract):

- Item wrappers (`section/post-meta-*` / `section/post-meta-2-*`, not
  the row and not space fillers): **`%s Meta`** from the item suffix,
  e.g. `Time to Read Meta`, `Published Date Meta`.
- Prefix / icon / suffix: **Meta Prefix**, **Meta Icon**, **Meta Suffix**.
- Separator (`container/meta-separator`): **Separator**.
- Space filler: **Space Filler**.
- Row parents (`section/post-meta`, `section/post-meta-2`): **Post Meta**.
- Inner `container/meta-item-block` stays unnamed.

## Uniqueness

Ids are **globally unique across every dictionary**, including shared.
Uniqueness is on the **id token**, not `role/id`.

Illegal: `layout/header` when `section/header` already exists.

That is why part roots are `site-header` / `site-footer` / `site-sidebar`
instead of `header` / `footer` / `sidebar`.

Dictionary uniqueness does **not** mean the block tree may only contain
one instance. Nested stamps (`container/start`, `container/media`,
`container/body`, `container/end`, `container/comments`,
`section/post-title`, …) may repeat **under different parents**
(listing card vs page-header vs single article). Lookup is parent-scoped —
do not invent owner-prefixed twins (`loop-item-media`). Repeats under
the **same** parent still resolve as first-match within that parent.

Layout, area, and chrome slots (`layout/main`, `area/*`,
`section/header` / `footer` / `sidebar`) stay tree-global first-match.

## Shared vs type

| Dictionary | File | Put a stamp here when |
| --- | --- | --- |
| Shared | `shared/stamps.ts` | Two or more types use it, the shared ops engine hardcodes it, or it is the standard `wp_template` layout / page-header family |
| Type | `<type>/stamps.ts` | Only that type uses it |

Never copy an id into a second dictionary. When a second type needs a
type-specific stamp, **promote** it: move the entry to `shared/stamps.ts`
and delete it from the type list. Do not invent a type-prefixed twin
(`layout/single-body` is wrong; use `layout/main`).

Do not put a template-type name in a shared stamp (`archive-body` is the
anti-pattern).

## How to name an id

1. Search `shared/stamps.ts` and every `<type>/stamps.ts`. Reuse if it fits.
2. Pick the role from the table above.
3. Name the id:
   - `page-*` — in-template content chrome (title band), **not** the site header part.
   - `site-*` — root of a global template part.
   - Children: `{parent}-{child}` (`page-header-title`).
   - Inner-region slots (shared, parent-scoped): `start`, `media`,
     `body`, `end`, `comments`. Do not reuse `header` / `footer` for
     these — those ids are chrome slots. Do not reuse
     `content-column` for a card/article/page-header body.
4. Add `role/id` (no variant) to the right dictionary.
5. Stamp markup as `role/id` or `role/id:variant`.
6. Point `layoutId`, `relativeTo`, and control `target.id` at the **id** only.
7. Add or move the row in the matching catalog table below.
8. Run `npm run test:js -- --testPathPattern template-builder`.

## Using stamps

Search the dictionaries first. Stamp the same ids on every template
type that needs that region. Type-prefixed twins (`layout/single-body`,
`loop-item-media`) are illegal. This section is the decision guide —
catalog tables below list every id.

- **`wp_template` layout** — always `layout/main`. The variant may be
  type-specific (`no-sidebar`, `sidebar-left`, …). Never
  `layout/<type>-body`.
- **Template parts vs chrome** — the part root is `layout/site-header`,
  `layout/site-footer`, or `layout/site-sidebar` (type dictionaries).
  The template slot wrapping the part is `section/header`,
  `section/footer`, or `section/sidebar` (shared). Do not stamp a part
  root on a template, or a chrome slot on the part.
- **Page-header band** — `section/page-header` plus title / description
  / breadcrumbs when the type has a title band. The inner stack is
  `container/body`. `container/start` is a leading sibling region, not
  that stack.
- **Listings** — `section/posts-listing` for any posts query loop
  (archive, search, homepage, related, …). Use the pagination family
  when the listing paginates.
- **Post/page pieces** — `section/post-*` on loop items **and** on
  single post / single page. Do not invent `loop-item-*` twins.
- **Inner regions** — opt-in `container/start`, `container/media`,
  `container/body`, `container/end`, `container/comments`. Parent-scoped;
  pin `innerOrder.within` to the owning section. Not chrome `header` /
  `footer`, not `content-column`, not `post-meta-comments-*`. Set
  `metadata.name` to a user-facing label for that instance; it may
  differ from the id (`container/start` as **Post Banner**,
  `container/media` as **Media Blocks**). Keep the shared id.
- **Areas** — `area/content` for transplant fill; `area/sidebar-area`
  around the sidebar slot (area and section on separate blocks);
  `area/rail-body-area` only in the chrome-rail frame.

New type / new markup:

1. Reuse the families above. Add a type-only id only if nothing shared
   fits.
2. `stamps: []` on the registration is valid when everything is shared
   (archive / single / 404 today). Add `<type>/stamps.ts` only for
   type-only ids.
3. Stamp `templates/<slug>.html` and `patterns/<type>/` in the same
   change as the builder.
4. Promote to `shared/stamps.ts` when a second type needs the id; update
   the matching catalog table; run
   `npm run test:js -- --testPathPattern template-builder`.

## Inner-region lookup

Sections may contain the shared inner slots (`container/start`,
`container/media`, `container/body`, `container/end`,
`container/comments`). Nested stamp lookup:

1. Walk ancestors of the selected canvas block; search under the nearest
   **parent** whose stamp is a **section or container** (skip the selected
   node when a parent scope exists). `findByStampWithin` still tests that
   ancestor itself. Skip chrome `header`/`footer`/`sidebar`, `layout/main`,
   and `area/*`.
2. If that misses (or nothing is selected), search under the control’s
   `innerOrder.parentId` or heuristic `parentId`.
3. Else tree-global first-match.

Layout, area, and chrome ids skip steps 1–2.

`page-header*` controls also pin `within` to `page-header` (before
selection). Inner-order rules that target a nested slot (`start` /
`media` / `body` / `end` / `comments`) set `innerOrder.within` to the
owning section (`page-header`, `posts-listing`, `article`, …). An
explicit `within` searches only under that ancestor — it does not
fall through to tree-global first-match — so reorder cannot move an
item into a sibling section’s matching slot.

Runtime: `shared/stamp-lookup.ts` (`findStampById`,
`resolveWithinFromSelection`, `lookupFromControl`,
`lookupFromInnerOrder`). Do not add a `within` field on every
control — put it on the shared `InnerOrderRule`.

## Disambiguation

| Stamp | Meaning |
| --- | --- |
| `section/header`, `section/footer` | Chrome slots in a **template** wrapping `core/template-part` |
| `layout/site-header`, `layout/site-footer` | Roots of the **header / footer parts** themselves |
| `section/page-header` | In-template title band (query-title, term description, breadcrumbs) |
| `section/sidebar` | Chrome sidebar slot in a template |
| `layout/site-sidebar` | Root of the **sidebar part** |
| `area/sidebar-area` | Area wrapper around the sidebar slot |
| `layout/main` | Shared layout root for every `wp_template` type (`tagName:main`) |
| `section/posts-listing` | Query loop that lists posts. Used on archive, search, homepage, and other listings. |
| `container/start` | Leading inner region (e.g. page-header kicker, article lead). Not chrome `section/header`. |
| `container/media` | Media region of a listing card or article. |
| `container/body` | Text/content region of a listing card, article, or page-header band. Not `container/content-column`. |
| `container/end` | Trailing inner region (e.g. author band, page-header extra). |
| `container/comments` | Comments region on a single post. Not `section/post-meta-comments-count` / `comments-link`. |
| `container/content-column` | Main column beside the sidebar in a page+sidebar frame |

## Shared catalog

Source: `shared/stamps.ts`. Add or move a row in the matching table in
the same change as the dictionary entry.

### Layout

| Stamp | Desc |
| --- | --- |
| `layout/main` | `wp_template` layout root (`tagName:main`). Variants are type-specific (`no-sidebar`, `sidebar-left`, …). |

### Section: page header

| Stamp | Desc |
| --- | --- |
| `section/page-header` | In-template title band (not the site header part). |
| `section/page-header-title` | Title inside the page-header band (query-title / post-title). |
| `section/page-header-description` | Description inside the page-header band (term description, post excerpt, …). |
| `section/page-header-breadcrumbs` | Breadcrumbs inside the page-header band. |
| `section/page-header-search-form` | Search form inside the search page-header band. |
| `section/page-header-results-count` | Results count (`core/query-total`) inside the search page-header band. |

### Section: listing

| Stamp | Desc |
| --- | --- |
| `section/posts-listing` | Query loop that lists posts. Used on archive, search, homepage, and other listings. |

### Section: pagination

| Stamp | Desc |
| --- | --- |
| `section/pagination` | Query pagination wrapper. Used on archive, search, homepage, and other listings. |
| `section/pagination-previous` | Previous-page control inside pagination. |
| `section/pagination-next` | Next-page control inside pagination. |
| `section/pagination-numbers` | Page-number links inside pagination. |

### Section: post

| Stamp | Desc |
| --- | --- |
| `section/post-featured-image` | Featured image on a post or page (loop item or single). |
| `section/post-title` | Title of a post or page (loop item or single). |
| `section/post-excerpt` | Excerpt of a post or page (loop item or single). |
| `section/post-content` | Content of a post or page (loop item or single). |
| `section/post-read-more` | Read-more link (usually on a loop item). |
| `section/article` | Singular post/page content wrapper (Content group). |
| `section/post-comments` | `core/comments` block (not `container/comments`). |
| `section/comments-title` | Comments heading inside `post-comments`. |
| `section/comment-template` | Comment list template inside `post-comments`. |
| `section/comments-pagination` | Comments pagination inside `post-comments`. |
| `section/comments-form` | `core/post-comments-form` inside `post-comments`. |
| `section/post-navigation` | Next/previous post wrapper. |
| `section/post-navigation-previous` | Previous post link. |
| `section/post-navigation-next` | Next post link. |
| `section/not-found` | 404 template section (image / title / description / search). |
| `section/not-found-image` | 404 illustration. |
| `section/not-found-title` | 404 heading. |
| `section/not-found-description` | 404 message. |
| `section/not-found-search` | 404 search form. |
| `section/sidebar-search` | Sidebar part Search widget. |
| `section/sidebar-categories` | Sidebar part Categories widget. |
| `section/sidebar-latest-posts` | Sidebar part Latest Posts widget. |
| `section/sidebar-archives` | Sidebar part Archives widget. |
| `section/sidebar-tag-cloud` | Sidebar part Tag Cloud widget. |
| `section/post-meta` | First meta row on a post or page. Flex-child grow and width stretch so inner space fillers can expand. |
| `section/post-meta-2` | Second meta row on a post or page. Same flex-child grow and width stretch as the first row. |
| `section/post-meta-author-name` | Author name in the first meta row. |
| `section/post-meta-comments-count` | Comments count in the first meta row. |
| `section/post-meta-comments-link` | Comments link in the first meta row. |
| `section/post-meta-post-date` | Published date in the first meta row. |
| `section/post-meta-modified-date` | Modified date in the first meta row. |
| `section/post-meta-categories` | Categories in the first meta row. |
| `section/post-meta-tags` | Tags in the first meta row. |
| `section/post-meta-time-to-read` | Time-to-read in the first meta row. |
| `section/post-meta-word-count` | Word count in the first meta row. |
| `section/post-meta-space-filler` | `core/paragraph` with a single space and `blockeraFlexChildSizing: grow` in the first meta row. |
| `section/post-meta-space-filler-2` | Second single-space grow paragraph in the first meta row. |
| `section/post-meta-2-author-name` | Author name in the second meta row. |
| `section/post-meta-2-comments-count` | Comments count in the second meta row. |
| `section/post-meta-2-comments-link` | Comments link in the second meta row. |
| `section/post-meta-2-post-date` | Published date in the second meta row. |
| `section/post-meta-2-modified-date` | Modified date in the second meta row. |
| `section/post-meta-2-categories` | Categories in the second meta row. |
| `section/post-meta-2-tags` | Tags in the second meta row. |
| `section/post-meta-2-time-to-read` | Time-to-read in the second meta row. |
| `section/post-meta-2-word-count` | Word count in the second meta row. |
| `section/post-meta-2-space-filler` | `core/paragraph` with a single space and `blockeraFlexChildSizing: grow` in the second meta row. |
| `section/post-meta-2-space-filler-2` | Second single-space grow paragraph in the second meta row. |

### Section: chrome

| Stamp | Desc |
| --- | --- |
| `section/header` | Chrome slot in a **template** wrapping the header `core/template-part`. |
| `section/footer` | Chrome slot in a **template** wrapping the footer `core/template-part`. |
| `section/sidebar` | Chrome slot in a **template** wrapping the sidebar `core/template-part`. |

### Area

| Stamp | Desc |
| --- | --- |
| `area/content` | Slot the layout ops fill with carried-over main content. |
| `area/sidebar-area` | Slot wrapping the in-template sidebar so area and section stay on separate blocks. |
| `area/rail-body-area` | Empty column in the vertical-rail frame; chrome-rail op fills it with the live layout. |

### Container

| Stamp | Desc |
| --- | --- |
| `container/chrome-rail` | Vertical-rail columns wrapper around header + body. |
| `container/layout-columns` | Columns wrapper for content + sidebar layouts. (`STAMP_IDS.layoutColumns`) |
| `container/content-column` | Main column beside the sidebar. (`STAMP_IDS.contentColumn`; complement of Sidebar width) |
| `container/sidebar-column` | Sidebar column beside the main content. (`STAMP_IDS.sidebarColumn`; Sidebar width target) |
| `container/start` | Leading inner region (e.g. page-header kicker, article lead). Not chrome `section/header`. |
| `container/media` | Media region of a listing card or article. |
| `container/body` | Text/content region of a listing card, article, or page-header band. Not the page+sidebar `content-column`. |
| `container/end` | Trailing inner region (e.g. author band, page-header extra). |
| `container/comments` | Comments region on a single post. Not `section/post-meta-comments-count` / `comments-link`. |
| `container/meta-item-icon` | Optional icon inside a post-meta item wrapper. Repeatable under each item parent. List View: **Meta Icon**. |
| `container/meta-item-prefix` | Optional prefix paragraph inside a post-meta item wrapper. Repeatable under each item parent. List View: **Meta Prefix**. |
| `container/meta-item-block` | The core meta block inside a post-meta item wrapper. Repeatable under each item parent. No List View name. |
| `container/meta-item-suffix` | Optional suffix paragraph inside a post-meta item wrapper. Repeatable under each item parent. List View: **Meta Suffix**. |
| `container/meta-separator` | Builder-managed separator paragraph between post-meta items. Repeatable under the meta row. List View: **Separator**. |

## Type catalogs

Type-only stamps. Promote a row to the matching shared table when a
second type needs the same id — never copy.

### Archive / single / 404

None (`stamps: []` on the registration).

### Global header (`global-header/stamps.ts`)

#### Layout

| Stamp | Desc |
| --- | --- |
| `layout/site-header` | Root of the header template part (not `section/header`). |

### Global footer (`global-footer/stamps.ts`)

#### Layout

| Stamp | Desc |
| --- | --- |
| `layout/site-footer` | Root of the footer template part (not `section/footer`). |

### Global sidebar (`global-sidebar/stamps.ts`)

#### Layout

| Stamp | Desc |
| --- | --- |
| `layout/site-sidebar` | Root of the sidebar template part (not `section/sidebar`). |

## Hard cut on renamed ids

These ids are retired. Theme source and runtime lookup use only the new
names. Customized templates saved with the old stamps will not match
until they are reset or re-saved.

| Retired | Current |
| --- | --- |
| `layout/archive-body` | `layout/main` |
| `layout/page-body` | `layout/main` |
| `layout/header-body` | `layout/site-header` |
| `layout/footer-body` | `layout/site-footer` |
| `layout/sidebar-body` | `layout/site-sidebar` |
| `container/elements` | `container/body` (page-header inner stack) |
| `container/loop-item-media` | `container/media` |
| `container/loop-item-content` | `container/body` |

`container/start` briefly named the page-header inner stack. Simple and
banner now use `container/body` (the shared content slot). `start` is a
distinct leading inner-region slot — do not reuse it as that stack.

## Placement and variants

A variant may declare a `placement` (`relativeTo` stamp **id** + position).
Swapping to that design relocates the section there; toggling on inserts
it there; layout transplants re-attach it there. Example: Simple title
lives inside `content`; Banner sits at the `main` root. Variants
without a placement swap in place. The control-level `insert` rule is
the toggle-on fallback.

Stamps sit on the **expanded** block tree: swaps insert pattern content,
never a `core/pattern` block.
