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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/widget.js
  function parse(element, { document: document2 }) {
    const parent = element.parentElement;
    if (parent && parent.querySelector('a[href*="/widgets/homepage-finder.html"]')) {
      element.remove();
      return;
    }
    const titleEl = element.querySelector(".amfinder-title, .part-finder__title");
    const label = titleEl && titleEl.textContent.trim() || "Homepage Finder";
    const link = document2.createElement("a");
    link.setAttribute("href", "/widgets/homepage-finder.html");
    link.textContent = label;
    const cells = [[[link]]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "widget", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  function parse2(element, { document: document2 }) {
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

  // tools/importer/parsers/cards-quicklinks.js
  function parse3(element, { document: document2 }) {
    const tiles = Array.from(element.querySelectorAll(":scope > .row > .category, :scope .category"));
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    tiles.forEach((tile) => {
      const link = tile.querySelector("a[href]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || seen.has(href)) return;
      seen.add(href);
      const a = document2.createElement("a");
      a.setAttribute("href", href);
      a.textContent = link.textContent.trim();
      cells.push([[a]]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-quicklinks", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-trust.js
  function parse4(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll(".info-block"));
    const cells = [];
    items.forEach((item) => {
      const img = item.querySelector("img");
      const titleEl = item.querySelector(".info-title, a");
      const titleText = titleEl ? titleEl.textContent.trim() : "";
      const subtextEl = item.querySelector(".info-subtext");
      const subtextText = subtextEl ? subtextEl.textContent.trim() : "";
      if (!img && !titleText && !subtextText) return;
      const imageCell = img || "";
      const bodyEls = [];
      if (titleText) {
        const h = document2.createElement("h3");
        h.textContent = titleText;
        bodyEls.push(h);
      }
      if (subtextText) {
        const p = document2.createElement("p");
        p.textContent = subtextText;
        bodyEls.push(p);
      }
      cells.push([imageCell, bodyEls]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-trust", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse5(element, { document: document2 }) {
    const isSbc = element.matches(".sbc-category") || element.querySelector(".sbc-nav, .sbc-image");
    let img = element.querySelector("img");
    if (!img) {
      const bgHost = element.querySelector('[style*="background-image"]') || (element.getAttribute("style") && /background-image/i.test(element.getAttribute("style")) ? element : null);
      if (bgHost) {
        const style = bgHost.getAttribute("style") || "";
        const match = style.match(/background-image\s*:\s*url\((['"]?)([^'")]+)\1\)/i);
        if (match && match[2]) {
          img = document2.createElement("img");
          img.setAttribute("src", match[2]);
          const headingForAlt = element.querySelector(".slide-text h3, h3, h2");
          img.setAttribute("alt", headingForAlt ? headingForAlt.textContent.trim() : "");
        }
      }
    }
    const bodyEls = [];
    if (isSbc) {
      const titleEl = element.querySelector(".sbc-nav-title");
      const titleText = titleEl ? titleEl.textContent.trim() : "";
      if (titleText) {
        const h = document2.createElement("h3");
        h.textContent = titleText;
        bodyEls.push(h);
      }
      const links = Array.from(element.querySelectorAll("nav.sbc-nav ul li a[href], .sbc-nav ul li a[href]"));
      if (links.length) {
        const ul = document2.createElement("ul");
        const seen = /* @__PURE__ */ new Set();
        links.forEach((link) => {
          const href = link.getAttribute("href");
          const label = (link.querySelector("span") || link).textContent.trim();
          if (!href || !label || seen.has(href + "|" + label)) return;
          seen.add(href + "|" + label);
          const li = document2.createElement("li");
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = label;
          li.appendChild(a);
          ul.appendChild(li);
        });
        if (ul.children.length) bodyEls.push(ul);
      }
    } else {
      const anchor = element.querySelector("a[href]");
      const href = anchor ? anchor.getAttribute("href") : null;
      const headingEl = element.querySelector(".slide-text h3, h3, h2");
      const descEl = element.querySelector(".slide-text p, p");
      const headingText = headingEl ? headingEl.textContent.trim() : "";
      const descText = descEl ? descEl.textContent.trim() : "";
      if (headingText) {
        const h = document2.createElement("h3");
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = headingText;
          h.appendChild(a);
        } else {
          h.textContent = headingText;
        }
        bodyEls.push(h);
      }
      if (descText) {
        const p = document2.createElement("p");
        p.textContent = descText;
        bodyEls.push(p);
      }
      if (!headingText && href) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.setAttribute("href", href);
        a.textContent = anchor.textContent.trim() || href;
        p.appendChild(a);
        bodyEls.push(p);
      }
    }
    if (!img && bodyEls.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[img || "", bodyEls.length ? bodyEls : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", cells });
    element.replaceWith(block);
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
        // Copyright bar is a SIBLING that sits AFTER </footer> (not inside it), so
        // it survives the 'footer' removal and otherwise leaks into the last content
        // section of every page. EDS auto-populates the footer/copyright.
        ".copyright-section",
        // FAQ / content-info left jump-nav sidebar (ul.faqs-sidebar in
        // .sidebar-additional) — a derived in-page anchor list, not authorable
        // content; it leaks after the accordion group if not removed.
        ".faqs-sidebar",
        ".sidebar-additional",
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
    if (hookName !== TransformHook2.beforeTransform) return;
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

  // tools/importer/import-homepage.js
  var parsers = {
    widget: parse,
    hero: parse2,
    "cards-quicklinks": parse3,
    "cards-trust": parse4,
    cards: parse5
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Site homepage: Find-Parts/promo hero band (deferred Homepage Finder placeholder + promo banner + quick-link tiles), value-props trust strip, Shop-by-Categories grid, Salvage/Equipment showcase, and About/SEO default copy.",
    urls: [
      "https://www.tractorpartsasap.com/"
    ],
    blocks: [
      {
        name: "widget",
        instances: [".part-finder", ".homepage-finder", ".amfinder-common-wrapper"]
      },
      {
        name: "hero",
        instances: ["section.home-hero-section .home-hero .widget-cms-slideshow"]
      },
      {
        name: "cards-quicklinks",
        instances: ["section.home-hero-section .featured-categories"]
      },
      {
        name: "cards-trust",
        instances: ["div.value-props"]
      },
      {
        name: "cards",
        instances: [
          "section.home-shop-by-categories .sbc-category",
          "section.equipment-section .grid-cms-slider .slide-container"
        ]
      }
    ],
    sections: [
      {
        id: "home-hero-band",
        name: "Find Parts / Promotional Hero band",
        selector: ["section.home-hero-section"],
        style: "grey",
        blocks: ["widget", "hero", "cards-quicklinks"],
        defaultContent: []
      },
      {
        id: "value-props",
        name: "Value Props / Trust strip",
        selector: ["div.value-props"],
        style: null,
        blocks: ["cards-trust"],
        defaultContent: []
      },
      {
        id: "shop-by-categories",
        name: "Shop by Categories showcase",
        selector: ["section.home-shop-by-categories"],
        style: null,
        blocks: ["cards"],
        defaultContent: []
      },
      {
        id: "equipment-showcase",
        name: "Salvage / Equipment showcase",
        selector: ["section.equipment-section"],
        style: null,
        blocks: ["cards"],
        defaultContent: []
      },
      {
        id: "about-seo",
        name: "About / SEO copy",
        selector: ["section.home-about-section"],
        style: null,
        blocks: [],
        defaultContent: ["section.home-about-section"]
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
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
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
  var import_homepage_default = {
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
  return __toCommonJS(import_homepage_exports);
})();
