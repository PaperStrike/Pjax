import type Pjax from '.';
import type { Options, EventDetail } from '.';
import switchNodes from './utils/switchNodes';

export default async function switchDOM(
  this: Pjax,
  requestInfo: RequestInfo,
  overrideOptions: Partial<Options> = {},
): Promise<void> {
  const {
    selectors,
    switches,
    cache,
    timeout,
    hooks,
  } = { ...this.options, ...overrideOptions };

  const eventDetail: EventDetail = {};

  const signal = this.abortController?.signal || null;
  eventDetail.signal = signal;

  /**
   * Specify request cache mode and abort signal.
   */
  const requestInit: RequestInit = { cache, signal };

  /**
   * Specify original referrer and referrerPolicy
   * since the later Request constructor steps discard the original ones.
   * @see [Request constructor steps | Fetch Standard]{@link https://fetch.spec.whatwg.org/#dom-request}
   */
  if (requestInfo instanceof Request) {
    requestInit.referrer = requestInfo.referrer;
    requestInit.referrerPolicy = requestInfo.referrerPolicy;
  }

  const rawRequest = new Request(requestInfo, requestInit);
  rawRequest.headers.set('X-Requested-With', 'Fetch');
  rawRequest.headers.set('X-Pjax', 'true');
  rawRequest.headers.set('X-Pjax-Selectors', JSON.stringify(selectors));

  const request = await hooks.request?.(rawRequest) || rawRequest;
  eventDetail.request = request;

  // Set timeout.
  eventDetail.timeout = timeout;
  let timeoutID: number | undefined;
  if (timeout > 0) {
    timeoutID = setTimeout(() => {
      this.abortController?.abort();
    }, timeout);
    eventDetail.timeoutID = timeoutID;
  }

  this.fire('send', eventDetail);

  try {
    const rawResponse = await fetch(request)
      .finally(() => {
        clearTimeout(timeoutID);
      });

    const response = await hooks.response?.(rawResponse) || rawResponse;
    eventDetail.response = response;

    this.fire('receive', eventDetail);

    // Push history state. Preserve hash as the fetch discards it.
    const newLocation = new URL(response.url);
    newLocation.hash = new URL(request.url).hash;
    if (window.location.href !== newLocation.href) {
      window.history.pushState(null, '', newLocation.href);
    }

    // Switch elements.
    const rawDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    const document = await hooks.document?.(rawDocument) || rawDocument;

    eventDetail.switches = switches;
    const rawSwitchesResult = await switchNodes(document, { selectors, switches, signal });

    const switchesResult = await hooks.switchesResult?.(rawSwitchesResult) || rawSwitchesResult;
    eventDetail.switchesResult = switchesResult;

    // Simulate initial page load.
    await this.preparePage(switchesResult, overrideOptions);
  } catch (error) {
    eventDetail.error = error;
    this.fire('error', eventDetail);
    throw error;
  } finally {
    this.fire('complete', eventDetail);
  }

  this.fire('success', eventDetail);
}
