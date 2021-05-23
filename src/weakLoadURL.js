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
  this.status.abortController?.abort();
  this.status.abortController = abortController;

  // Record node changes.
  let switchResult = null;

  // Find path difference.
  const targetPath = parsedURL.pathname + parsedURL.search;
  const currentPath = this.status.location.pathname + this.status.location.search;

  // Fetch and switch nodes on different page.
  if (targetPath !== currentPath) {
    this.fire('send');
    try {
      // Fetch new document.
      const {
        document: newDocument,
        location: newLocation,
      } = await this.fetchDocument(url, overrideOptions);

      // Update URL while preserve hash, as the fetch discards it.
      const { hash } = parsedURL;
      parsedURL.href = newLocation.href;
      parsedURL.hash = hash;

      // Switch Nodes.
      switchResult = await this.switchNodes(newDocument, overrideOptions);
    } catch (e) {
      this.fire('error');
      throw e;
    } finally {
      this.fire('complete');
    }
    this.fire('success');
  }

  // Update location status.
  this.status.location = parsedURL;

  // Push history state if URL not matched.
  if (parsedURL.href !== window.location.href) {
    this.history.push({}, document.title, parsedURL.href);
  }

  // Prepare.
  await this.preparePage(switchResult, overrideOptions);
}
