import LazyHistory from './libs/LazyHistory';

import Switches from './utils/Switches';
import DefaultTrigger from './utils/DefaultTrigger';

import sendRequest from './sendRequest';
import parseResponse from './parseResponse';
import switchNodes from './switchNodes';
import preparePage from './preparePage';

class Pjax {
  static switches = Switches;

  static reload() {
    window.location.reload();
  }

  static normalLoad(href) {
    window.location.assign(href);
  }

  /**
   * Pjax options.
   * @property {boolean} defaultTrigger
   * @property {Array<string>} selectors
   * @property {Object<string, Pjax.Switch>} switches
   * @property {string} scripts
   * @property {number | number[] | boolean} scrollTo
   * @property {boolean} scrollRestoration
   * @property {RequestCache} cacheMode
   * @property {number} timeout
   */
  options = {
    defaultTrigger: true,
    selectors: ['title', '.pjax'],
    switches: {},
    scripts: 'script[data-pjax]',
    scrollTo: true,
    scrollRestoration: true,
    cacheMode: 'default',
    timeout: 0,
  };

  history = new LazyHistory('pjax');

  /**
   * @property {URL} location
   * @property {?Request} request
   * @property {?AbortController} abortController
   * @property {?Response} response
   */
  status = {
    location: new URL(window.location.href),
    request: null,
    abortController: null,
    response: null,
  };

  /**
   * @param {Partial<Pjax.options>} options
   */
  constructor(options = {}) {
    Object.assign(this.options, options);

    if (this.options.scrollRestoration) {
      window.history.scrollRestoration = 'manual';

      // Browsers' own restoration is faster and more stable on reload.
      window.addEventListener('beforeunload', () => {
        window.history.scrollRestoration = 'auto';
      });
    }

    if (this.options.defaultTrigger) new DefaultTrigger(this).register();

    window.addEventListener('popstate', (event) => {
      /**
       * The main reason why we write the LazyHistory library is right here:
       * `window.history.state` is ALREADY changed on popstate events and
       * we can't update the previous state anymore. (For scroll position, etc.)
       * As continuously updating `window.history.state` causes performance issues,
       * using a custom library seems to be the only choice.
       */

      // Store scroll position and then update the lazy state.
      this.storeScrollPosition();
      this.history.pull();

      // hashchange events trigger popstate with a null `event.state`.
      if (event.state === null) return;

      const overrideOptions = {};
      if (this.options.scrollRestoration && 'scrollPos' in this.history.state) {
        overrideOptions.scrollTo = this.history.state.scrollPos;
      }

      this.loadURL(window.location.href, overrideOptions).catch(() => {});
    });
  }

  storeScrollPosition() {
    this.history.state.scrollPos = [window.scrollX, window.scrollY];
  }

  /**
   * Fire Pjax related events.
   * @param {'send'|'error'|'success'|'complete'} type
   */
  fire(type) {
    const event = new CustomEvent(`pjax:${type}`, {
      bubbles: true,
      cancelable: false,
      // Make a copy
      detail: { ...this.status },
    });
    document.dispatchEvent(event);
  }

  switchNodes = switchNodes;

  sendRequest = sendRequest;

  parseResponse = parseResponse;

  preparePage = preparePage;

  async loadURL(url, overrideOptions = {}) {
    const parsedURL = new URL(url, document.URL);

    // External URL.
    if (parsedURL.origin !== window.location.origin) {
      Pjax.normalLoad(parsedURL.href);
    }

    // Store scroll position.
    this.storeScrollPosition();

    // Abort any previous request.
    this.status.abortController?.abort();

    // No fetch request and switches on same page.
    const targetPath = parsedURL.pathname + parsedURL.search;
    const currentPath = this.status.location.pathname + this.status.location.search;
    if (targetPath === currentPath) {
      this.status.location = parsedURL;
      return this.preparePage(null, overrideOptions);
    }

    this.fire('send');

    // Do the request and switches.
    return this.sendRequest(new Request(url), overrideOptions)
      .then((res) => this.parseResponse(res))
      .then((newDocument) => this.switchNodes(newDocument, overrideOptions))
      .then((switchResult) => this.preparePage(switchResult, overrideOptions))
      .then(() => {
        this.fire('success');
      })
      .catch((e) => {
        this.fire('error');
        if (e.name === 'AbortError') throw e;
        Pjax.normalLoad(this.status.response.url);
      })
      .finally(() => {
        this.fire('complete');
      });
  }
}

export default Pjax;
