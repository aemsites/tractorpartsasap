import {
  buildBlock,
  getMetadata,
} from './aem.js';

/**
 * Gets the product SKU from metadata.
 * @returns {string|null} The SKU from metadata, or null if not found
 */
export function getProductSku() {
  return getMetadata('sku');
}

/**
 * Gets the SSR-rendered product description element, if one was found in the page.
 * Callers should only remove this element once they've confirmed a replacement
 * (e.g. the PDP drop-in's description) has rendered successfully, so the SSR
 * markup continues to serve as a fallback until then.
 * @returns {Element|null} The description div, or null if not found
 */
export function getSsrDescriptionElement() {
  return window.ssrDescriptionElement || null;
}

/**
 * Extracts pricing from a JSON-LD offer object.
 * @param {Object} offer - A schema.org Offer from the JSON-LD data
 * @returns {Object|null} An object containing the final and regular price.
 */
export function getOfferPricing(offer) {
  if (!offer) return null;
  return {
    final: parseFloat(offer.price),
    // Reconditioned products carry the original (pre-reconditioned) price in
    // custom.originalPrice and use it as the regular/was price. Fall back to the
    // offer's list price when originalPrice is not present.
    regular: offer.custom?.originalPrice
      ? parseFloat(offer.custom.originalPrice)
      : (offer.priceSpecification?.price || null),
  };
}

/**
 * Parses product variant sections from the page markup.
 * @param {Element[]} sections The product variant sections
 * @returns {Object[]} The parsed product variants
 */
function parseVariants(sections) {
  return sections.map((div) => {
    const name = div.querySelector('h2')?.textContent.trim();

    const metadata = {};
    const options = {};

    options.uid = div.dataset.uid;
    options.color = div.dataset.color;
    metadata.sku = div.dataset.sku;

    const imagesHTML = div.querySelectorAll('picture');

    const ldVariant = window.jsonLdData.offers.find((offer) => offer.sku === metadata.sku);
    const price = getOfferPricing(ldVariant);
    if (ldVariant) {
      metadata.itemCondition = ldVariant.itemCondition;
      metadata.availability = ldVariant.availability;
      metadata.custom = ldVariant.custom;
    }

    return {
      ...metadata,
      name,
      options,
      price,
      images: imagesHTML,
    };
  });
}

/**
 * Ensures a product-details block is present on any page with a sku meta tag.
 * @param {Element} main The main element
 */
export function buildProductDetailsBlock(main) {
  if (!getProductSku()) return;

  // Get the json-ld from the head and parse it
  const jsonLd = document.head.querySelector('script[type="application/ld+json"]');
  window.jsonLdData = jsonLd ? JSON.parse(jsonLd.textContent) : null;

  const variantSections = Array.from(main.querySelectorAll(':scope > div.section'));

  // Parse variants using the appropriate parser
  window.variants = parseVariants(variantSections);

  // Product-bus markup, prior to decoration, is: an images div, an optional
  // description div, any authored-content divs, then the variant divs (the
  // ones matched above, each carrying the "section" class already). The
  // description - when present - is always the div immediately following the
  // images div, and (unlike variant divs) has no "section" class yet.
  // STOPGAP: there's currently no way to distinguish a generated description
  // div from an authored-content div by markup alone, so a page with no
  // description but WITH authored content will have that content
  // misidentified as the description. We've asked the product-bus team to
  // mark the generated div (e.g. with an id) so this can be done reliably;
  // switch to that marker once it's available.
  const topLevelDivs = Array.from(main.querySelectorAll(':scope > div'));
  const descriptionDiv = topLevelDivs[1];
  const isSsrDescription = descriptionDiv && !descriptionDiv.classList.contains('section');
  // Keep a reference to the element itself so it can be removed later, once
  // the block has confirmed a replacement rendered successfully. Do not
  // remove/hide it here: it must keep serving as a no-JS/failure fallback
  // until decoration has actually succeeded.
  window.ssrDescriptionElement = isSsrDescription ? descriptionDiv : null;

  if (!main.querySelector('.product-details')) {
    const block = buildBlock('product-details', { elems: [] });
    const targetSection = main.querySelector(':scope > div:first-child');
    if (targetSection) {
      targetSection.prepend(block);
    } else {
      const section = document.createElement('div');
      section.append(block);
      main.prepend(section);
    }
  }
}
