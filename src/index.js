import LazyHistory from './libs/LazyHistory';

import Switches from './utils/Switches';
import DefaultTrigger from './utils/DefaultTrigger';

import fetchDocument from './fetchDocument';
import switchNodes from './switchNodes';
import preparePage from './preparePage';
import weakLoadURL from './weakLoadURL';

class Pjax {
  static switches = Switches;

  static reload() {
    window.location.reload();
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
   * @property {?AbortController} abortController
   */
  status = {
    location: new URL(window.location.href),
    abortController: null,
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

  fetchDocument = fetchDocument;

  switchNodes = switchNodes;

  preparePage = preparePage;

  weakLoadURL = weakLoadURL;

  /**
   * Load a URL in Pjax way. Navigate normally on errors except AbortError.
   * @param {string} url
   * @param {Partial<Pjax.options>} [overrideOptions]
   * @return {Promise<void>}
   */
  async loadURL(url, overrideOptions = {}) {
    try {
      await this.weakLoadURL(url, overrideOptions);
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      window.location.assign(url);
    }
  }
}

export default Pjax;
