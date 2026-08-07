/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `accordion-faq` block variant.
 * Base block: accordion (Block Collection), FAQ variant.
 * Source: https://www.tractorpartsasap.com/faq  (content-info template)
 *   selectors: div.faq-questions .faq-results , div.faq-questions
 *   shape:
 *     .faq-results
 *       > .results-categoy   (note: source misspells "category" as "categoy")
 *           > h3.category-title            (category heading, e.g. "my account")
 *           > .accordion (× N)
 *               > .title > h4              (question)
 *               > .body  > .faq-body-content  (answer: <p>/<ul>/<ol>/<a>…)
 *                        > div > span > a "Read More"  (nav artifact — dropped)
 *
 * Block contract (blocks/accordion-faq/accordion-faq.js): each block row is a
 * 2-cell [question | answer]; decorate() reads row.children[0] (→ <summary>) and
 * row.children[1] (→ body), so EVERY row must have exactly 2 cells.
 *
 * Category headings can't be standalone 1-cell rows in a 2-column block, so we
 * emit them as DEFAULT CONTENT (an <h3>) preceding each category's accordion
 * block — i.e. one accordion-faq block PER category, each preceded by its <h3>.
 * The whole source element is replaced with that [h3, block, h3, block, …]
 * sequence (element.replaceWith accepts multiple nodes).
 *
 * Overlapping selectors: the two instance selectors nest (`.faq-results` lives
 * inside `.faq-questions`). The framework runs each selector with a fresh
 * querySelectorAll; once `.faq-results` is replaced, the second selector's
 * element no longer contains `.results-categoy`, so the empty-content guard
 * makes the second pass a no-op (it just unwraps the now-processed container).
 */
export default function parse(element, { document }) {
  // Category groups. Handle the source's misspelled class and a generic fallback.
  let categories = Array.from(element.querySelectorAll(':scope > .results-categoy, .results-categoy'));

  // Fallback: no category wrappers — treat the element as one flat group.
  const hasCategories = categories.length > 0;
  const groups = hasCategories
    ? categories.map((cat) => ({
        title: (cat.querySelector('.category-title, h3') || {}).textContent,
        items: Array.from(cat.querySelectorAll('.accordion')),
      }))
    : [{ title: null, items: Array.from(element.querySelectorAll('.accordion')) }];

  // Build the [h3?, block] sequence.
  const output = [];
  groups.forEach((group) => {
    const cells = [];
    group.items.forEach((item) => {
      // Question: .title h4 (fallback to .title text).
      const qEl = item.querySelector('.title h4, .title, h4');
      const questionText = qEl ? qEl.textContent.trim() : '';

      // Answer body: move the .faq-body-content children (preserves rich markup).
      const answerSource = item.querySelector('.body .faq-body-content, .faq-body-content, .body');
      const answerNodes = [];
      if (answerSource) {
        Array.from(answerSource.childNodes).forEach((n) => {
          // Skip the trailing "Read More" nav wrapper if it slipped into .body.
          if (n.nodeType === 1 && n.querySelector && n.querySelector('a') && /read more/i.test(n.textContent)) return;
          answerNodes.push(n);
        });
      }

      if (!questionText && answerNodes.length === 0) return;
      // Every row must have 2 cells; pad an empty answer so decorate() is safe.
      cells.push([questionText || '', answerNodes.length ? answerNodes : '']);
    });

    if (cells.length === 0) return;

    // Category heading as default content (preceding the block).
    if (group.title && group.title.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = group.title.trim();
      output.push(h3);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
    output.push(block);
  });

  // Empty-block guard: nothing to emit (e.g. second overlapping-selector pass).
  if (output.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  element.replaceWith(...output);
}
