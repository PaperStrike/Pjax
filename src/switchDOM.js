import switchNodes from './utils/switchNodes';

/**
 * @this {Pjax}
 * @param {string} url
 * @param {Partial<Pjax.options>} [overrideOptions]
 * @return {Promise<void>}
 */
export default async function switchDOM(url, overrideOptions = {}) {
  const { selectors, switches, timeout } = { ...this.options, ...overrideOptions };

  const eventDetail = {};

  const parsedURL = new URL(url, document.URL);
  eventDetail.targetURL = parsedURL.href;

  const signal = this.abortController?.signal || null;
  eventDetail.signal = signal;

  eventDetail.selectors = selectors;
  const request = new Request(parsedURL.href, {
    headers: {
      'X-Requested-With': 'Fetch',
      'X-Pjax': 'true',
      'X-Pjax-Selectors': JSON.stringify(selectors),
    },
    signal,
  });

  // Set timeout
  eventDetail.timeout = timeout;
  let timeoutID = null;
  if (timeout > 0) {
    timeoutID = window.setTimeout(() => {
      this.abortController?.abort();
    }, timeout);
    eventDetail.timeoutID = timeoutID;
  }

  this.fire('send', eventDetail);

  try {
    const response = await fetch(request)
      .finally(() => {
        window.clearTimeout(timeoutID);
      });

    // Switch before changing URL.
    const newDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    eventDetail.switches = switches;
    const switchResult = await switchNodes(newDocument, { selectors, switches, signal });
    eventDetail.switchResult = switchResult;

    // Update window location. Preserve hash as the fetch discards it.
    const newLocation = new URL(response.url);
    newLocation.hash = parsedURL.hash;
    if (window.location.href !== newLocation.href) {
      window.history.pushState({}, document.title, newLocation.href);
    }

    // Simulate initial page load.
    await this.preparePage(switchResult, overrideOptions);
  } catch (error) {
    eventDetail.error = error;
    this.fire('error', eventDetail);
    throw error;
  } finally {
    this.fire('complete', eventDetail);
  }

  this.fire('success', eventDetail);
}
