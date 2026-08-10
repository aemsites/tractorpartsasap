import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Builds the newsletter subscribe form. The live newsletter is deferred
 * (Phase 1); the control is present and accessible as a placeholder.
 */
function buildNewsletter() {
  const form = document.createElement('form');
  form.className = 'footer-newsletter';

  const label = document.createElement('label');
  label.className = 'footer-newsletter-label';
  label.setAttribute('for', 'footer-newsletter-email');
  label.textContent = 'Email address';

  const input = document.createElement('input');
  input.type = 'email';
  input.id = 'footer-newsletter-email';
  input.name = 'email';
  input.placeholder = 'Email address';
  input.setAttribute('aria-label', 'Email address');

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'footer-newsletter-submit';
  button.textContent = 'Subscribe';

  form.append(label, input, button);
  return form;
}

/**
 * Regroups a footer row into explicit column elements.
 *
 * Section decoration collapses the authored column <div>s into a single
 * `.default-content-wrapper` holding a flat run of `h3 + ul/p …`, which makes
 * the grid see only one child (so every column stacks into the first cell).
 * Rebuild real columns from that flat content: a new column begins at a
 * heading boundary; any content before the first heading joins the first
 * column.
 * @param {Element} row The footer row element (grid container)
 * @param {string} colClass Class applied to each rebuilt column
 * @param {{splitAtLastHeadingOnly?: boolean}} [opts] When
 *   `splitAtLastHeadingOnly` is set, only the final heading starts a new
 *   column (for the contact row, whose first column itself contains a heading).
 */
function regroupColumns(row, colClass, opts = {}) {
  // Flatten one level of wrappers (.default-content-wrapper) so we operate on
  // the real content nodes regardless of how decoration grouped them.
  row.querySelectorAll(':scope > .default-content-wrapper').forEach((w) => {
    w.replaceWith(...w.childNodes);
  });

  const nodes = [...row.childNodes];
  const headings = nodes.filter(
    (n) => n.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/.test(n.tagName),
  );
  // The set of headings that begin a new column.
  const boundaryHeadings = opts.splitAtLastHeadingOnly
    ? new Set(headings.slice(-1))
    : new Set(headings);

  row.textContent = '';

  const columns = [];
  let current = null;
  const startColumn = () => {
    current = document.createElement('div');
    current.className = colClass;
    columns.push(current);
  };

  nodes.forEach((node) => {
    const startsColumn = boundaryHeadings.has(node);
    // Begin a fresh column at a boundary heading, or when the first real
    // element arrives; ignore stray whitespace-only text before column 1.
    if (startsColumn || (!current && node.nodeType === Node.ELEMENT_NODE)) {
      startColumn();
    }
    if (current) current.append(node);
  });

  columns.forEach((col) => row.append(col));
  return columns;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  let fragment = await loadFragment(footerPath);
  // fall back to the local content path when the metadata path is unavailable
  if (!fragment || !fragment.firstElementChild) {
    fragment = await loadFragment('/content/footer');
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Label the three top-level rows for styling.
  const rows = [...footer.children];
  if (rows[0]) rows[0].classList.add('footer-links');
  if (rows[1]) rows[1].classList.add('footer-contact');
  if (rows[2]) rows[2].classList.add('footer-legal');

  // Rebuild explicit columns for the link row so the grid can place each
  // column (decoration otherwise flattens them into one cell). The link row
  // splits cleanly at every heading (one heading + one list per column).
  if (rows[0]) regroupColumns(rows[0], 'footer-col');

  // The contact row has two columns — [logo + "Contact Us" + address/email]
  // and ["Stay Connected" + social] — so it must split only at the LAST
  // heading (the "Stay Connected" one), not at "Contact Us" in the middle.
  if (rows[1]) regroupColumns(rows[1], 'footer-contact-col', { splitAtLastHeadingOnly: true });

  // The "Industry News" column gets a newsletter form appended.
  const linkCols = rows[0] ? [...rows[0].children] : [];
  const newsletterCol = linkCols.find((col) => {
    const h = col.querySelector('h3');
    return h && /industry news/i.test(h.textContent);
  });
  if (newsletterCol) {
    newsletterCol.classList.add('footer-newsletter-col');
    newsletterCol.append(buildNewsletter());
  }

  // Tag the social list so it can be laid out as a row of icons.
  const socialList = rows[1]?.querySelector('ul');
  if (socialList) socialList.classList.add('footer-social');

  block.append(footer);
}
