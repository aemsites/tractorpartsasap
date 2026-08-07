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

  // The "Industry News" column gets a newsletter form appended.
  const columns = rows[0] ? [...rows[0].children] : [];
  const newsletterCol = columns.find((col) => {
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
