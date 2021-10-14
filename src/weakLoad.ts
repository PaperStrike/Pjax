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

  /**
   * The URL object of the target resource.
   * Used to identify fragment navigations.
   */
  const url = new URL(typeof requestInfo === 'string' ? requestInfo : requestInfo.url, document.baseURI);
  const path = url.pathname + url.search;
  const currentPath = this.location.pathname + this.location.search;

  /**
   * Identify fragment navigations.
   * Not using `.hash` here as it becomes the empty string for both empty and null fragment.
   * @see [Navigate fragment step | HTML Standard]{@link https://html.spec.whatwg.org/multipage/browsing-the-web.html#navigate-fragid-step}
   * @see [URL hash getter | URL Standard]{@link https://url.spec.whatwg.org/#dom-url-hash}
   */
  if (path === currentPath && url.href.includes('#')) {
    // pushState on different hash.
    if (window.location.hash !== url.hash) {
      window.history.pushState(null, '', url.href);
    }

    // Directly prepare for fragment navigation.
    await this.preparePage(null, overrideOptions);
  } else {
    // Switch DOM for normal navigation.
    await this.switchDOM(requestInfo, overrideOptions);
  }

  // Update Pjax location and prepare the page.
  this.history.pull();
  this.location.href = window.location.href;

  // Finish, remove abort controller.
  this.abortController = null;
}
