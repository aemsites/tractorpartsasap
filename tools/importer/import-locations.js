/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import locationsParser from './parsers/locations.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/tractorpartsasap-cleanup.js';
import sectionsTransformer from './transformers/tractorpartsasap-sections.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  locations: locationsParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from tools/importer/page-templates.json)
const PAGE_TEMPLATE = {
  name: 'locations',
  description: 'Locations directory: page hero banner + a grid of retail store and salvage yard location cards (name, address, phone, More Info link). The live Google Map is deferred; the location list is captured from a script-stripped local snapshot.',
  urls: [
    'https://www.tractorpartsasap.com/locations',
  ],
  blocks: [
    {
      name: 'hero',
      instances: ['div.page-hero.locations', 'div.page-hero'],
    },
    {
      name: 'locations',
      instances: ['div.locations-list'],
    },
  ],
  sections: [
    {
      id: 'page-hero',
      name: 'Page hero',
      selector: ['div.page-hero.locations', 'div.page-hero'],
      style: null,
      blocks: ['hero'],
      defaultContent: [],
    },
    {
      id: 'locations-directory',
      name: 'Locations directory',
      selector: ['div.locations-list'],
      style: null,
      blocks: ['locations'],
      defaultContent: [],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook.
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

    // 1. beforeTransform (cleanup + section boundaries while anchors still exist)
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

    // 4. afterTransform (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. sanitized path
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
