import type Pjax from '.';

/**
 * Load a URL in Pjax way. Throw all errors.
 */
export default async function weakLoadURL(
  this: Pjax,
  url: string,
  overrideOptions: Partial<Pjax.Options> = {},
): Promise<void> {
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

  // Find path difference.
  const targetPath = parsedURL.pathname + parsedURL.search;
  const currentPath = this.location.pathname + this.location.search;

  if (targetPath === currentPath) {
    // Directly pushState on same path.
    if (window.location.href !== parsedURL.href) {
      window.history.pushState({}, document.title, parsedURL.href);
    }
    await this.preparePage(null, overrideOptions);
  } else {
    // Fetch and switch on different path.
    await this.switchDOM(url, overrideOptions);
  }

  // Update Pjax location and prepare the page.
  this.history.pull();
  this.location.href = window.location.href;

  // Finish, remove abort controller.
  this.abortController = null;
}
