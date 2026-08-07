/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `cards-trust` block variant.
 * Base block: cards (Block Collection) — horizontal value-prop / trust bar.
 * Source: https://www.tractorpartsasap.com/  (homepage value-props strip)
 *   selector: div.value-props
 *   shape: .value-props .info-section .info-wrapper > N × .info-block (separated by
 *          .divider). Each .info-block =
 *            .info-content > div > img[alt]           (icon)
 *                          > a > span.info-title      (bold title)
 *                          > span.info-subtext        (one-line subtext)
 *          Items: Trusted Partner / Excellent Service / Exceptional Quality.
 *
 * Library convention (library-description.txt → "Cards"): 2 columns, one row per
 * card: [image/icon] [text]. blocks/cards-trust/cards-trust.js renders a cell
 * with only a <picture> as the image cell and the other as the body (bold title +
 * subtext). → 2-column block, [icon][title+subtext] per row.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.info-block'));

  const cells = [];
  items.forEach((item) => {
    // Icon image.
    const img = item.querySelector('img');

    // Title text (bold): span.info-title (fall back to the anchor text).
    const titleEl = item.querySelector('.info-title, a');
    const titleText = titleEl ? titleEl.textContent.trim() : '';

    // One-line subtext.
    const subtextEl = item.querySelector('.info-subtext');
    const subtextText = subtextEl ? subtextEl.textContent.trim() : '';

    if (!img && !titleText && !subtextText) return;

    // Column 1: image/icon cell.
    const imageCell = img || '';

    // Column 2: text cell — bold title (as heading) + subtext paragraph.
    const bodyEls = [];
    if (titleText) {
      const h = document.createElement('h3');
      h.textContent = titleText;
      bodyEls.push(h);
    }
    if (subtextText) {
      const p = document.createElement('p');
      p.textContent = subtextText;
      bodyEls.push(p);
    }

    cells.push([imageCell, bodyEls]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-trust', cells });
  element.replaceWith(block);
}
