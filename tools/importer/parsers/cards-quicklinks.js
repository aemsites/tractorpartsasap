/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `cards-quicklinks` block variant.
 * Base block: cards (Block Collection) — "no images" text-only variant.
 * Source: https://www.tractorpartsasap.com/  (homepage hero band quick-links)
 *   selector: section.home-hero-section .featured-categories
 *   shape: .featured-categories > .row > N × .category > a[href]  (bordered link tiles:
 *          Recent Salvage, Universal Parts, Tractor Accessories, View Catalogs)
 *
 * Library convention (library-description.txt → "Cards (no images)"): 1 column,
 * one row per card, each cell holds text content (here: a single link).
 * blocks/cards-quicklinks/cards-quicklinks.js turns each block row into an <li>,
 * classing a cell with only a <picture> as the image cell — these tiles have no
 * image, so every cell is a body cell holding the link. → 1-column block.
 */
export default function parse(element, { document }) {
  // Each quick-link tile is a `.category` wrapper containing one anchor.
  const tiles = Array.from(element.querySelectorAll(':scope > .row > .category, :scope .category'));

  const cells = [];
  const seen = new Set();
  tiles.forEach((tile) => {
    const link = tile.querySelector('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || seen.has(href)) return; // de-dupe if selectors overlap
    seen.add(href);
    // Emit a clean anchor (drop wrapper markup); 1-column → one cell per row.
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = link.textContent.trim();
    cells.push([[a]]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-quicklinks', cells });
  element.replaceWith(block);
}
