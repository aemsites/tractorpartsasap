/* eslint-disable */
/* global WebImporter */

/**
 * Site-wide SECTION transformer for tractorpartsasap.com (All States Ag Parts).
 *
 * Adds EDS section breaks (<hr>) and Section Metadata blocks based on the
 * template section definitions in tools/importer/page-templates.json. Runs in
 * afterTransform only (block parsers extract cells between the two hooks, so
 * inserting <hr>/tables earlier could interfere with block matching).
 *
 * Section selectors come from page-templates.json, which were themselves
 * derived from the captured DOM:
 *   homepage      : section.home-hero-section (style "grey"),
 *                   div.value-props, section.home-shop-by-categories,
 *                   section.equipment-section, section.home-about-section
 *   content-info  : div.page-hero(.faq), div.faq-contacts, div.faq-questions
 *
 * Behaviour (mirrors the reference guide + WebImporter.Blocks.createBlock):
 *   - For each section (processed in reverse so earlier insertions don't shift
 *     later anchors): resolve the first element matching any of the section's
 *     selectors.
 *   - If the section has a `style`, insert a Section Metadata block
 *     immediately BEFORE that section element (so it associates with the section
 *     that follows the preceding <hr>).
 *   - For every section except the first, insert an <hr> before the section
 *     element (and before its metadata) to mark the boundary.
 *
 * WebImporter note: the real importer runtime exposes WebImporter globally and
 * WebImporter.Blocks.createBlock builds the Section Metadata table. On
 * RequireJS source pages (this Magento site) the importer can register as an
 * anonymous AMD module, leaving WebImporter undefined; createSectionMetadata()
 * prefers the real API and otherwise builds the identical table markup
 *   <table><tr><th colspan="2">Section Metadata</th></tr><tr><td>style</td><td>…</td></tr></table>
 * so output is correct in production and validatable here.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/**
 * Build a Section Metadata block table for a given style value.
 * Uses WebImporter.Blocks.createBlock when the global is available; otherwise
 * constructs the identical table markup.
 */
function createSectionMetadata(doc, style) {
  const wi = (typeof WebImporter !== 'undefined')
    ? WebImporter
    : (typeof globalThis !== 'undefined' ? globalThis.WebImporter : undefined);
  if (wi && wi.Blocks && typeof wi.Blocks.createBlock === 'function') {
    return wi.Blocks.createBlock(doc, {
      name: 'Section Metadata',
      cells: { style },
    });
  }
  // Fallback: same shape createBlock emits.
  const table = doc.createElement('table');
  const headRow = doc.createElement('tr');
  const th = doc.createElement('th');
  th.setAttribute('colspan', '2');
  th.textContent = 'Section Metadata';
  headRow.appendChild(th);
  const dataRow = doc.createElement('tr');
  const tdKey = doc.createElement('td');
  tdKey.textContent = 'style';
  const tdVal = doc.createElement('td');
  tdVal.textContent = style;
  dataRow.appendChild(tdKey);
  dataRow.appendChild(tdVal);
  table.appendChild(headRow);
  table.appendChild(dataRow);
  return table;
}

/**
 * Resolve the first element in `root` that matches any of the section's
 * selectors (selectors array from page-templates.json).
 */
function findSectionElement(root, selectors) {
  if (!Array.isArray(selectors)) return null;
  for (let i = 0; i < selectors.length; i += 1) {
    const el = root.querySelector(selectors[i]);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  // Run in beforeTransform (NOT afterTransform): the block parsers REPLACE their
  // anchor elements (e.g. div.value-props → cards-trust block, div.faq-questions →
  // accordion-faq block) during parsing, so by afterTransform those section
  // anchors no longer exist and no <hr> gets inserted before them — merging them
  // into the preceding section (and making styled sections bleed their style onto
  // the next block). Inserting boundaries BEFORE parsing, while every anchor is
  // still present, is robust: the <hr>/Section-Metadata nodes are inert siblings
  // that match no parser selector, so they pass through parsing untouched.
  // (In the import script's transformers array, cleanup runs before this in the
  // same hook, so chrome is already gone when we resolve anchors.)
  if (hookName !== TransformHook.beforeTransform) return;

  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!sections || !Array.isArray(sections) || sections.length < 2) return;

  const doc = (payload && payload.document)
    || element.ownerDocument
    || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;

  // Resolve each section's anchor element up-front so reverse insertion is safe.
  const resolved = sections.map((section) => ({
    section,
    el: findSectionElement(element, section.selector),
  }));

  // Process in reverse so inserting before an earlier section doesn't move the
  // DOM position of later ones we've already handled.
  for (let i = resolved.length - 1; i >= 0; i -= 1) {
    const { section, el } = resolved[i];
    if (!el || !el.parentNode) continue;

    // Section Metadata (styled sections only) — inserted before the section el.
    if (section.style) {
      const meta = createSectionMetadata(doc, section.style);
      el.parentNode.insertBefore(meta, el);
    }

    // Section break before every section except the first.
    if (i > 0) {
      const hr = doc.createElement('hr');
      // Insert the <hr> before the section's metadata (if any) / the section el,
      // so order is: <hr> → [Section Metadata] → section content.
      const anchor = (section.style && el.previousElementSibling)
        ? el.previousElementSibling
        : el;
      anchor.parentNode.insertBefore(hr, anchor);
    }
  }
}
