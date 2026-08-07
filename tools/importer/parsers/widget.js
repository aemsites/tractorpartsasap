/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `widget` block variant.
 * Base block: widget (custom project block — no library convention).
 * Source: https://www.tractorpartsasap.com/  (homepage "Find Parts" band)
 * Template selectors (page-templates.json → homepage → widget.instances):
 *   .part-finder , .homepage-finder , .amfinder-common-wrapper
 *
 * WHY THIS IS MINIMAL:
 * The source is a Magento "Amasty Finder" (amfinder) interactive parts finder —
 * a <form> with cascading <select>s (Type/Make/Model/…), Go/Reset buttons and a
 * cross-sell mini-promo. That is a DEFERRED interactive experience, not static
 * content. The EDS `widget` block (blocks/widget/widget.js) is an autoblock shell
 * that reads a SINGLE `a[href*="/widgets/…"]`, derives the widget name from the
 * path, then fetches and mounts `/widgets/<name>.html|css|js` at runtime.
 *
 * So the parser deliberately discards the amfinder DOM and emits one cell holding
 * a link to the placeholder widget asset `/widgets/homepage-finder.html`. The
 * heavy finder markup is intentionally NOT imported (a low content-completeness
 * score here is expected and correct — the interactive widget is rebuilt at runtime).
 *
 * Instances note: the three selectors are nested inside `.part-finder`; the import
 * framework runs each selector with a fresh querySelectorAll, so once `.part-finder`
 * (first selector) is replaced the inner selectors match nothing and only ONE widget
 * block is produced. The guard below also prevents any double-emission.
 */
export default function parse(element, { document }) {
  // Idempotency guard: if a widget placeholder link already exists as a sibling
  // (element already handled via an outer selector), bail without adding a second.
  const parent = element.parentElement;
  if (parent && parent.querySelector('a[href*="/widgets/homepage-finder.html"]')) {
    element.remove();
    return;
  }

  // Preserve the authored finder title as the link label when present
  // (`.amfinder-title` = "Homepage Finder", `.part-finder__title` = "Find Parts").
  const titleEl = element.querySelector('.amfinder-title, .part-finder__title');
  const label = (titleEl && titleEl.textContent.trim()) || 'Homepage Finder';

  const link = document.createElement('a');
  link.setAttribute('href', '/widgets/homepage-finder.html');
  link.textContent = label;

  // widget is a single-column block: one row, one cell holding the link.
  const cells = [[[link]]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'widget', cells });
  element.replaceWith(block);
}
