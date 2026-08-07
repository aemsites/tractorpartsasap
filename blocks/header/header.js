import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

const SEARCH_ACTION = '/catalogsearch/result/';
const SEARCH_PLACEHOLDER = 'Search by product name or reference a part #';

/**
 * Opens or closes the slide-in navigation drawer.
 * @param {Element} nav The nav container
 * @param {boolean} [force] Optional forced state (true = open)
 */
function toggleDrawer(nav, force) {
  const open = force !== undefined ? force : nav.getAttribute('aria-expanded') !== 'true';
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.classList.toggle('nav-drawer-open', open);
  const trigger = nav.querySelector('.nav-shop-all');
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
}

/**
 * Closes the drawer when Escape is pressed.
 */
function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (nav && nav.getAttribute('aria-expanded') === 'true') {
      toggleDrawer(nav, false);
      nav.querySelector('.nav-shop-all')?.focus();
    }
  }
}

/**
 * Builds the search form. The live search is deferred (Phase 1); this posts a
 * query to the source search-results path so the control is functional.
 */
function buildSearch() {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = SEARCH_ACTION;
  form.method = 'get';

  const label = document.createElement('label');
  label.className = 'nav-search-label';
  label.setAttribute('for', 'nav-search-input');
  label.textContent = 'Search';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'nav-search-input';
  input.name = 'q';
  input.placeholder = SEARCH_PLACEHOLDER;
  input.setAttribute('aria-label', SEARCH_PLACEHOLDER);

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'nav-search-submit';
  button.setAttribute('aria-label', 'Search');

  form.append(label, input, button);
  return form;
}

/**
 * Turns a top-level list item that has a nested <ul> into an accordion group.
 * @param {Element} li The list item
 */
function decorateDrawerItem(li) {
  const submenu = li.querySelector(':scope > ul');
  if (!submenu) {
    li.classList.add('nav-leaf');
    return;
  }
  li.classList.add('nav-group');
  const link = li.querySelector(':scope > a');
  const label = link ? link.textContent : li.firstChild?.textContent?.trim();

  // Header row: the category link plus a chevron toggle for the sub-menu.
  const groupHeader = document.createElement('div');
  groupHeader.className = 'nav-group-header';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-group-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', `Toggle ${label} submenu`);

  if (link) {
    groupHeader.append(link);
  } else {
    const span = document.createElement('span');
    span.className = 'nav-group-label';
    span.textContent = label;
    groupHeader.append(span);
  }
  groupHeader.append(toggle);
  li.prepend(groupHeader);

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    li.classList.toggle('nav-group-open', !expanded);
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  let fragment = await loadFragment(navPath);
  // fall back to the local content path when the metadata path is unavailable
  if (!fragment || !fragment.firstElementChild) {
    fragment = await loadFragment('/content/nav');
  }

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Sections: [0] utility bar, [1] brand/logo, [2] navigation list, [3] tools
  const classes = ['utility', 'brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // decorateSections wraps loose content in a single .default-content-wrapper.
  // Unwrap it in every row so contents are direct children the layout and the
  // drawer decoration can address.
  ['.nav-utility', '.nav-brand', '.nav-sections', '.nav-tools'].forEach((sel) => {
    const section = nav.querySelector(sel);
    const wrapper = section?.querySelector(':scope > .default-content-wrapper');
    if (wrapper) {
      wrapper.replaceWith(...wrapper.childNodes);
    }
  });

  const navBrand = nav.querySelector('.nav-brand');
  const navSections = nav.querySelector('.nav-sections');
  const navTools = nav.querySelector('.nav-tools');

  // --- Drawer trigger ("Shop All") ---
  const shopAll = document.createElement('button');
  shopAll.type = 'button';
  shopAll.className = 'nav-shop-all';
  shopAll.setAttribute('aria-controls', 'nav');
  shopAll.setAttribute('aria-expanded', 'false');
  shopAll.innerHTML = '<span class="nav-shop-all-icon"></span><span class="nav-shop-all-label">Shop All</span>';
  shopAll.addEventListener('click', () => toggleDrawer(nav));

  // --- Drawer (navigation list) ---
  if (navSections) {
    // drawer header with title + close button
    const drawerHead = document.createElement('div');
    drawerHead.className = 'nav-drawer-header';
    const title = document.createElement('span');
    title.className = 'nav-drawer-title';
    title.textContent = 'Menu';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'nav-drawer-close';
    close.setAttribute('aria-label', 'Close menu');
    close.addEventListener('click', () => toggleDrawer(nav, false));
    drawerHead.append(title, close);
    navSections.prepend(drawerHead);

    navSections.querySelectorAll(':scope > ul > li').forEach(decorateDrawerItem);
  }

  // backdrop overlay
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.addEventListener('click', () => toggleDrawer(nav, false));

  // --- Search ---
  const search = buildSearch();

  // --- Tools (Sign In, Cart) — decorate icons ---
  if (navTools) {
    navTools.querySelectorAll('a').forEach((a) => {
      const text = a.textContent.trim().toLowerCase();
      if (text.includes('sign in') || text.includes('account')) a.classList.add('nav-account');
      if (text.includes('cart')) a.classList.add('nav-cart');
    });
  }

  window.addEventListener('keydown', closeOnEscape);
  isDesktop.addEventListener('change', () => toggleDrawer(nav, false));

  // Assemble the main row: [Shop All] [logo] [search] [tools].
  // The tools (Sign In / Cart) start life as a separate section; move them into
  // the brand row so the whole row lays out in one grid.
  if (navBrand) {
    navBrand.prepend(shopAll);
    if (search) navBrand.append(search);
    if (navTools) navBrand.append(navTools);
  }
  nav.append(backdrop);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  block.append(navWrapper);
}
