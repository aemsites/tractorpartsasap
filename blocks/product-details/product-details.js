import { initializers } from '@dropins/tools/initializer.js';
import { initialize } from '@dropins/storefront-pdp/api.js';
import { render as pdpRender } from '@dropins/storefront-pdp/render.js';
import {
  Button,
  Icon,
  InLineAlert,
  provider as UI,
} from '@dropins/tools/components.js';
import { h } from '@dropins/tools/preact.js';

import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';

import { getSsrDescriptionElement, getOfferPricing } from '../../scripts/commerce.js';

/**
 * Removes product-bus SSR markup now replaced by the PDP drop-in, without
 * touching neighboring authored sections. Only called after the drop-in has
 * rendered successfully, so the SSR markup keeps serving as a fallback if
 * rendering fails.
 * @param {Element} block The product-details block
 */
function removeSsrContent(block) {
  const main = block.closest('main');
  const section = block.closest('.section');
  const blockWrapper = block.parentElement;

  if (section && blockWrapper) {
    [...section.children]
      .filter((child) => child !== blockWrapper)
      .forEach((child) => child.remove());
  }

  main?.querySelectorAll(':scope > .section[data-sku]').forEach((variantSection) => {
    variantSection.remove();
  });

  getSsrDescriptionElement()?.remove();
}

/**
 * Maps JSONLD to the ProductModel required by the PDP containers.
 * @returns {{product: Object, offer: Object|null}}
 */
function getProductData() {
  // TODO: Implement variant handling.
  // const hasVariants = window.variants && window.variants.length > 0;

  const jsonLd = window.jsonLdData;
  const offer = Array.isArray(jsonLd?.offers) ? jsonLd.offers[0] : null;
  const images = Array.isArray(jsonLd?.image) ? jsonLd.image : [jsonLd?.image].filter(Boolean);
  const price = Number(offer?.price ?? 0);

  const product = {
    __typename: 'SimpleProductView',
    sku: jsonLd?.sku,
    name: jsonLd?.name,
    // jsonLd's description is the short description; the long description
    // is only available as SSR markup rendered on the page.
    description: getSsrDescriptionElement()?.innerHTML ?? null,
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

  return { product, offer };
}

function isPurchasable(offer) {
  return offer?.availability === 'https://schema.org/InStock' && Number(offer?.price) > 0;
}

/**
 * Derives the active condition (New / Used / Rebuilt) from a schema.org offer.
 * @param {Object|null} offer
 * @returns {'New'|'Used'|'Rebuilt'}
 */
function getCondition(offer) {
  const c = (offer?.itemCondition || '').toLowerCase();
  if (c.includes('used')) return 'Used';
  if (c.includes('refurbished') || c.includes('rebuilt')) return 'Rebuilt';
  return 'New';
}

function formatPrice(value, currency = 'USD') {
  if (!Number.isFinite(value)) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

/** Builds the condition (New / Used / Rebuilt) selector markup. */
function conditionMarkup(active) {
  return ['New', 'Used', 'Rebuilt']
    .map((label) => {
      const isActive = label === active;
      return `<span class="product-details__condition-option${isActive ? ' is-active' : ''}">${label}</span>`;
    })
    .join('');
}

/** Builds the static assurances list (shipping / fit / warranty). */
function assurancesMarkup() {
  const rows = [
    ['Fast Shipping', 'Most parts ship in less than 1 business day'],
    ['Guaranteed Fit', 'Get the right part, the first time'],
    ['1-Year Warranty on All Parts', 'New, Used &amp; Rebuilt'],
  ];
  return rows
    .map(([title, text]) => `
      <li class="product-details__assurance">
        <span class="product-details__assurance-text"><strong>${title}</strong> &mdash; ${text}</span>
      </li>`)
    .join('');
}

export default async function decorate(block) {
  const { product, offer } = getProductData();
  const purchasable = isPurchasable(offer);
  const pricing = getOfferPricing(offer);
  const condition = getCondition(offer);
  const oemPrice = pricing?.regular && pricing.regular > (pricing.final ?? 0)
    ? formatPrice(pricing.regular, offer?.priceCurrency)
    : null;

  block.classList.toggle('product-details--unavailable', !purchasable);

  await initializers.mountImmediately(initialize, {
    sku: product.sku,
    models: {
      ProductDetails: {
        initialData: product,
      },
    },
  });

  const fragment = document.createRange().createContextualFragment(`
    <div class="product-details__top">
      <div class="product-details__gallery"></div>
      <div class="product-details__info">
        <div class="product-details__header"></div>

        <div class="product-details__meta">
          <div class="product-details__reviews">Mock Reviews</div>
          <div class="product-details__item-no">
            <span class="product-details__item-no-label">ASAP Item No.</span>
            <span class="product-details__item-no-value">${product.sku ?? ''}</span>
          </div>
        </div>

        <div class="product-details__purchase">
          ${purchasable ? `
          <div class="product-details__pricing">
            <div class="product-details__price-col">
              <span class="product-details__price-label">Our Price:</span>
              <div class="product-details__price"></div>
            </div>
            ${oemPrice ? `
            <div class="product-details__price-col">
              <span class="product-details__price-label">OEM Price:</span>
              <span class="product-details__oem-price">${oemPrice}</span>
            </div>` : ''}
          </div>` : ''}
          <div class="product-details__condition">${conditionMarkup(condition)}</div>
        </div>

        ${purchasable ? `
        <div class="product-details__shipping">
          <span>Mock Shipping</span>
        </div>

        <div class="product-details__fitment">
          <div class="product-details__fitment-info">
            <span class="product-details__fitment-head">Equipment Specific</span>
            <a class="product-details__fitment-link" href="#compatible">View Compatible Models</a>
          </div>
          <button type="button" class="product-details__check-fit">Check Fit</button>
        </div>

        <div class="product-details__actions">
          <div class="product-details__quantity"></div>
          <div class="product-details__add-to-cart"></div>
        </div>

        <ul class="product-details__assurances">${assurancesMarkup()}</ul>
        ` : ''}

        <div class="product-details__unavailable"></div>
      </div>
    </div>
    <div class="product-details__description"></div>
    <div class="product-details__attributes"></div>
  `);

  block.replaceChildren(fragment);

  let quantity = 1;

  await Promise.all([
    pdpRender.render(ProductGallery, {
      controls: 'thumbnailsRow',
      arrows: false,
      peak: false,
      gap: 'small',
      loop: false,
    })(
      block.querySelector('.product-details__gallery'),
    ),
    pdpRender.render(ProductHeader, {})(
      block.querySelector('.product-details__header'),
    ),
    pdpRender.render(ProductDescription, {})(
      block.querySelector('.product-details__description'),
    ),
    pdpRender.render(ProductAttributes, {})(
      block.querySelector('.product-details__attributes'),
    ),
    ...(purchasable ? [
      pdpRender.render(ProductPrice, {})(
        block.querySelector('.product-details__price'),
      ),
      pdpRender.render(ProductQuantity, {
        onValue: (value) => {
          quantity = value;
        },
      })(
        block.querySelector('.product-details__quantity'),
      ),
    ] : [
      UI.render(InLineAlert, {
        heading: 'Unavailable Online',
        description: 'This product is not available for purchase on our website. Please call us to check availability and place an order.',
        type: 'warning',
        icon: h(Icon, { source: 'WarningFilled' }),
      })(block.querySelector('.product-details__unavailable')),
    ]),
  ]);

  if (purchasable) {
    const addToCart = await UI.render(Button, {
      variant: 'primary',
      children: 'Add to Cart',
      onClick: () => {
        addToCart.setProps((prev) => ({ ...prev, children: `Added ${quantity}!`, disabled: true }));
        // Add to cart logic here...
        setTimeout(() => {
          addToCart.setProps((prev) => ({ ...prev, children: 'Add to Cart', disabled: false }));
        }, 1500);
      },
    })(block.querySelector('.product-details__add-to-cart'));
  }

  // Hide "Details" if no attributes.
  const $attributesList = block.querySelector('.product-details__attributes ul');
  if ($attributesList && $attributesList.children.length === 0) {
    $attributesList.closest('.product-details__attributes').remove();
  }

  removeSsrContent(block);
}
