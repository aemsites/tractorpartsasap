import { buildBlock, getMetadata } from './aem.js';

// Catalog Service Fetch GraphQL Instance, created lazily so pages without a
// sku (e.g. 404.html) never need to resolve `@dropins/*` module specifiers.
let csFetchGraphQL = null;
let productDataPromise = null;

/**
 * Returns the Catalog Service Fetch GraphQL instance, configured by
 * initializeCommerce(). Only meaningful after that has resolved.
 * @returns {Object|null}
 */
export function getFetchGraphQL() {
  return csFetchGraphQL;
}

/**
 * Returns the product data promise created while detecting the product-bus
 * page during the eager phase, if any, so the PDP initializer can reuse it
 * instead of fetching the same SKU again.
 * @returns {Promise<Object|null>|null}
 */
export function getProductDataPromise() {
  return productDataPromise;
}

/**
 * Fetches config from remote and saves in session, then returns it, otherwise
 * returns if it already exists.
 * @returns {Promise<Object>} - The config JSON from session storage
 */
export async function getConfigFromSession() {
  const configURL = `${window.location.origin}/config.json`;

  try {
    const configJSON = window.sessionStorage.getItem('config');
    if (!configJSON) {
      throw new Error('No config in session storage');
    }

    const parsedConfig = JSON.parse(configJSON);
    if (
      !parsedConfig[':expiry']
      || parsedConfig[':expiry'] < Math.round(Date.now() / 1000)
    ) {
      throw new Error('Config expired');
    }
    return parsedConfig;
  } catch (e) {
    const config = await fetch(configURL);
    if (!config.ok) throw new Error('Failed to fetch config');
    const configJSON = await config.json();
    configJSON[':expiry'] = Math.round(Date.now() / 1000) + 7200;
    window.sessionStorage.setItem('config', JSON.stringify(configJSON));
    return configJSON;
  }
}

/**
 * Creates a short hash from an object by sorting its entries and hashing them.
 * @param {Object} obj - The object to hash
 * @param {number} [length=5] - Length of the resulting hash
 * @returns {string} A short hash string
 */
function createHashFromObject(obj, length = 5) {
  const objString = Object.entries(obj)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');

  return objString
    .split('')
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 2147483647, 0)
    .toString(36)
    .slice(0, length);
}

/**
 * Initializes commerce configuration: loads config.json and points the Catalog
 * Service GraphQL client at the configured endpoint/headers. Imports the
 * `@dropins/tools` config/GraphQL modules dynamically, so pages that never
 * call this (no sku meta tag) don't need the dropins import map at all.
 */
export async function initializeCommerce() {
  const [
    { getHeaders, getConfigValue, initializeConfig },
    { FetchGraphQL },
  ] = await Promise.all([
    import('@dropins/tools/lib/aem/configs.js'),
    import('@dropins/tools/fetch-graphql.js'),
  ]);

  initializeConfig(await getConfigFromSession());

  const headers = getHeaders('cs');
  const urlWithQueryParams = new URL(getConfigValue('commerce-endpoint'));
  urlWithQueryParams.searchParams.append('cb', createHashFromObject(headers));

  csFetchGraphQL = new FetchGraphQL();
  csFetchGraphQL.setEndpoint(urlWithQueryParams);
  csFetchGraphQL.setFetchGraphQlHeaders((prev) => ({ ...prev, ...getHeaders('cs') }));
}

/**
 * Fetches and merges placeholder data from multiple sources with intelligent caching.
 * @param {string} [path] - Optional path to a specific placeholders file to include in the merge.
 * @returns {Promise<Object>} A promise that resolves the merged placeholders object.
 */
export async function fetchPlaceholders(path) {
  window.placeholders = window.placeholders || {};
  window.placeholders.pending = window.placeholders.pending || {};
  window.placeholders.merged = window.placeholders.merged || {};

  if (!path) {
    return Promise.resolve(window.placeholders.merged || {});
  }

  if (window.placeholders.pending[path]) {
    return window.placeholders.pending[path];
  }

  const fetchPromise = fetch(`/${path}?sheet=data`, { cache: 'force-cache' })
    .then(async (response) => {
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to fetch placeholders from ${path}: HTTP ${response.status} ${response.statusText}`);
        return {};
      }
      const json = await response.json();
      if (!json.data?.length) return {};

      const data = {};
      json.data.forEach(({ Key, Value }) => {
        if (Key && Value !== undefined) data[Key] = Value;
      });

      const placeholders = {};
      Object.entries(data).forEach(([Key, Value]) => {
        const keys = Key.split('.');
        const lastKey = keys.pop();
        let target = placeholders;
        keys.forEach((key) => {
          target[key] = target[key] || {};
          target = target[key];
        });
        target[lastKey] = Value;
      });

      return Object.assign(window.placeholders.merged, placeholders);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`Error loading placeholders for path: ${path}`, error);
      return {};
    })
    .finally(() => {
      delete window.placeholders.pending[path];
    });

  window.placeholders.pending[path] = fetchPromise;
  return fetchPromise;
}

/**
 * Gets the product SKU from the page's meta tag, set by product bus ingestion.
 * @returns {string|null} The SKU, or null if not found
 */
export function getProductSku() {
  return getMetadata('sku');
}

// product bus variant sections have data-sku before decorateMain runs
const isGeneratedSection = (section) => !section.querySelector(':scope > div[class]') || section.dataset.sku;

/**
 * Marks the first image of the product-bus generated content as a priority
 * LCP candidate, synchronously and before any async work (product data
 * fetch, dropin imports) runs. The image is otherwise stuck at
 * `loading="lazy"` - as rendered by product-bus - until
 * extractSsrGalleryImages/renderSsrGallery re-marks it after that async work
 * resolves, which needlessly delays the browser fetching it by however long
 * that work takes. This leaves the section itself untouched (no removal),
 * since that still depends on whether product data comes back.
 * @param {Element} main The main element
 */
function prioritizeFirstGalleryImage(main) {
  let section = main.querySelector(':scope > div:first-child');
  while (section && isGeneratedSection(section)) {
    const img = section.querySelector('picture img');
    if (img) {
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
      return;
    }
    section = section.nextElementSibling;
  }
}

/**
 * Ensures a product-details block is present on any page with a sku meta tag.
 * On product bus pages, the generated content (h1, price, images,
 * description) arrives as one or more leading sections with no authored
 * blocks inside them, so every such section is stripped, along with variant
 * sections, before the product-details block is built. Stripping stops as
 * soon as a section containing an authored block is found.
 *
 * The block is built synchronously, and wraps that already-rendered content
 * as-is (untouched, unparsed) rather than waiting on product data - so real
 * content is visible immediately instead of an empty placeholder. It's up to
 * the product-details block itself to inspect what's there and decide what
 * to keep versus fill in with the PDP dropin once product data resolves; see
 * blocks/product-details/product-details.js. The full product data fetch
 * (price, attributes, stock, interactivity) is kicked off in the background;
 * see getProductDataPromise().
 * @param {Element} main The main element
 */
export function buildProductDetailsBlock(main) {
  const sku = getProductSku();
  if (!sku) return;

  prioritizeFirstGalleryImage(main);

  const ssrContent = [];
  let section = main.querySelector(':scope > div:first-child');
  while (section && isGeneratedSection(section)) {
    ssrContent.push(...section.children);
    const next = section.nextElementSibling;
    section.remove();
    section = next;
  }
  // defensively catch any stray variant sections left after authored content
  main.querySelectorAll(':scope > div[data-sku]').forEach((div) => div.remove());

  if (!main.querySelector('.product-details')) {
    const block = buildBlock('product-details', { elems: ssrContent });
    const targetSection = main.querySelector(':scope > div:first-child');
    if (targetSection) {
      targetSection.prepend(block);
    } else {
      const newSection = document.createElement('div');
      newSection.append(block);
      main.prepend(newSection);
    }
  }

  // Fetch full product data (price, attributes, stock, interactivity) in the
  // background - initializers/pdp.js awaits getProductDataPromise() once the
  // dropin bundle loads. Assigning the whole chain (not just the eventual
  // fetchProductData call) synchronously here means getProductDataPromise()
  // never returns null to a caller that runs before this resolves.
  productDataPromise = initializeCommerce()
    .then(() => import('@dropins/storefront-pdp/api.js'))
    .then(({ setEndpoint, fetchProductData }) => {
      setEndpoint(csFetchGraphQL);
      return fetchProductData(sku, { skipTransform: true });
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error('Error fetching product data:', e);
      return null;
    });
}

/**
 * Detects the page type based on DOM elements
 * @returns {string} The detected page type
 */
function detectPageType() {
  if (document.body.querySelector('main .product-details')) {
    return 'Product';
  }
  return 'CMS';
}

/**
 * Loads commerce-specific eager content: on product pages, imports the PDP
 * initializer that fetches product data and mounts the dropin.
 */
export async function loadCommerceEager() {
  if (detectPageType() === 'Product') {
    // eslint-disable-next-line import/no-cycle
    await import('./initializers/pdp.js');
  }
}
