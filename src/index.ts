import LazyHistory from './libs/LazyHistory';

import Switches from './utils/Switches';
import DefaultTrigger from './utils/DefaultTrigger';

import switchDOM from './switchDOM';
import preparePage from './preparePage';
import weakLoadURL from './weakLoadURL';

declare module Pjax {
  export type Switch = (oldEle: Element, newEle: Element) => (Promise<void> | void);

  export interface Options {
    defaultTrigger: boolean,
    selectors: string[],
    switches: { [name: string]: Switch },
    scripts: string,
    scrollTo: number | [number, number] | boolean,
    scrollRestoration: boolean,
    cacheMode: RequestCache,
    timeout: number,
  }

  export interface SwitchesResult {
    focusCleared: boolean;
  }

  export interface EventDetail {
    targetURL?: string;
    signal?: AbortSignal | null;
    selectors?: Options['selectors'];
    timeout?: Options['timeout'];
    timeoutID?: number;
    switches?: Options['switches'];
    switchesResult?: SwitchesResult;
    error?: any;
  }
}

class Pjax {
  static switches = Switches;

  static reload() {
    window.location.reload();
  }

  /**
   * Options default values.
   */
  readonly options: Pjax.Options = {
    defaultTrigger: true,
    selectors: ['title', '.pjax'],
    switches: {},
    scripts: 'script[data-pjax]',
    scrollTo: true,
    scrollRestoration: true,
    cacheMode: 'default',
    timeout: 0,
  };

  readonly history = new LazyHistory('pjax');

  readonly location = new URL(window.location.href);

  /**
   * Pjax navigation abort controller.
   */
  abortController: AbortController | null = null;

  constructor(options: Partial<Pjax.Options> = {}) {
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

      const overrideOptions: Partial<Pjax.Options> = {};
      if (this.options.scrollRestoration && 'scrollPos' in this.history.state) {
        overrideOptions.scrollTo = this.history.state.scrollPos;
      }

      this.loadURL(window.location.href, overrideOptions).catch(() => {});
    });
  }

  storeScrollPosition(): void {
    this.history.state.scrollPos = [window.scrollX, window.scrollY];
  }

  /**
   * Fire Pjax related events.
   */
  fire(type: 'send' | 'error' | 'success' | 'complete', detail: Pjax.EventDetail) {
    const event = new CustomEvent(`pjax:${type}`, {
      bubbles: true,
      cancelable: false,
      detail: {
        abortController: this.abortController,
        ...detail,
      },
    });
    document.dispatchEvent(event);
  }

  switchDOM: (
    url: string,
    overrideOptions?: Partial<Pjax.Options>
  ) => Promise<void> = switchDOM;

  preparePage: (
    switchesResult: Pjax.SwitchesResult | null,
    overrideOptions?: Partial<Pjax.Options>
  ) => Promise<void> = preparePage;

  weakLoadURL: (
    url: string,
    overrideOptions?: Partial<Pjax.Options>
  ) => Promise<void> = weakLoadURL;

  /**
   * Load a URL in Pjax way. Navigate normally on errors except AbortError.
   */
  async loadURL(url: string, overrideOptions: Partial<Pjax.Options> = {}): Promise<void> {
    try {
      await this.weakLoadURL(url, overrideOptions);
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      window.location.assign(url);
    }
  }
}

export default Pjax;
