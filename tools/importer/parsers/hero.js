/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `hero` block variant.
 * Base block: hero (Block Collection).
 * Sources:
 *   - homepage promo band: https://www.tractorpartsasap.com/
 *       selector: section.home-hero-section .home-hero .widget-cms-slideshow
 *       shape: owl-carousel slideshow. Each slide = background <img> wrapped in a
 *       clickable <a href> (the promo "Shop Now" banner). Slides are duplicated as
 *       .owl-item.cloned; we take ONE representative (active) slide so the image is
 *       not emitted 5×.
 *   - content-info / FAQ page hero: https://www.tractorpartsasap.com/faq
 *       selector: div.page-hero.faq , div.page-hero
 *       shape: background <img> + <h1> ("We’re here to help"). No CTA.
 *
 * Library convention (library-description.txt): hero = 1 column, 3 rows.
 *   row 1: block name (added by createBlock)
 *   row 2: background image (optional)
 *   row 3: title (heading) + subheading + CTA (all optional)
 * → single-column block: every content row is ONE cell.
 *
 * The two source shapes are detected at runtime so the single hero.js works for
 * both the homepage slideshow instance and the FAQ page-hero instance.
 */
export default function parse(element, { document }) {
  // If this is a carousel slideshow, narrow to a single representative slide so
  // cloned duplicate slides don't multiply the background image / CTA.
  const isSlideshow = element.matches('[class*="slideshow"], .widget-carousel')
    || element.querySelector('.slide-content, .owl-item');
  let scope = element;
  if (isSlideshow) {
    scope = element.querySelector('.owl-item.active .slide-content')
      || element.querySelector('.slide-content')
      || element.querySelector('.owl-item.active')
      || element;
  }

  // Background image: first <img> in the chosen scope.
  const bgImage = scope.querySelector('img');

  // Title: real heading (FAQ page-hero has an <h1>; slideshow has none).
  const heading = scope.querySelector('h1, h2, h3');

  // Optional subheading (page heroes sometimes carry a lead paragraph).
  const subheading = scope.querySelector('p');

  // CTA: the promo banner wraps the slide in an <a href>. Its visible text is a
  // non-breaking space in source, so fall back to "Shop Now" (the promo's intent,
  // per the banner artwork) to produce a usable button. FAQ hero has no CTA.
  const ctaSource = scope.querySelector('a[href]');
  let cta = null;
  if (ctaSource) {
    const href = ctaSource.getAttribute('href');
    const label = ctaSource.textContent.replace(/ /g, ' ').trim();
    if (href) {
      cta = document.createElement('a');
      cta.setAttribute('href', href);
      cta.textContent = label || 'Shop Now';
    }
  }

  // Empty-block guard: nothing meaningful to emit.
  if (!bgImage && !heading && !cta) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Row 2: background image (own cell) when present.
  if (bgImage) cells.push([bgImage]);

  // Row 3: single cell holding heading + subheading + CTA.
  const contentCell = [];
  if (heading) contentCell.push(heading);
  // Only include a distinct subheading paragraph (skip if it is the CTA wrapper).
  if (subheading && !subheading.contains(ctaSource) && subheading.textContent.trim()) {
    contentCell.push(subheading);
  }
  if (cta) contentCell.push(cta);
  if (contentCell.length) cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
