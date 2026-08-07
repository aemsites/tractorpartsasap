/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import widgetParser from './parsers/widget.js';
import heroParser from './parsers/hero.js';
import cardsQuicklinksParser from './parsers/cards-quicklinks.js';
import cardsTrustParser from './parsers/cards-trust.js';
import cardsParser from './parsers/cards.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/tractorpartsasap-cleanup.js';
import sectionsTransformer from './transformers/tractorpartsasap-sections.js';

// PARSER REGISTRY
const parsers = {
  widget: widgetParser,
  hero: heroParser,
  'cards-quicklinks': cardsQuicklinksParser,
  'cards-trust': cardsTrustParser,
  cards: cardsParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from tools/importer/page-templates.json)
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Site homepage: Find-Parts/promo hero band (deferred Homepage Finder placeholder + promo banner + quick-link tiles), value-props trust strip, Shop-by-Categories grid, Salvage/Equipment showcase, and About/SEO default copy.',
  urls: [
    'https://www.tractorpartsasap.com/',
  ],
  blocks: [
    {
      name: 'widget',
      instances: ['.part-finder', '.homepage-finder', '.amfinder-common-wrapper'],
    },
    {
      name: 'hero',
      instances: ['section.home-hero-section .home-hero .widget-cms-slideshow'],
    },
    {
      name: 'cards-quicklinks',
      instances: ['section.home-hero-section .featured-categories'],
    },
    {
      name: 'cards-trust',
      instances: ['div.value-props'],
    },
    {
      name: 'cards',
      instances: [
        'section.home-shop-by-categories .sbc-category',
        'section.equipment-section .grid-cms-slider .slide-container',
      ],
    },
  ],
  sections: [
    {
      id: 'home-hero-band',
      name: 'Find Parts / Promotional Hero band',
      selector: ['section.home-hero-section'],
      style: 'grey',
      blocks: ['widget', 'hero', 'cards-quicklinks'],
      defaultContent: [],
    },
    {
      id: 'value-props',
      name: 'Value Props / Trust strip',
      selector: ['div.value-props'],
      style: null,
      blocks: ['cards-trust'],
      defaultContent: [],
    },
    {
      id: 'shop-by-categories',
      name: 'Shop by Categories showcase',
      selector: ['section.home-shop-by-categories'],
      style: null,
      blocks: ['cards'],
      defaultContent: [],
    },
    {
      id: 'equipment-showcase',
      name: 'Salvage / Equipment showcase',
      selector: ['section.equipment-section'],
      style: null,
      blocks: ['cards'],
      defaultContent: [],
    },
    {
      id: 'about-seo',
      name: 'About / SEO copy',
      selector: ['section.home-about-section'],
      style: null,
      blocks: [],
      defaultContent: ['section.home-about-section'],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook.
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform (document.body)
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  [cleanupTransformer, sectionsTransformer].forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all block instances on the page based on the embedded template.
 * @param {Document} document
 * @param {Object} template
 * @returns {Array<{name:string, selector:string, element:Element}>}
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        // eslint-disable-next-line no-console
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        // De-dupe: fallback selectors (e.g. widget's .part-finder / .homepage-finder /
        // .amfinder-common-wrapper) can match overlapping elements — register each once.
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  // eslint-disable-next-line no-console
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. parse each block (skip elements already replaced by a prior parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. sanitized path (map root URL to /index to avoid empty-path crash)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
