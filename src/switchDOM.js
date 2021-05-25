import switchNodes from './utils/switchNodes';

/**
 * @typedef {Object} Pjax.SwitchResult
 * @property {boolean} focusCleared
 * @property {Array<*>} outcomes
 */

/**
 * @this {Pjax}
 * @param {string} url
 * @param {Partial<Pjax.options>} [overrideOptions]
 * @return {Promise<Pjax.SwitchResult>}
 */
export default async function switchDOM(url, overrideOptions = {}) {
  const { selectors, switches, timeout } = { ...this.options, ...overrideOptions };
  const parsedURL = new URL(url, document.URL);
  const signal = this.abortController?.signal || null;

  const request = new Request(parsedURL.href, {
    headers: {
      'X-Requested-With': 'Fetch',
      'X-Pjax': 'true',
      'X-Pjax-Selectors': JSON.stringify(selectors),
    },
    signal,
  });

  // Set timeout
  let timeoutID = null;
  if (timeout > 0) {
    timeoutID = window.setTimeout(() => {
      this.abortController?.abort();
    }, timeout);
  }

  const basicDetail = { targetURL: parsedURL.href };
  this.fire('send', { ...basicDetail });

  let switchResult;
  try {
    const response = await fetch(request)
      .finally(() => {
        window.clearTimeout(timeoutID);
      });

    // Switch before change URL.
    const newDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    switchResult = await switchNodes(newDocument, { selectors, switches, signal });

    // Update window location. Preserve hash as the fetch discards it.
    const newLocation = new URL(response.url);
    newLocation.hash = parsedURL.hash;
    if (window.location.href !== newLocation.href) {
      window.history.pushState({}, document.title, newLocation.href);
    }
  } catch (error) {
    this.fire('error', {
      ...basicDetail,
      error,
    });
    throw error;
  } finally {
    this.fire('complete', { ...basicDetail });
  }

  this.fire('success', { ...basicDetail });

  return switchResult;
}
