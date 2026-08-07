# Site Catalog — tractorpartsasap.com (All States Ag Parts)

Generated during Phase 1 discovery. Source: `sitemap.xml` (index of 12 sub-sitemaps).
Full URL list saved to `.migration/all-urls.txt` (547,114 URLs).

## Project properties
- **Project type:** `da` (Document Authoring — content authored/published via da.live)
- **Block Library endpoint:** `https://main--sta-boilerplate--aemdemos.aem.page/tools/sidekick/library.json`
- **Content source (DA):** `aemsites/tractorpartsasap` — uploads via DA source API `https://admin.da.live/source/aemsites/tractorpartsasap/{path}.html`
- **Platform of source site:** Magento (Classy Llama theme) — large dynamic catalog
- **Preview:** https://main--tractorpartsasap--aemsites.aem.page/
- **Live:** https://main--tractorpartsasap--aemsites.aem.live/

## URL inventory (547,114 total)

| Template group | Count | Pattern | Notes |
|---|---|---|---|
| **Homepage** | 1 | `/` | Landing page w/ Homepage Finder tool |
| **Product detail** | ~393,326 | `/{slug}.html` (root level) | Individual parts — dynamic e-commerce, DEFERRED |
| **Category / landing** | ~150,000 | `/parts-categories/**.html` (2–5 segments) | Faceted category pages — dynamic, mostly DEFERRED |
| **Salvage equipment** | ~4,186 | `/salvage-equipment/**.html` | Salvage yard listings by brand/model |
| **Other category groups** | ~1,560 | `/farm-shop-supplies`, `/universal-parts`, `/horticulture-tools`, `/tractor-accessories`, `/equipment-components`, `/engines-for-sale`, `/clearance` (all `.html`) | Sub-catalog category pages |
| **Content / info pages** | ~178 | `/{slug}` (root, no `.html`) | FAQ, shipping, locations, how-to articles, program pages — STATIC, good migration candidates |
| **Job postings** | ~18 | `/{slug}-{NN}` (root, no `.html`) | Careers listings |
| **Blog posts** | ~65 | `/blog`, `/blog/post/{slug}` | Editorial articles |
| **Catalog (misc)** | ~603 | `/catalog/**` | Magento system paths |

## CONFIRMED Phase 1 scope (user decision)
- **Templates to build:** (1) Homepage, (2) Content/info page (covers ~178 static pages like `/faq`, `/shipping-and-returns`, how-to articles).
- **Dynamic grids / listings** (Homepage Finder, product grids): render as **static placeholder blocks** so layout is complete; real data wired later.
- Category landing, salvage listing, and blog templates are **deferred to a later phase**.

## Phase 1 candidate templates (verified 200 OK, real content)
1. **Homepage** — `/` — hero, Homepage Finder, category showcase, trust messaging, footer
2. **Content / info page** — e.g. `/faq`, `/shipping-and-returns`, `/three-point-hitch-problems` — static text/article layout
3. **Locations page** — `/locations` — salvage yard locations listing
4. **Blog post** — `/blog/post/tractor-maintenance-checklist` — editorial article
5. **Category landing** — `/parts-categories/tractor-parts.html` — category page (dynamic product grid → treat product grid as deferred/placeholder)
6. **Salvage listing** — `/salvage-equipment/international-salvage.html` — brand salvage page

> The ~393K product pages and ~150K faceted category pages are **dynamic e-commerce** and are DEFERRED per the migration scope (content-only first pass; interactive features revisited later).
