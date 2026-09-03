import { render as pdpRendered } from '@dropins/storefront-pdp/render.js';

// Containers
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';

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
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
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

  await Promise.all([
    pdpRendered.render(ProductGallery, {
      controls: 'dots',
      arrows: true,
      gap: 'small',
      imageParams: { ...IMAGE_SIZES },
    })($gallery),
    pdpRendered.render(ProductHeader, {})($header),
    pdpRendered.render(ProductPrice, {})($price),
    pdpRendered.render(ProductShortDescription, {})($shortDescription),
    pdpRendered.render(ProductDescription, {})($description),
    pdpRendered.render(ProductAttributes, {
      formatValue: formatNumericAttributeValue,
    })($attributes),
  ]);
}
