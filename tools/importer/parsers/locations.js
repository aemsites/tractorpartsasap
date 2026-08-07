/* eslint-disable */
/* global WebImporter */

/**
 * Build a block table for the given name/cells. Uses WebImporter.Blocks.createBlock
 * when the global is available (real importer runtime); otherwise constructs the
 * identical table markup. On RequireJS source pages (this Magento site) the
 * importer can register as an anonymous AMD module, leaving WebImporter undefined,
 * so the fallback keeps the parser correct in production and validatable offline.
 */
function createBlockTable(doc, name, cells) {
  const wi = (typeof WebImporter !== 'undefined')
    ? WebImporter
    : (typeof globalThis !== 'undefined' ? globalThis.WebImporter : undefined);
  if (wi && wi.Blocks && typeof wi.Blocks.createBlock === 'function') {
    return wi.Blocks.createBlock(doc, { name, cells });
  }
  // Fallback: same shape createBlock emits — <table> with a header row (block
  // name, colspan = widest row) and one <tr> per row of <td> cells.
  const maxCols = cells.reduce((m, row) => Math.max(m, row.length), 1);
  const table = doc.createElement('table');
  const headRow = doc.createElement('tr');
  const th = doc.createElement('th');
  th.setAttribute('colspan', String(maxCols));
  th.textContent = name;
  headRow.appendChild(th);
  table.appendChild(headRow);
  cells.forEach((row) => {
    const tr = doc.createElement('tr');
    row.forEach((cell) => {
      const td = doc.createElement('td');
      if (Array.isArray(cell)) {
        cell.forEach((node) => { if (node) td.appendChild(node); });
      } else if (cell && cell.nodeType) {
        td.appendChild(cell);
      } else {
        td.textContent = cell == null ? '' : String(cell);
      }
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  return table;
}

/**
 * Parser for the `locations` block.
 * Source: /locations on tractorpartsasap.com. The list is Google-Maps-rendered
 * into `.location` entries (hidden until the map JS runs), so the import is run
 * against a script-stripped local snapshot that preserves the `.location` DOM.
 *
 * page-templates.json maps the selector to the LIST CONTAINER (the element that
 * holds all `.location` children), so this parser runs ONCE and emits a single
 * multi-row `locations` block — one row per location:
 *   | Retail | <h3>City, ST</h3><p>addr…</p><p>phone</p><p>More Info</p> |
 *
 * Each `.location` entry shape:
 *   div.location(.retail|.salvage)
 *     .location-info
 *       h2.name > a > span.text            (city, state)
 *       .address > p                        (multi-line address, <br> separated)
 *       .phone-numbers > p > a[href^=tel:]  (phone)
 *     .more-info > p > a[href]              ("More Info" → detail page)
 */
export default function parse(element, { document }) {
  const entries = Array.from(element.querySelectorAll('.location'));
  if (!entries.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const rows = [];
  entries.forEach((loc) => {
    const type = loc.classList.contains('salvage') ? 'Salvage' : 'Retail';

    const details = [];

    // Name → h3
    const nameText = (loc.querySelector('h2 .text') || loc.querySelector('h2, h3, .name'));
    const name = nameText ? nameText.textContent.trim() : '';
    if (name) {
      const h = document.createElement('h3');
      h.textContent = name;
      details.push(h);
    }

    // Address → p with <br> line breaks preserved.
    // Split on <br> by walking child nodes so entities (e.g. &amp;) are read as
    // decoded text via textContent — regex-stripping innerHTML would keep the
    // raw entity and cause double-escaping on re-serialization.
    const addr = loc.querySelector('.address p, .address');
    if (addr) {
      const p = document.createElement('p');
      const lines = [];
      let current = '';
      addr.childNodes.forEach((node) => {
        if (node.nodeName === 'BR') {
          lines.push(current.trim());
          current = '';
        } else {
          current += node.textContent;
        }
      });
      lines.push(current.trim());
      lines.filter(Boolean).forEach((line, i) => {
        if (i > 0) p.appendChild(document.createElement('br'));
        p.appendChild(document.createTextNode(line));
      });
      if (p.childNodes.length) details.push(p);
    }

    // Phone → p > a[tel]
    const phoneA = loc.querySelector('.phone-numbers a[href], a[href^="tel:"]');
    if (phoneA) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', phoneA.getAttribute('href'));
      a.textContent = phoneA.textContent.trim();
      p.appendChild(a);
      details.push(p);
    }

    // More Info → p > a
    const moreA = loc.querySelector('.more-info a[href]');
    if (moreA) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', moreA.getAttribute('href'));
      a.textContent = moreA.textContent.trim() || 'More Info';
      p.appendChild(a);
      details.push(p);
    }

    if (details.length) {
      rows.push([type, details]);
    }
  });

  if (!rows.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = createBlockTable(document, 'locations', rows);
  element.replaceWith(block);
}
