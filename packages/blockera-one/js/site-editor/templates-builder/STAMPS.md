# Templates Builder stamps

Living source of truth for stamp grammar, roles, and dictionaries. Written
for agents first; developers use the same rules. Update this file in the
same change that adds, moves, or renames a stamp.

Runtime parsing lives in `shared/stamp.ts` (`parseStamp`, `formatStamp`).
Dictionaries are reference data for lint only — `shared/test/template-builder.spec.js`
checks uniqueness and markup ↔ dictionary role consistency.

## Grammar

`metadata.blockeraOne` is a single string:

```
role/id
role/id:variant
```

- `role` is the closed enum `layout | section | area | container`.
- `id` and `variant` are kebab-case (`[a-z0-9-]+`).
- `/` binds role to id. `:` binds variant to id.
- One stamp per block. Markup is self-describing; the runtime does not
  look up roles from the dictionaries.

```
"metadata":{"blockeraOne":"section/posts-listing:list"}
"metadata":{"blockeraOne":"layout/main:no-sidebar"}
"metadata":{"blockeraOne":"area/content"}
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

## Uniqueness

Ids are **globally unique across every dictionary**, including shared.
Uniqueness is on the **id token**, not `role/id`.

Illegal: `layout/header` when `section/header` already exists.

That is why part roots are `site-header` / `site-footer` / `site-sidebar`
instead of `header` / `footer` / `sidebar`.

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
4. Add `role/id` (no variant) to the right dictionary.
5. Stamp markup as `role/id` or `role/id:variant`.
6. Point `layoutId`, `relativeTo`, and control `target.id` at the **id** only.
7. Add or move the row in the matching catalog table below.
8. Run `npm run test:js -- --testPathPattern template-builder`.

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
| `section/post-meta` | First meta row on a post or page. |
| `section/post-meta-2` | Second meta row on a post or page. |
| `section/post-meta-author-name` | Author name in the first meta row. |
| `section/post-meta-comments-count` | Comments count in the first meta row. |
| `section/post-meta-comments-link` | Comments link in the first meta row. |
| `section/post-meta-date` | Date in the first meta row. |
| `section/post-meta-post-date` | Published date in the first meta row. |
| `section/post-meta-modified-date` | Modified date in the first meta row. |
| `section/post-meta-categories` | Categories in the first meta row. |
| `section/post-meta-tags` | Tags in the first meta row. |
| `section/post-meta-time-to-read` | Time-to-read in the first meta row. |
| `section/post-meta-word-count` | Word count in the first meta row. |
| `section/post-meta-2-author-name` | Author name in the second meta row. |
| `section/post-meta-2-comments-count` | Comments count in the second meta row. |
| `section/post-meta-2-comments-link` | Comments link in the second meta row. |
| `section/post-meta-2-date` | Date in the second meta row. |
| `section/post-meta-2-post-date` | Published date in the second meta row. |
| `section/post-meta-2-modified-date` | Modified date in the second meta row. |
| `section/post-meta-2-categories` | Categories in the second meta row. |
| `section/post-meta-2-tags` | Tags in the second meta row. |
| `section/post-meta-2-time-to-read` | Time-to-read in the second meta row. |
| `section/post-meta-2-word-count` | Word count in the second meta row. |

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
| `container/layout-columns` | Columns wrapper for content + sidebar layouts. |
| `container/content-column` | Main column beside the sidebar. |
| `container/sidebar-column` | Sidebar column beside the main content. |

## Type catalogs

Type-only stamps. Promote a row to the matching shared table when a
second type needs the same id — never copy.

### Archive (`archive/stamps.ts`)

#### Section

| Stamp | Desc |
| --- | --- |
| `section/posts-listing` | Query loop that lists posts. |

#### Container

| Stamp | Desc |
| --- | --- |
| `container/elements` | Inner stack of swappable children (page-header elements, loop-item blocks). |
| `container/loop-item-content` | Text column of a listing card. |
| `container/loop-item-media` | Media column of a listing card. |

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

## Upcoming template types

Single post, single page, search, 404, and homepage will reuse:

- `layout/main` (always; never `layout/single-body` or similar)
- the `section/page-header` family when they have a title band
- the `section/post-*` family on single post, single page, and listing cards
- the `section/pagination` family on archive, search, homepage, and other listings
- `section/header` / `section/footer` / `section/sidebar` for site chrome slots

Type folders, PHP catalogs, and theme-template stamps for those types
land when those builders ship. Until then, do not add empty dictionaries
or stamp `templates/single.html`, `page.html`, `search.html`, `404.html`,
or `home.html`.

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

## Placement and variants

A variant may declare a `placement` (`relativeTo` stamp **id** + position).
Swapping to that design relocates the section there; toggling on inserts
it there; layout transplants re-attach it there. Example: Simple title
lives inside `content`; Banner sits at the `main` root. Variants
without a placement swap in place. The control-level `insert` rule is
the toggle-on fallback.

Stamps sit on the **expanded** block tree: swaps insert pattern content,
never a `core/pattern` block.
