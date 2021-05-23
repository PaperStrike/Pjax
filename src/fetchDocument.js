/**
 * @this {Pjax}
 * @param {string} url
 * @param {Partial<Pjax.options>} [overrideOptions]
 * @return {Promise<{document: Document, location: URL}>}
 */
export default async function fetchDocument(url, overrideOptions = {}) {
  const { selectors, timeout } = { ...this.options, ...overrideOptions };
  const { abortController } = this.status;

  const request = new Request(url, {
    headers: {
      'X-Requested-With': 'Fetch',
      'X-Pjax': 'true',
      'X-Pjax-Selectors': JSON.stringify(selectors),
    },
    signal: abortController?.signal || null,
  });

  // Set timeout
  let timeoutID = null;
  if (timeout > 0) {
    timeoutID = window.setTimeout(() => {
      abortController?.abort();
    }, timeout);
  }

  const response = await fetch(request)
    .finally(() => {
      window.clearTimeout(timeoutID);
    });

  return {
    document: new DOMParser().parseFromString(await response.text(), 'text/html'),
    location: new URL(response.url),
  };
}
