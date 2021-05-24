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
  const signal = this.abortController?.signal || null;

  const request = new Request(url, {
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

  this.fire('send');

  let switchResult;
  try {
    const response = await fetch(request)
      .finally(() => {
        window.clearTimeout(timeoutID);
      });

    // Switch before change URL.
    const newDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    switchResult = await switchNodes(newDocument, { selectors, switches, signal });

    // Update location. Preserve hash as the fetch discards it.
    const newLocation = new URL(response.url);
    newLocation.hash = new URL(url).hash;
    this.location = newLocation;
  } catch (e) {
    this.fire('error');
    throw e;
  } finally {
    this.fire('complete');
  }

  this.fire('success');

  return switchResult;
}
