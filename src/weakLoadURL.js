/**
 * Load a URL in Pjax way. Throw all errors.
 * @this {Pjax}
 * @param {string} url
 * @param {Partial<Pjax.options>} [overrideOptions]
 * @return {Promise<void>}
 */
export default async function weakLoadURL(url, overrideOptions = {}) {
  const parsedURL = new URL(url, document.URL);

  // External URL.
  if (parsedURL.origin !== window.location.origin) {
    throw new DOMException('Not same origin', 'SecurityError');
  }

  // Store scroll position.
  this.storeScrollPosition();

  // Setup abort controller.
  const abortController = new AbortController();
  this.abortController?.abort();
  this.abortController = abortController;

  // Record node changes.
  let switchResult = null;

  // Find path difference.
  const targetPath = parsedURL.pathname + parsedURL.search;
  const currentPath = this.location.pathname + this.location.search;

  if (targetPath === currentPath) {
    // Directly change location on same path.
    this.location = parsedURL;
  } else {
    // Fetch and switch on different path.
    switchResult = await this.fetchDOM(url, overrideOptions);
  }

  // Prepare.
  await this.preparePage(switchResult, overrideOptions);

  // Remove abort controller.
  this.abortController = null;
}
