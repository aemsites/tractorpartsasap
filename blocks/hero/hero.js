/**
 * Hero block.
 *
 * Two shapes are supported:
 *   1. Text hero — a heading (and optional copy) over a dark band. Used for
 *      page titles like the FAQ "We're here to help".
 *   2. Image hero — the cell holds only an image, optionally wrapped in a link.
 *      Rendered as a full-width, clickable banner with no text and no dark
 *      band. Author it by placing an image in the hero cell and (optionally)
 *      linking the image to a destination; add no text.
 *
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  // The image may arrive as an optimized <picture> (aem.live backend) or as a
  // bare <img> (hand-authored content / local preview). Prefer the <picture>
  // wrapper when present so we move the whole element, not just the <img>.
  const media = block.querySelector('picture') || block.querySelector('img');
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');

  // Image hero: an image is present and there's no heading/body text.
  if (media && !heading) {
    // Is the image already wrapped in a link (author linked the image)?
    const existingLink = media.closest('a[href]');
    let link = null;
    if (existingLink && block.contains(existingLink)) {
      link = existingLink;
    } else {
      // A bare link sometimes lands as a sibling (its text is the URL); use its
      // href to wrap the image, then drop the now-empty text link.
      const siblingLink = block.querySelector('a[href]');
      if (siblingLink && !siblingLink.contains(media)) {
        link = document.createElement('a');
        link.href = siblingLink.getAttribute('href');
        siblingLink.remove();
      }
    }

    if (link) {
      link.classList.add('hero-image-link');
      link.textContent = '';
      link.append(media);
      block.replaceChildren(link);
    } else {
      block.replaceChildren(media);
    }

    block.classList.add('hero-image');
  }
}
