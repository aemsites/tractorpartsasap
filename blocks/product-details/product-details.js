import { initializers } from '@dropins/tools/initializer.js';
import { initialize } from '@dropins/storefront-pdp/api.js';
import { render as pdpRender } from '@dropins/storefront-pdp/render.js';

import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductOptions from '@dropins/storefront-pdp/containers/ProductOptions.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';

import { getSsrDescriptionHTML } from '../../scripts/commerce.js';

/**
 * Maps JSONLD to the ProductModel required by the PDP containers.
 * Some data
 * @returns
 */
function getProductData() {
  // TODO: Implement variant handling.
  // const hasVariants = window.variants && window.variants.length > 0;

  const jsonLd = window.jsonLdData;
  const offer = Array.isArray(jsonLd?.offers) ? jsonLd.offers[0] : null;
  const images = Array.isArray(jsonLd?.image) ? jsonLd.image : [jsonLd?.image].filter(Boolean);
  const price = Number(offer?.price ?? 0);

  return {
    __typename: 'SimpleProductView',
    sku: jsonLd?.sku,
    name: jsonLd?.name,
    // jsonLd's description is the short description; the long description
    // is only available as SSR markup rendered on the page.
    description: getSsrDescriptionHTML(),
    url: jsonLd?.url,
    images: images.map((url) => ({ url, label: null, roles: [] })),
    attributes: [],
    inStock: offer?.availability === 'https://schema.org/InStock',
    price: {
      roles: ['visible'],
      regular: {
        amount: {
          value: price,
          currency: offer?.priceCurrency,
        },
      },
      final: {
        amount: {
          value: price,
          currency: offer?.priceCurrency,
        },
      },
    },
    options: null,
  };
}

export default async function decorate(block) {
  const product = getProductData();

  await initializers.mountImmediately(initialize, {
    sku: product.sku,
    models: {
      ProductDetails: {
        initialData: product,
      },
    },
  });

  const fragment = document.createRange().createContextualFragment(`
    <div class="product-details__gallery"></div>
    <div class="product-details__content">
      <div class="product-details__header"></div>
      <div class="product-details__price"></div>
      <div class="product-details__short-description"></div>
      <div class="product-details__options"></div>
      <div class="product-details__quantity"></div>
      <div class="product-details__description"></div>
      <div class="product-details__attributes"></div>
    </div>
  `);

  block.replaceChildren(fragment);

  await Promise.all([
    pdpRender.render(ProductGallery, {})(
      block.querySelector('.product-details__gallery'),
    ),
    pdpRender.render(ProductHeader, {})(
      block.querySelector('.product-details__header'),
    ),
    pdpRender.render(ProductPrice, {})(
      block.querySelector('.product-details__price'),
    ),
    pdpRender.render(ProductShortDescription, {})(
      block.querySelector('.product-details__short-description'),
    ),
    pdpRender.render(ProductOptions, {})(
      block.querySelector('.product-details__options'),
    ),
    pdpRender.render(ProductQuantity, {})(
      block.querySelector('.product-details__quantity'),
    ),
    pdpRender.render(ProductDescription, {})(
      block.querySelector('.product-details__description'),
    ),
    pdpRender.render(ProductAttributes, {})(
      block.querySelector('.product-details__attributes'),
    ),
  ]);
}
