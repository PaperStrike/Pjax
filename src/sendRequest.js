/**
 * @this {Pjax}
 * @param {Request} request
 * @param {Partial<Pjax.options>} overrideOptions
 * @returns {Promise<Response>}
 */
export default async function sendRequest(request, overrideOptions = {}) {
  const options = { ...this.options, ...overrideOptions };

  const { selectors, timeout } = options;
  const abortController = new AbortController();

  const pjaxRequest = new Request(request, {
    signal: abortController.signal,
  });

  // Set Pjax headers without clearing others. They are not overridable by design.
  pjaxRequest.headers.set('X-Requested-With', 'Fetch');
  pjaxRequest.headers.set('X-Pjax', 'true');
  pjaxRequest.headers.set('X-Pjax-Selectors', JSON.stringify(selectors));

  if (timeout > 0) {
    window.setTimeout(() => {
      abortController.abort();
    }, timeout);
  }

  this.status.abortController?.abort();
  Object.assign(this.status, {
    abortController,
    request: pjaxRequest,
  });

  return fetch(pjaxRequest);
}
