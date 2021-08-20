import type { Pjax, Options, EventDetail } from '.';
import switchNodes from './utils/switchNodes';

export default async function switchDOM(
  this: Pjax,
  requestInfo: RequestInfo,
  overrideOptions: Partial<Options> = {},
): Promise<void> {
  const {
    selectors,
    switches,
    cacheMode,
    timeout,
  } = { ...this.options, ...overrideOptions };

  const eventDetail: EventDetail = {};

  const signal = this.abortController?.signal || null;
  eventDetail.signal = signal;

  const request = new Request(requestInfo, {
    cache: cacheMode,
    signal,
  });
  request.headers.set('X-Requested-With', 'Fetch');
  request.headers.set('X-Pjax', 'true');
  request.headers.set('X-Pjax-Selectors', JSON.stringify(selectors));
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
    const response = await fetch(request)
      .finally(() => {
        window.clearTimeout(timeoutID);
      });
    eventDetail.response = response;

    // Push history state. Preserve hash as the fetch discards it.
    const newLocation = new URL(response.url);
    newLocation.hash = new URL(request.url).hash;
    if (window.location.href !== newLocation.href) {
      window.history.pushState(null, '', newLocation.href);
    }

    // Switch elements.
    const newDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
    eventDetail.switches = switches;
    const switchesResult = await switchNodes(newDocument, { selectors, switches, signal });
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
