import { render as pdpRendered } from '@dropins/storefront-pdp/render.js';

// Containers
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';

import { getProductSku } from '../../scripts/commerce.js';
import renderSsrGallery from './ssr-gallery.js';

const IMAGE_SIZES = {
  width: 960,
  height: 1191,
};

/**
 * Formats numeric attribute values for display (e.g., "10.000000" → "10").
 * Non-numeric values are returned as-is.
 */
function formatNumericAttributeValue(value) {
  const trimmed = value.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return value;
  return new Intl.NumberFormat(document.documentElement.lang).format(Number(trimmed));
}

/**
 * Wraps a product-bus <h1> in the same markup/classes the PDP dropin's own
 * ProductHeader container renders, so a page using this static version looks
 * identical to one that mounted the live container. The SKU line has no
 * product-bus equivalent, but is already known synchronously (page
 * metadata), so there's no need to render it via the dropin either.
 * @param {Element} h1
 * @returns {Element}
 */
function buildSsrHeader(h1) {
  h1.classList.add('pdp-header__title');
  const wrapper = document.createElement('div');
  wrapper.className = 'pdp-header';
  wrapper.append(h1);
  const skuDiv = document.createElement('div');
  skuDiv.className = 'pdp-header__sku';
  skuDiv.textContent = getProductSku();
  wrapper.append(skuDiv);
  return wrapper;
}

/**
 * Wraps a product-bus description paragraph/list in the same markup/classes
 * the PDP dropin's own ProductDescription container renders - the content is
 * already identical (product-bus and Catalog Service render the same
 * description field), so this avoids waiting on the dropin at all.
 * @param {Element|null} p
 * @param {Element|null} ul
 * @returns {Element}
 */
function buildSsrDescription(p, ul) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pdp-description';
  if (p) wrapper.append(p);
  if (ul) wrapper.append(ul);
  return wrapper;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // SSR content is re-used directly - a background array is created to contain
  // render promises for elements we were unable to reuse or find from SSR.
  const ssrPictures = [...block.querySelectorAll('picture')];
  const ssrHeaderSource = block.querySelector('h1');
  const ssrDescriptionList = block.querySelector('ul');
  const ssrDescriptionParagraph = ssrDescriptionList?.previousElementSibling?.tagName === 'P'
    ? ssrDescriptionList.previousElementSibling
    : null;
  const background = [];

  const fragment = document.createRange().createContextualFragment(`
    <div class="product-details-gallery"></div>
    <div class="product-details-info">
      <div class="product-details-header"></div>
      <div class="product-details-price"></div>
      <div class="product-details-short-description"></div>
      <div class="product-details-description"></div>
      <div class="product-details-attributes"></div>
    </div>
  `);

  const $gallery = fragment.querySelector('.product-details-gallery');
  const $header = fragment.querySelector('.product-details-header');
  const $price = fragment.querySelector('.product-details-price');
  const $shortDescription = fragment.querySelector('.product-details-short-description');
  const $description = fragment.querySelector('.product-details-description');
  const $attributes = fragment.querySelector('.product-details-attributes');

  block.replaceChildren(fragment);

  if (ssrPictures.length) {
    renderSsrGallery(ssrPictures)($gallery);
  } else {
    background.push(pdpRendered.render(ProductGallery, {
      controls: 'dots',
      arrows: true,
      gap: 'small',
      imageParams: { ...IMAGE_SIZES },
    })($gallery));
  }

  if (ssrHeaderSource) {
    $header.classList.add('dropin-design');
    $header.append(buildSsrHeader(ssrHeaderSource));
  } else {
    background.push(pdpRendered.render(ProductHeader, {})($header));
  }
  if (ssrDescriptionParagraph || ssrDescriptionList) {
    $description.classList.add('dropin-design');
    $description.append(buildSsrDescription(ssrDescriptionParagraph, ssrDescriptionList));
  } else {
    background.push(pdpRendered.render(ProductDescription, {})($description));
  }

  // Price and other elements are always created after a client-side query.
  background.push(pdpRendered.render(ProductPrice, {})($price));
  background.push(pdpRendered.render(ProductShortDescription, {})($shortDescription));
  background.push(pdpRendered.render(ProductAttributes, {
    formatValue: formatNumericAttributeValue,
  })($attributes));

  Promise.all(background).catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Error rendering PDP dropin content:', e);
  });
}
