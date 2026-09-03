/**
 * Wraps a dropin bootstrap callback so it only runs once, and re-runs on
 * prerendering activation (speculative prerendered pages fire loadEager once
 * at prerender time and once at activation).
 * @param {Function} cb - async bootstrap function for a single dropin
 * @returns {Function} the guarded initializer
 */
export default function initializeDropin(cb) {
  let initialized = false;

  const init = async (force = false) => {
    if (initialized && !force) return;
    await cb();
    initialized = true;
  };

  document.addEventListener('prerenderingchange', () => init(true), { once: true });

  return init;
}
