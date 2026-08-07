# Tractor Parts ASAP — Homepage + Key Templates Migration Plan

Migrate **allstatesag / tractorpartsasap.com** ("All States Ag Parts") onto this AEM Edge Delivery Services repo (`aemsites/tractorpartsasap`). This first phase covers the **homepage plus a few representative templates**, establishing the reusable infrastructure (blocks, parsers, transformers, import script) that later phases will extend.

## Scope & Decisions

- **CONFIRMED Phase 1 templates:** (1) **Homepage** end-to-end, (2) **Content/info page** template (covers ~178 static pages: `/faq`, `/shipping-and-returns`, how-to articles, program pages). Global header + footer. Site design system (tokens, typography, colors).
- **Dynamic grids/listings** (Homepage Finder, product grids, search, cart): rendered as **static placeholder blocks** so layout is complete; real data wired in a later phase.
- **Deferred to later phases:** Category-landing, salvage-listing, and blog templates; full product/category catalog (~543K dynamic pages); interactive e-commerce rebuild.
- **Target repo:** `github.com/aemsites/tractorpartsasap`, branch `main`. Preview org/site: `aemsites/tractorpartsasap`.
- **Existing assets in repo:** boilerplate blocks (`cards`, `columns`, `hero`, `header`, `footer`, `fragment`) plus a custom `widget` autoblock (loads `/widgets/*` HTML+CSS+JS on demand). `content/` is empty; no import tooling exists yet.

## Approach

Content-driven migration using the standard EDS import pipeline: **discover → analyze → map blocks → build import infrastructure → import content → apply design → instrument nav/footer → validate.** Static HTML is generated only via the bundled import script (never hand-authored), then previewed at the local dev server.

## Discovery Findings (Steps 1–2 complete)

- **Project type:** `da` (Document Authoring — content published to `admin.da.live/source/aemsites/tractorpartsasap/…`). **Block Library:** `https://main--sta-boilerplate--aemdemos.aem.page/tools/sidekick/library.json`.
- **Source platform:** Magento (Classy Llama). **547,114 URLs** in sitemap.
- Breakdown: ~393K product pages, ~150K faceted category pages (both dynamic → deferred), ~4.2K salvage, ~1.5K other category landings, **~178 static content/info pages** (Phase 1 target), ~65 blog posts, ~18 job postings.
- Full inventory: `.migration/site-catalog.md`; raw URL list: `.migration/all-urls.txt`.

## Checklist

### 1. Setup & Confirmation ✅ DONE
- [x] Confirm project type (`da` — Document Authoring) and Block Library endpoint
- [x] Verify dev server runs (`aem up`) and repo lints clean (`npm run lint`)
- [x] Confirm Phase 1 templates: Homepage + Content/info page; dynamic grids → static placeholders

### 2. Site Discovery & Cataloging ✅ DONE
- [x] Discover URLs via sitemap (547,114 URLs)
- [x] Catalog pages into templates; identify homepage + content/info template
- [x] Record representative URLs (see `.migration/site-catalog.md`)

### 3. Per-Template Page Analysis ✅ DONE
- [x] Scrape homepage + `/faq` — HTML, metadata, images, cleaned HTML (artifacts in `migration-work/homepage/` & `migration-work/faq/`)
- [x] Identify section boundaries and content sequences per page
- [x] Decide default content vs. blocks for each sequence
- [x] Mark the Homepage Finder + search/cart as deferred/placeholder regions

**Analysis results:**
- *Homepage sections:* Find-Parts/Promo hero band, Value-props trust strip, Shop-by-Categories (16 tiles), Salvage/Equipment showcase (4 tiles), About/SEO copy.
- *Homepage blocks:* reused `hero`, `cards`, `widget`; **new** `cards-quicklinks`, `cards-trust`. Deferred/placeholder: Homepage Finder (via `widget`), search + cart (header instrumentation).
- *Content/info template (`/faq`):* Page hero → "Talk to us" default content → FAQ accordion. Reused `hero`; **new** `accordion-faq` (adapted from Block Collection accordion; removed xwalk-only `moveInstrumentation`). Generalizes well to the ~178 content pages (hero + default content + optional accordion).
- All new blocks lint clean.

### 4. Block Selection & Variant Management ✅ DONE
- [x] Survey available blocks (repo + Block Collection) and match to identified sequences
- [x] Reuse existing blocks where an ~80% fit exists; define new block variants only where needed
- [x] Record block mappings (DOM selectors) into `tools/importer/page-templates.json` (schema-validated)
- [x] Cache per-block source HTML in `migration-work/block-context/` for parser generation

**Mappings recorded (2 templates):**
- *homepage:* `widget` (Finder placeholder), `hero` (promo banner), `cards-quicklinks`, `cards-trust`, `cards` (category grid + equipment showcase) across 5 sections (hero band = grey).
- *content-info:* `hero` (page banner), `accordion-faq` (17 Q&A / 6 categories), + default-content intro. 3 sections.

### 5. Import Infrastructure ✅ DONE
- [x] Generate block parsers for each block variant (6: widget, hero, cards-quicklinks, cards-trust, cards, accordion-faq)
- [x] Generate page transformers: `tractorpartsasap-cleanup.js` (chrome/consent/carousel-clone removal) + `tractorpartsasap-sections.js` (section breaks + Section Metadata). No DM/Scene7 transformer (no such URLs).
- [x] Build import scripts: `import-homepage.js` + `import-content-info.js` (orchestrate parsers + transformers per template)
- [x] All syntax-checked, imports resolve, repo lints clean

**Note:** Validation harness can't bind `WebImporter` global on this Magento/RequireJS source; parsers/transformers use the real API at import runtime with a verified fallback. Actual import run will confirm output (Step 6).

### 6. Content Import ✅ DONE
- [x] Run bulk import for homepage + content/info page into `content/` (`index.plain.html`, `faq.plain.html`)
- [x] Verify generated HTML follows EDS section/block conventions

**Import notes & fixes:**
- Source is Magento/RequireJS: `window.define` is non-configurable, so the shared runner's `delete window.define` no-ops and the helix-importer bundle fails to bind `WebImporter` on the live URL. Worked around by importing from **script-stripped local copies** of each page (served on a local static server) — RequireJS never runs, bundle binds correctly. (Runner itself is outside the workspace / not editable; root cause documented.)
- Fixed 4 post-import defects: (1) copyright bar (`.copyright-section`, sibling after `</footer>`) leaked → added to cleanup; (2) FAQ jump-nav (`.faqs-sidebar`) leaked → added to cleanup; (3) equipment cards had empty image cells (source uses CSS `background-image`, not `<img>`) → cards parser now synthesizes `<img>` from the bg URL (all 4 restored); (4) styled section bled into next block because section transformer ran in `afterTransform` after parsers replaced anchors → moved section boundary insertion to `beforeTransform`.
- Final: Homepage = 5 sections (grey hero band, trust strip, 16 category cards, 4 equipment cards, About copy) + metadata. FAQ = hero + intro + 6 accordion-faq blocks + metadata. FAQ completeness 99.1%; homepage 76.4% (expected — deferred Finder placeholder + removed chrome). Lint clean.

### 7. Design System Migration ✅ DONE
- [x] Extract design tokens (colors, typography, spacing) from the source site into `styles/` (brand.css)
- [x] Style each migrated block to match the original (visual verification pass). Fixed FAQ hero (invisible white-on-white → dark band). Added `/widgets/homepage-finder.*` static placeholder so the Find Parts panel renders (was leaking the 404 page).

### 8. Navigation & Footer ✅ DONE
- [x] Instrument the header/navigation (slide-in drawer + accordion sub-menus, 125-link tree, logo, search, phone, Sign In, Cart; desktop + mobile). `content/nav.plain.html` + `blocks/header/*`.
- [x] Build the footer (4 link columns, newsletter placeholder, contact/logo, social icons, copyright). `content/footer.plain.html` + `blocks/footer/*`.
- Note: built as a faithful/pragmatic match (user decision), not the exhaustive nav-orchestrator enforcement gates.

### 9. Validation & QA ✅ DONE
- [x] Previewed both pages locally (`/content/index`, `/content/faq`) and on the deployed preview; compared against original
- [x] Header drawer/accordion/close, footer, accordion-faq expand, Find Parts widget all verified interactive
- [x] `npm run lint` clean; `lang=en`, alt text present, no broken images, heading hierarchy sound

### 10. Delivery ✅ DONE
- [x] Code committed + pushed to `main` (`22994b7`); AEM Code Sync deployed (force-synced code so `scripts/`+`head.html` deployed)
- [x] Deployed preview renders fully styled/decorated: `https://main--tractorpartsasap--aemsites.aem.page/` and `/faq`
- Note: repo uses auto-commit-to-main (no feature-branch/PR flow; `gh` unavailable). Content uploaded to Document Authoring separately.

## Deferred / Later Phases
- Interactive Homepage Finder, search, and cart (rebuild-as-block decision pending)
- Full product & category catalog import (~543K dynamic pages)
- Category-landing, salvage-listing, and blog templates
- Remaining content pages beyond the content/info template

---
*Steps 1–2 complete. Next: Step 3 — scrape and analyze the homepage and a representative content/info page (`/faq`).*
