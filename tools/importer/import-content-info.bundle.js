/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-content-info.js
  var import_content_info_exports = {};
  __export(import_content_info_exports, {
    default: () => import_content_info_default
  });

  // tools/importer/parsers/hero.js
  function parse(element, { document: document2 }) {
    const isSlideshow = element.matches('[class*="slideshow"], .widget-carousel') || element.querySelector(".slide-content, .owl-item");
    let scope = element;
    if (isSlideshow) {
      scope = element.querySelector(".owl-item.active .slide-content") || element.querySelector(".slide-content") || element.querySelector(".owl-item.active") || element;
    }
    const bgImage = scope.querySelector("img");
    const heading = scope.querySelector("h1, h2, h3");
    const subheading = scope.querySelector("p");
    const ctaSource = scope.querySelector("a[href]");
    let cta = null;
    if (ctaSource) {
      const href = ctaSource.getAttribute("href");
      const label = ctaSource.textContent.replace(/ /g, " ").trim();
      if (href) {
        cta = document2.createElement("a");
        cta.setAttribute("href", href);
        cta.textContent = label || "Shop Now";
      }
    }
    if (!bgImage && !heading && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([bgImage]);
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (subheading && !subheading.contains(ctaSource) && subheading.textContent.trim()) {
      contentCell.push(subheading);
    }
    if (cta) contentCell.push(cta);
    if (contentCell.length) cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function parse2(element, { document: document2 }) {
    let categories = Array.from(element.querySelectorAll(":scope > .results-categoy, .results-categoy"));
    const hasCategories = categories.length > 0;
    const groups = hasCategories ? categories.map((cat) => ({
      title: (cat.querySelector(".category-title, h3") || {}).textContent,
      items: Array.from(cat.querySelectorAll(".accordion"))
    })) : [{ title: null, items: Array.from(element.querySelectorAll(".accordion")) }];
    const output = [];
    groups.forEach((group) => {
      const cells = [];
      group.items.forEach((item) => {
        const qEl = item.querySelector(".title h4, .title, h4");
        const questionText = qEl ? qEl.textContent.trim() : "";
        const answerSource = item.querySelector(".body .faq-body-content, .faq-body-content, .body");
        const answerNodes = [];
        if (answerSource) {
          Array.from(answerSource.childNodes).forEach((n) => {
            if (n.nodeType === 1 && n.querySelector && n.querySelector("a") && /read more/i.test(n.textContent)) return;
            answerNodes.push(n);
          });
        }
        if (!questionText && answerNodes.length === 0) return;
        cells.push([questionText || "", answerNodes.length ? answerNodes : ""]);
      });
      if (cells.length === 0) return;
      if (group.title && group.title.trim()) {
        const h3 = document2.createElement("h3");
        h3.textContent = group.title.trim();
        output.push(h3);
      }
      const block = WebImporter.Blocks.createBlock(document2, { name: "accordion-faq", cells });
      output.push(block);
    });
    if (output.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(...output);
  }

  // tools/importer/transformers/tractorpartsasap-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function removeElements(root, selectors) {
    const wi = typeof WebImporter !== "undefined" ? WebImporter : typeof globalThis !== "undefined" ? globalThis.WebImporter : void 0;
    if (wi && wi.DOMUtils && typeof wi.DOMUtils.remove === "function") {
      wi.DOMUtils.remove(root, selectors);
      return;
    }
    selectors.forEach((selector) => {
      root.querySelectorAll(selector).forEach((el) => el.remove());
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      removeElements(element, [
        // Magento cookie / company status messages (both pages, top of <body>)
        "#cookie-status",
        ".cookie-status-message",
        ".message.company-warning",
        // Amasty consent manager (amConsentManager) cookie bar + modals (both pages)
        "aside.amgdprjs-bar-template",
        ".amgdprcookie-bar-container",
        ".amgdprcookie-groups-modal",
        "#amgdprcookie-form",
        ".amgdpr-privacy-policy",
        "#amgdpr-privacy-popup",
        // Zonos duty/tax widget – whole subtree incl. z-flag/z-info/z-body (both pages)
        "#zonos",
        ".z-flag",
        ".z-bubble",
        // Google reCAPTCHA (invisible badge in login popup) (both pages)
        "#recaptcha-popup-login-wrapper",
        "#recaptcha-popup-login",
        ".g-recaptcha",
        ".grecaptcha-badge",
        "#g-recaptcha-response",
        // Magento authentication / login-checkout popup + social login (both pages)
        "#authenticationPopup",
        ".block-authentication",
        ".mstSocialLogin__login",
        // Owl-carousel cloned duplicate slides + nav/dots on the homepage hero
        // slideshow (keep only the real ".owl-item.active" slides).
        ".owl-item.cloned",
        ".owl-nav",
        ".owl-dots",
        // Empty JS initializer stub left in the homepage body
        ".equipment-data-initializer",
        // Magento page-level message containers (both pages, non-authorable)
        ".page.messages",
        // content-info page chrome: breadcrumbs + mobile phone bar (faq page)
        ".breadcrumbs",
        ".mobile-phone-container"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      removeElements(element, [
        // Global header shell + navigation (both pages) – EDS auto-populates header
        "header",
        ".page-header",
        "nav.navigation",
        ".nav-sections",
        // Global footer shell (both pages) – EDS auto-populates footer
        "footer",
        ".page-footer",
        // Breadcrumbs (content-info) – belt-and-suspenders in case markup shifted
        ".breadcrumbs",
        // Any consent / widget subtree that survived
        "#authenticationPopup",
        "#zonos",
        // Chat / reCAPTCHA / embedded iframes are all non-authorable chrome
        "iframe",
        // Safe leftover / non-authorable elements present on the live page
        "script",
        "style",
        "noscript",
        "svg",
        "link",
        "source",
        // Third-party tracking pixels (MS Clarity, reCAPTCHA logo, eDesk, Zonos)
        'img[src*="c.clarity.ms"]',
        'img[src*="/recaptcha/"]',
        'img[src*="dashboard.edesk.com"]',
        'img[src*="hello.zonos.com"]'
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("onclick");
        el.removeAttribute("data-bind");
        el.removeAttribute("data-mage-init");
        el.removeAttribute("data-role");
        el.removeAttribute("data-container");
        el.removeAttribute("aria-busy");
      });
    }
  }

  // tools/importer/transformers/tractorpartsasap-sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function createSectionMetadata(doc, style) {
    const wi = typeof WebImporter !== "undefined" ? WebImporter : typeof globalThis !== "undefined" ? globalThis.WebImporter : void 0;
    if (wi && wi.Blocks && typeof wi.Blocks.createBlock === "function") {
      return wi.Blocks.createBlock(doc, {
        name: "Section Metadata",
        cells: { style }
      });
    }
    const table = doc.createElement("table");
    const headRow = doc.createElement("tr");
    const th = doc.createElement("th");
    th.setAttribute("colspan", "2");
    th.textContent = "Section Metadata";
    headRow.appendChild(th);
    const dataRow = doc.createElement("tr");
    const tdKey = doc.createElement("td");
    tdKey.textContent = "style";
    const tdVal = doc.createElement("td");
    tdVal.textContent = style;
    dataRow.appendChild(tdKey);
    dataRow.appendChild(tdVal);
    table.appendChild(headRow);
    table.appendChild(dataRow);
    return table;
  }
  function findSectionElement(root, selectors) {
    if (!Array.isArray(selectors)) return null;
    for (let i = 0; i < selectors.length; i += 1) {
      const el = root.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const template = payload && payload.template;
    const sections = template && template.sections;
    if (!sections || !Array.isArray(sections) || sections.length < 2) return;
    const doc = payload && payload.document || element.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    const resolved = sections.map((section) => ({
      section,
      el: findSectionElement(element, section.selector)
    }));
    for (let i = resolved.length - 1; i >= 0; i -= 1) {
      const { section, el } = resolved[i];
      if (!el || !el.parentNode) continue;
      if (section.style) {
        const meta = createSectionMetadata(doc, section.style);
        el.parentNode.insertBefore(meta, el);
      }
      if (i > 0) {
        const hr = doc.createElement("hr");
        const anchor = section.style && el.previousElementSibling ? el.previousElementSibling : el;
        anchor.parentNode.insertBefore(hr, anchor);
      }
    }
  }

  // tools/importer/import-content-info.js
  var parsers = {
    hero: parse,
    "accordion-faq": parse2
  };
  var PAGE_TEMPLATE = {
    name: "content-info",
    description: "Content/info page template (covers ~178 static pages e.g. /faq, /shipping-and-returns, how-to articles): page hero banner + default editorial content (headings, paragraphs, inline images) + optional accordion-faq for expandable Q&A.",
    urls: [
      "https://www.tractorpartsasap.com/faq"
    ],
    blocks: [
      {
        name: "hero",
        instances: ["div.page-hero.faq", "div.page-hero"]
      },
      {
        name: "accordion-faq",
        instances: ["div.faq-questions .faq-results", "div.faq-questions"]
      }
    ],
    sections: [
      {
        id: "page-hero",
        name: "Page hero",
        selector: ["div.page-hero.faq", "div.page-hero"],
        style: null,
        blocks: ["hero"],
        defaultContent: []
      },
      {
        id: "intro-callout",
        name: "Intro / contact callout",
        selector: ["div.faq-contacts"],
        style: null,
        blocks: [],
        defaultContent: ["div.faq-contacts"]
      },
      {
        id: "faq-accordion",
        name: "FAQ accordion",
        selector: ["div.faq-questions"],
        style: null,
        blocks: ["accordion-faq"],
        defaultContent: []
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    [transform, transform2].forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_content_info_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_content_info_exports);
})();
