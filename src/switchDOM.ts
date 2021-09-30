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

  const rawRequest = new Request(requestInfo, { cache, signal });
  rawRequest.headers.set('X-Requested-With', 'Fetch');
  rawRequest.headers.set('X-Pjax', 'true');
  rawRequest.headers.set('X-Pjax-Selectors', JSON.stringify(selectors));

  const request = await hooks.request?.(rawRequest) || rawRequest;
  eventDetail.request = request;

  // Set timeout
  eventDetail.timeout = timeout;
  let timeoutID: number | undefined;
  if (timeout > 0) {
    timeoutID = window.setTimeout(() => {
      this.abortController?.abort();
    }, timeout);
    eventDetail.timeoutID = timeoutID;
  }

  this.fire('send', eventDetail);

  try {
    const rawResponse = await fetch(request)
      .finally(() => {
        window.clearTimeout(timeoutID);
      });

    const response = await hooks.response?.(rawResponse) || rawResponse;
    eventDetail.response = response;

    // Push history state. Preserve hash as the fetch discards it.
    const newLocation = new URL(response.url);
    newLocation.hash = new URL(request.url).hash;
    if (window.location.href !== newLocation.href) {
      window.history.pushState(null, '', newLocation.href);
    }

    this.fire('receive', eventDetail);

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
