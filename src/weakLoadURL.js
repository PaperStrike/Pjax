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
    // Directly pushState on same path.
    if (window.location.href !== parsedURL.href) {
      window.history.pushState({}, document.title, parsedURL.href);
    }
  } else {
    // Fetch and switch on different path.
    switchResult = await this.switchDOM(url, overrideOptions);
  }

  // Update Pjax location and prepare the page.
  this.history.pull();
  this.location.href = window.location.href;
  await this.preparePage(switchResult, overrideOptions);

  // Finish, remove abort controller.
  this.abortController = null;
}
