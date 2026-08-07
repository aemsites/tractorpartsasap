/* eslint-disable */
/* global WebImporter */

/**
 * Site-wide cleanup transformer for tractorpartsasap.com (All States Ag Parts).
 *
 * Magento / Classy Llama storefront. Applies to BOTH migration templates:
 *   - "homepage"     (https://www.tractorpartsasap.com/)
 *   - "content-info" (e.g. /faq, /shipping-and-returns, how-to articles)
 *
 * Every selector below was verified against the captured DOM in
 *   migration-work/homepage/cleaned.html  and
 *   migration-work/faq/cleaned.html
 * Comments note which page(s) each selector was found on. Nothing is guessed.
 *
 * Removes non-authorable site chrome / third-party widgets that are NOT part of
 * the auto-populated EDS header/footer but pollute the imported page body:
 *   - Magento "cookies disabled" status + blocked-company warning
 *   - Amasty (amConsentManager / amGDPR) cookie consent bar, settings + info modals
 *   - Zonos duty/tax widget (#zonos + z-* subtree)
 *   - Google reCAPTCHA badge / invisible recaptcha wrapper
 *   - Magento authentication (login/checkout) popup + social-login
 *   - eDesk / "Chat intro" chat overlay iframes
 *   - Owl-carousel cloned duplicate slides + carousel nav/dots (keep real slides)
 *   - Page message containers, empty data-initializer stubs
 *   - Breadcrumbs and mobile phone chrome (content-info pages)
 *   - Header / footer / main + utility navigation shell
 *   - script / style / noscript / svg / link / source / iframe leftovers
 *   - Third-party tracking pixels (MS Clarity, reCAPTCHA logo, eDesk, Zonos)
 *
 * NOTE ON WebImporter: In the real helix-importer runtime `WebImporter` is a
 * global and `WebImporter.DOMUtils.remove` is used directly. On RequireJS-based
 * source pages (this Magento site) the importer bundle can register as an
 * anonymous AMD module instead of a global, leaving `WebImporter` undefined.
 * `removeElements()` prefers the real API when present and otherwise falls back
 * to the exact same behaviour (querySelectorAll + remove), so the transformer is
 * correct in production and validatable here.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/**
 * Remove all elements matching the given selectors from `root`.
 * Equivalent to WebImporter.DOMUtils.remove; uses it when the global is present.
 */
function removeElements(root, selectors) {
  const wi = (typeof WebImporter !== 'undefined')
    ? WebImporter
    : (typeof globalThis !== 'undefined' ? globalThis.WebImporter : undefined);
  if (wi && wi.DOMUtils && typeof wi.DOMUtils.remove === 'function') {
    wi.DOMUtils.remove(root, selectors);
    return;
  }
  selectors.forEach((selector) => {
    root.querySelectorAll(selector).forEach((el) => el.remove());
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // --- Overlays / widgets / modals that must be gone BEFORE block parsing ---
    // so parsers (hero, cards, cards-quicklinks, cards-trust, accordion-faq)
    // only see real, authorable content.
    removeElements(element, [
      // Magento cookie / company status messages (both pages, top of <body>)
      '#cookie-status',
      '.cookie-status-message',
      '.message.company-warning',

      // Amasty consent manager (amConsentManager) cookie bar + modals (both pages)
      'aside.amgdprjs-bar-template',
      '.amgdprcookie-bar-container',
      '.amgdprcookie-groups-modal',
      '#amgdprcookie-form',
      '.amgdpr-privacy-policy',
      '#amgdpr-privacy-popup',

      // Zonos duty/tax widget – whole subtree incl. z-flag/z-info/z-body (both pages)
      '#zonos',
      '.z-flag',
      '.z-bubble',

      // Google reCAPTCHA (invisible badge in login popup) (both pages)
      '#recaptcha-popup-login-wrapper',
      '#recaptcha-popup-login',
      '.g-recaptcha',
      '.grecaptcha-badge',
      '#g-recaptcha-response',

      // Magento authentication / login-checkout popup + social login (both pages)
      '#authenticationPopup',
      '.block-authentication',
      '.mstSocialLogin__login',

      // Owl-carousel cloned duplicate slides + nav/dots on the homepage hero
      // slideshow (keep only the real ".owl-item.active" slides).
      '.owl-item.cloned',
      '.owl-nav',
      '.owl-dots',

      // Empty JS initializer stub left in the homepage body
      '.equipment-data-initializer',

      // Magento page-level message containers (both pages, non-authorable)
      '.page.messages',

      // content-info page chrome: breadcrumbs + mobile phone bar (faq page)
      '.breadcrumbs',
      '.mobile-phone-container',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // --- Non-authorable shell + leftover elements (after block parsing) ---
    removeElements(element, [
      // Global header shell + navigation (both pages) – EDS auto-populates header
      'header',
      '.page-header',
      'nav.navigation',
      '.nav-sections',

      // Global footer shell (both pages) – EDS auto-populates footer
      'footer',
      '.page-footer',

      // Breadcrumbs (content-info) – belt-and-suspenders in case markup shifted
      '.breadcrumbs',

      // Any consent / widget subtree that survived
      '#authenticationPopup',
      '#zonos',

      // Chat / reCAPTCHA / embedded iframes are all non-authorable chrome
      'iframe',

      // Safe leftover / non-authorable elements present on the live page
      'script',
      'style',
      'noscript',
      'svg',
      'link',
      'source',

      // Third-party tracking pixels (MS Clarity, reCAPTCHA logo, eDesk, Zonos)
      'img[src*="c.clarity.ms"]',
      'img[src*="/recaptcha/"]',
      'img[src*="dashboard.edesk.com"]',
      'img[src*="hello.zonos.com"]',
    ]);

    // --- Attribute cleanup: strip Magento / Knockout / handler noise ---
    // (does not change element counts; keeps imported markup clean)
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('data-bind');
      el.removeAttribute('data-mage-init');
      el.removeAttribute('data-role');
      el.removeAttribute('data-container');
      el.removeAttribute('aria-busy');
    });
  }
}
