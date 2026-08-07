/**
 * locations block — directory of retail stores and salvage yards.
 * Source: /locations on tractorpartsasap.com (a Google-Map-backed list; the
 * live map is deferred, this renders the location cards).
 *
 * Initial (authored) structure — one row per location, two cells:
 *   | Retail        | <h3>De Soto, IA</h3>
 *   |               | <p>PO Box 249<br>10 Ellefson Drive<br>De Soto, IA 50069</p>
 *   |               | <p><a href="tel:866-609-1260">866-609-1260</a></p>
 *   |               | <p><a href="/de-soto-tractor-parts">More Info</a></p>
 *
 * Cell 1 is the location type ("Retail" or "Salvage") and drives the marker
 * colour; cell 2 holds the card content. Decorates into a responsive grid.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    // First cell = type; remaining cell(s) = details. Fall back gracefully if
    // a single-cell row is authored.
    let type = '';
    let details;
    if (cells.length > 1) {
      type = cells[0].textContent.trim().toLowerCase();
      [, details] = cells;
    } else {
      [details] = cells;
    }

    const li = document.createElement('li');
    li.className = 'locations-card';
    if (type === 'retail' || type === 'salvage') li.classList.add(type);

    // marker + name header
    const name = details.querySelector('h1, h2, h3, h4, h5, h6');
    if (name) {
      name.classList.add('locations-card-name');
      const marker = document.createElement('span');
      marker.className = 'locations-card-marker';
      marker.setAttribute('aria-hidden', 'true');
      name.prepend(marker);
    }

    while (details.firstElementChild) li.append(details.firstElementChild);

    // Tag the phone and "More Info" links for styling.
    li.querySelectorAll('a[href^="tel:"]').forEach((a) => {
      a.closest('p')?.classList.add('locations-card-phone');
    });
    li.querySelectorAll('a:not([href^="tel:"])').forEach((a) => {
      if (/more info/i.test(a.textContent)) {
        a.classList.add('locations-card-more');
        a.closest('p')?.classList.add('locations-card-more-wrapper');
      }
    });
    // The first non-heading, non-phone, non-more paragraph is the address.
    li.querySelectorAll('p').forEach((p) => {
      if (!p.classList.contains('locations-card-phone')
        && !p.classList.contains('locations-card-more-wrapper')) {
        p.classList.add('locations-card-address');
      }
    });

    ul.append(li);
  });

  block.replaceChildren(ul);
}
