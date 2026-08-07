/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import accordionFaqParser from './parsers/accordion-faq.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/tractorpartsasap-cleanup.js';
import sectionsTransformer from './transformers/tractorpartsasap-sections.js';

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  'accordion-faq': accordionFaqParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from tools/importer/page-templates.json)
const PAGE_TEMPLATE = {
  name: 'content-info',
  description: 'Content/info page template (covers ~178 static pages e.g. /faq, /shipping-and-returns, how-to articles): page hero banner + default editorial content (headings, paragraphs, inline images) + optional accordion-faq for expandable Q&A.',
  urls: [
    'https://www.tractorpartsasap.com/faq',
  ],
  blocks: [
    {
      name: 'hero',
      instances: ['div.page-hero.faq', 'div.page-hero'],
    },
    {
      name: 'accordion-faq',
      instances: ['div.faq-questions .faq-results', 'div.faq-questions'],
    },
  ],
  sections: [
    {
      id: 'page-hero',
      name: 'Page hero',
      selector: ['div.page-hero.faq', 'div.page-hero'],
      style: null,
      blocks: ['hero'],
      defaultContent: [],
    },
    {
      id: 'intro-callout',
      name: 'Intro / contact callout',
      selector: ['div.faq-contacts'],
      style: null,
      blocks: [],
      defaultContent: ['div.faq-contacts'],
    },
    {
      id: 'faq-accordion',
      name: 'FAQ accordion',
      selector: ['div.faq-questions'],
      style: null,
      blocks: ['accordion-faq'],
      defaultContent: [],
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
      elements.forEach((element) => {
        // De-dupe: fallback selectors (e.g. .faq-questions after .faq-questions .faq-results)
        // can match overlapping elements — only register each element once.
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

    // 3. parse each block (skip elements already replaced/detached by a prior parser)
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
