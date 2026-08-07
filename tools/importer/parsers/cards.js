/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `cards` block variant.
 * Base block: cards (Block Collection).
 * Source: https://www.tractorpartsasap.com/  (homepage) — TWO instance shapes,
 * and in both the page-templates.json selector matches INDIVIDUAL TILES (not the
 * grid container), so the import framework invokes this parser once PER TILE:
 *
 *   1) Shop-by-Categories grid (16 tiles)
 *      selector: section.home-shop-by-categories .sbc-category
 *      tile shape: .row > .sbc-image > img
 *                       > nav.sbc-nav > .sbc-nav-title (category title)
 *                                     > ul > li > a[href] > span (sub-links)
 *
 *   2) Equipment / Salvage showcase (4 tiles)
 *      selector: section.equipment-section .grid-cms-slider .slide-container
 *      tile shape: a[href] > .slide > img
 *                                   > .slide-text > h3 (heading) + p (description)
 *
 * Library convention (library-description.txt → "Cards"): 2 columns, one row per
 * card: [image] [text]. blocks/cards/cards.js renders a picture-only cell as the
 * image cell and the other as the body. Each matched tile → ONE 2-column card row
 * emitted as its own single-card `cards` block (the framework calls parse() per
 * tile, so consolidating siblings here would double-process / mis-capture).
 */
export default function parse(element, { document }) {
  // ---- Detect tile shape -------------------------------------------------
  const isSbc = element.matches('.sbc-category') || element.querySelector('.sbc-nav, .sbc-image');
  // (equipment tile otherwise: .slide-container with an inner anchor + .slide-text)

  // ---- Column 1: image ---------------------------------------------------
  const img = element.querySelector('img');

  // ---- Column 2: text ----------------------------------------------------
  const bodyEls = [];

  if (isSbc) {
    // Category title as a heading.
    const titleEl = element.querySelector('.sbc-nav-title');
    const titleText = titleEl ? titleEl.textContent.trim() : '';
    if (titleText) {
      const h = document.createElement('h3');
      h.textContent = titleText;
      bodyEls.push(h);
    }
    // Sub-links list: rebuild a clean <ul><li><a href>label</a></li> list.
    const links = Array.from(element.querySelectorAll('nav.sbc-nav ul li a[href], .sbc-nav ul li a[href]'));
    if (links.length) {
      const ul = document.createElement('ul');
      const seen = new Set();
      links.forEach((link) => {
        const href = link.getAttribute('href');
        const label = (link.querySelector('span') || link).textContent.trim();
        if (!href || !label || seen.has(href + '|' + label)) return;
        seen.add(href + '|' + label);
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = label;
        li.appendChild(a);
        ul.appendChild(li);
      });
      if (ul.children.length) bodyEls.push(ul);
    }
  } else {
    // Equipment tile: heading + description, linked via the tile anchor.
    const anchor = element.querySelector('a[href]');
    const href = anchor ? anchor.getAttribute('href') : null;
    const headingEl = element.querySelector('.slide-text h3, h3, h2');
    const descEl = element.querySelector('.slide-text p, p');
    const headingText = headingEl ? headingEl.textContent.trim() : '';
    const descText = descEl ? descEl.textContent.trim() : '';

    if (headingText) {
      const h = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = headingText;
        h.appendChild(a);
      } else {
        h.textContent = headingText;
      }
      bodyEls.push(h);
    }
    if (descText) {
      const p = document.createElement('p');
      p.textContent = descText;
      bodyEls.push(p);
    }
    // If there is a link but no heading text, still surface the CTA.
    if (!headingText && href) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = (anchor.textContent.trim() || href);
      p.appendChild(a);
      bodyEls.push(p);
    }
  }

  // Empty-block guard: neither image nor text found.
  if (!img && bodyEls.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // One 2-column card row: [image] [text]. Pad missing cells so the row width
  // is always 2 (per library convention).
  const cells = [[img || '', bodyEls.length ? bodyEls : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
