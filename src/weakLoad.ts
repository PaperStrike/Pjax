import type Pjax from '.';
import type { Options } from '.';

/**
 * Load a URL in Pjax way. Throw all errors.
 */
export default async function weakLoad(
  this: Pjax,
  requestInfo: RequestInfo,
  overrideOptions: Partial<Options> = {},
): Promise<void> {
  // Store scroll position.
  this.storeHistory();

  // Setup abort controller.
  const abortController = new AbortController();
  this.abortController?.abort();
  this.abortController = abortController;

  // Whether to switch current DOM or not.
  let switchDOM = true;

  if (typeof requestInfo === 'string') {
    const parsedURL = new URL(requestInfo, document.URL);

    // Find path (pathname + search string, e.g. /abc?d=1) difference.
    const targetPath = parsedURL.pathname + parsedURL.search;
    const currentPath = this.location.pathname + this.location.search;

    // For same-path links with a `#`, prepare without switching the DOM.
    if (targetPath === currentPath && parsedURL.href.includes('#')) {
      // pushState on different hash.
      if (window.location.hash !== parsedURL.hash) {
        window.history.pushState(null, '', parsedURL.href);
      }
      await this.preparePage(null, overrideOptions);
      switchDOM = false;
    }
  }

  if (switchDOM) {
    await this.switchDOM(requestInfo, overrideOptions);
  }

  // Update Pjax location and prepare the page.
  this.history.pull();
  this.location.href = window.location.href;

  // Finish, remove abort controller.
  this.abortController = null;
}
