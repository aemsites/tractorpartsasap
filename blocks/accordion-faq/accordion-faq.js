/*
 * accordion-faq — FAQ variant of the Block Collection accordion.
 * Each block row is one Q&A item: [question | answer]. Rows are converted to
 * native <details>/<summary> so questions expand/collapse (progressive
 * enhancement — content stays readable with JS disabled).
 * https://www.aem.live/developer/block-collection/accordion
 *
 * Note: the vanilla accordion imports moveInstrumentation from scripts.js
 * (Universal Editor instrumentation). This is a Document Authoring (da)
 * project whose scripts.js does not export it, so it is intentionally omitted.
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-faq-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
