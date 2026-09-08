import { initializers } from '@dropins/tools/initializer.js';
import { initialize, setEndpoint } from '@dropins/storefront-pdp/api.js';
import initializeDropin from './index.js';
// eslint-disable-next-line import/no-cycle
import {
  getFetchGraphQL,
  fetchPlaceholders,
  getProductSku,
  getProductDataPromise,
  getSsrGalleryImages,
} from '../commerce.js';
import { getMetadata } from '../aem.js';

/**
 * Preloads a file with specified attributes
 * @param {string} href - The URL to preload
 * @param {string} as - The type of resource being preloaded
 */
function preloadFile(href, as) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.crossOrigin = 'anonymous';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Extracts the main product image URL from JSON-LD or meta tags. Fallback
 * for when no SSR gallery image was captured (see getSsrGalleryImages).
 * @returns {string|null} The image URL or null if not found
 */
function extractMainImageUrl() {
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');

  if (!jsonLdScript?.textContent) {
    return getMetadata('og:image') || getMetadata('image');
  }

  try {
    const jsonLd = JSON.parse(jsonLdScript.textContent);
    if (jsonLd?.['@type'] === 'Product' && jsonLd?.image) {
      return Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
    }
    return getMetadata('og:image') || getMetadata('image');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.debug('Failed to parse JSON-LD:', error);
    return getMetadata('og:image') || getMetadata('image');
  }
}

/**
 * Preloads PDP Dropins assets for optimal performance
 */
function preloadPDPAssets() {
  preloadFile('/scripts/__dropins__/storefront-pdp/api.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/render.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductHeader.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductPrice.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductShortDescription.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductDescription.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductAttributes.js', 'script');
  preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductGallery.js', 'script');

  // Prefer the image already rendered into the SSR/product-bus body (the
  // exact URL the gallery will actually use, see ssr-gallery.js) over
  // JSON-LD/meta tags, which may point to a different URL.
  const [firstSsrPicture] = getSsrGalleryImages();
  if (!firstSsrPicture) {
    // If no gallery is pre-rendered, we will use the dropin container later, so preload it.
    preloadFile('/scripts/__dropins__/storefront-pdp/containers/ProductGallery.js', 'script');
  }

  const imageUrl = firstSsrPicture?.querySelector('img')?.src || extractMainImageUrl();
  if (imageUrl) {
    preloadFile(imageUrl, 'image');
  } else {
    // eslint-disable-next-line no-console
    console.warn('Unable to infer main image from JSON-LD or meta tags');
  }
}

await initializeDropin(async () => {
  // Inherit Fetch GraphQL Instance (Catalog Service), configured by the
  // eager-phase buildProductDetailsBlock() call in commerce.js.
  setEndpoint(getFetchGraphQL());

  // Preload PDP assets immediately when this module is imported
  preloadPDPAssets();

  const sku = getProductSku();

  // Reuse the product data already fetched while detecting this page as a
  // product page during the eager phase, rather than fetching it again.
  const [product, labels] = await Promise.all([
    getProductDataPromise(),
    fetchPlaceholders('placeholders/pdp.json'),
  ]);

  const langDefinitions = {
    default: {
      ...labels,
    },
  };

  const models = {
    ProductDetails: {
      initialData: { ...product },
    },
  };

  return initializers.mountImmediately(initialize, {
    sku,
    langDefinitions,
    models,
  });
})();
