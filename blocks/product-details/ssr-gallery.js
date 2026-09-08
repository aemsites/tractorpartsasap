/**
 * Renders a carousel from <picture> elements already present in the
 * server-rendered product-bus markup (captured by
 * scripts/commerce.js:buildProductDetailsBlock before that markup is
 * stripped), instead of the PDP dropin's ProductGallery container.
 *
 * The Catalog Service API used by ProductGallery resolves product images to
 * different (and, at time of writing, slower) CDN URLs than the ones
 * product-bus ingestion already rendered into the SSR markup - see
 * https://docs.adobecommerce.live/image-processing. Reusing those elements
 * directly avoids a slow, redundant image fetch for what is typically the
 * page's largest-contentful-paint element.
 *
 * Markup and class names mirror the dots + arrows configuration of
 * @dropins/storefront-pdp's ProductGallery/Carousel so this reuses the same
 * carousel CSS (injected globally by @dropins/storefront-pdp/render.js) and
 * looks the same. It only implements that one configuration (single image
 * per slide, dot controls, arrows) rather than the full Carousel feature set
 * (thumbnails, peak, loop, zoom, videos).
 *
 * @param {Element[]} pictures <picture> elements captured from SSR markup
 * @returns {(rootElement: Element) => Promise<void>}
 */
export default function renderSsrGallery(pictures) {
  return async (rootElement) => {
    const [firstPicture] = pictures;
    const firstImg = firstPicture?.querySelector('img');
    if (firstImg) {
      // The SSR markup marks every image `loading="lazy"`, which is normally
      // stripped from the DOM before the browser ever fetches it. Now that
      // it's the real gallery image, the first one needs to load eagerly to
      // be a fast LCP candidate.
      firstImg.loading = 'eager';
      firstImg.setAttribute('fetchpriority', 'high');
    }

    const root = document.createElement('div');
    // dropin-design provides the design-token CSS custom properties (colors,
    // spacing, etc.) that the carousel CSS depends on - normally supplied by
    // the dropin's own render Provider, which this bypasses.
    root.className = 'dropin-design pdp-carousel pdp-carousel--arrows';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'Carousel');
    root.style.setProperty('--flex-carousel', 'column');
    root.style.setProperty('--gap', 'var(--spacing-small)');
    root.style.setProperty('--width', '100%');

    const wrapper = document.createElement('div');
    wrapper.className = 'pdp-carousel__wrapper pdp-carousel__wrapper--horizontal';
    wrapper.tabIndex = 0;
    wrapper.style.setProperty('--total-width', '100%');
    wrapper.style.setProperty('--height', '100%');
    wrapper.style.setProperty('--gap', 'var(--spacing-small)');

    const slides = pictures.map((picture, index) => {
      const slide = document.createElement('div');
      slide.className = 'pdp-carousel__slide pdp-carousel__slide--horizontal';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.dataset.index = String(index);
      slide.append(picture);
      return slide;
    });
    wrapper.append(...slides);

    let activeIndex = 0;
    const dots = [];
    let prevButton;
    let nextButton;

    const setActive = (index) => {
      activeIndex = index;
      dots.forEach((dot, i) => {
        dot.classList.toggle('pdp-carousel__controls__button--active', i === index);
      });
      prevButton.disabled = index <= 0;
      nextButton.disabled = index >= slides.length - 1;
      prevButton.classList.toggle('dropin-button--tertiary--disabled', prevButton.disabled);
      nextButton.classList.toggle('dropin-button--tertiary--disabled', nextButton.disabled);
    };

    const goTo = (index) => {
      const target = Math.max(0, Math.min(index, slides.length - 1));
      slides[target].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    };

    // Reuses the dropin's own button/icon classes (styles injected globally
    // by @dropins/tools/initializer.js and @dropins/storefront-pdp/render.js)
    // so arrows/dots match the real ProductGallery pixel-for-pixel.
    const makeArrowButton = (direction, label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'button');
      button.className = `dropin-button dropin-button--medium dropin-button--tertiary pdp-carousel__button pdp-carousel__button--${direction}`;
      button.setAttribute('aria-label', label);
      button.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="dropin-icon dropin-icon--shape-stroke-2 pdp-carousel__button__icon pdp-carousel__button__icon--${direction}"><path vector-effect="non-scaling-stroke" d="M7.74512 9.87701L12.0001 14.132L16.2551 9.87701" stroke="currentColor" stroke-width="1" stroke-linecap="square" stroke-linejoin="round"/></svg>`;
      button.addEventListener('click', () => goTo(activeIndex + (direction === 'next' ? 1 : -1)));
      return button;
    };

    prevButton = makeArrowButton('prev', 'Previous');
    nextButton = makeArrowButton('next', 'Next');

    const controls = document.createElement('div');
    controls.className = 'pdp-carousel__controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Carousel Controls');
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'pdp-carousel__controls__button';
      dot.setAttribute('aria-label', `Show slide ${index + 1} of ${slides.length}`);
      dot.addEventListener('click', () => goTo(index));
      dots.push(dot);
      controls.append(dot);
    });

    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
      if (e.key === 'ArrowRight') goTo(activeIndex + 1);
    });

    if (slides.length > 1) {
      const observer = new IntersectionObserver((entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) setActive(Number(mostVisible.target.dataset.index));
      }, { root: wrapper, threshold: 0.6 });
      slides.forEach((slide) => observer.observe(slide));
    }

    root.append(wrapper);
    if (slides.length > 1) {
      root.append(prevButton, nextButton, controls);
    }
    setActive(0);

    rootElement.replaceChildren(root);
  };
}
