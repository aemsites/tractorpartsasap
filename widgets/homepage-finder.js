/*
 * Homepage Finder widget behavior (Phase 1 placeholder).
 * The live finder pulls dependent make/model/category options from a data
 * feed that is deferred. Here we keep the dependent selects disabled and,
 * on submit, hand the chosen equipment type off to catalog search so the
 * control is functional rather than dead.
 */
export default function decorate(widget) {
  const form = widget.querySelector('.homepage-finder-form');
  const typeSelect = widget.querySelector('#finder-type');
  if (!form || !typeSelect) return;

  form.addEventListener('submit', (e) => {
    const type = typeSelect.value.trim();
    if (!type) {
      // nothing selected — send to the general catalog search landing
      return;
    }
    e.preventDefault();
    const url = new URL('/catalogsearch/result/', window.location.origin);
    url.searchParams.set('q', type);
    window.location.assign(url.pathname + url.search);
  });
}
