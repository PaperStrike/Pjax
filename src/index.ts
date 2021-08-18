import LazyHistory from './libs/LazyHistory';

import Switches from './utils/Switches';
import DefaultTrigger from './utils/DefaultTrigger';

import switchDOM from './switchDOM';
import preparePage from './preparePage';
import weakLoad from './weakLoad';

export type Switch<T extends Element = Element>
  = (oldEle: T, newEle: T) => (Promise<void> | void);

export interface Options {
  defaultTrigger: boolean,
  selectors: string[],
  switches: Record<string, Switch>,
  scripts: string,
  scrollTo: number | [number, number] | boolean,
  scrollRestoration: boolean,
  cacheMode: RequestCache,
  timeout: number,
}

export interface SwitchesResult {
  focusCleared: boolean;
}

interface State {
  scrollPos: [number, number];
}

export interface History {
  state: State | null;
  pull(): void;
}

export interface EventDetail {
  signal?: AbortSignal | null;
  selectors?: Options['selectors'];
  request?: Request;
  response?: Response;
  timeout?: Options['timeout'];
  timeoutID?: number;
  switches?: Options['switches'];
  switchesResult?: SwitchesResult;
  error?: unknown;
}

export class Pjax {
  static switches = Switches;

  static reload(): void {
    window.location.reload();
  }

  /**
   * Options default values.
   */
  readonly options: Options = {
    defaultTrigger: true,
    selectors: ['title', '.pjax'],
    switches: {
      abc: Switches.default,
    },
    scripts: 'script[data-pjax]',
    scrollTo: true,
    scrollRestoration: true,
    cacheMode: 'default',
    timeout: 0,
  };

  readonly history: History = new LazyHistory('pjax');

  readonly location = new URL(window.location.href);

  /**
   * Pjax navigation abort controller.
   */
  abortController: AbortController | null = null;

  constructor(options: Partial<Options> = {}) {
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
      this.storeHistory();
      this.history.pull();

      // hashchange events trigger popstate with a null `event.state`.
      if (event.state === null) return;

      const overrideOptions: Partial<Options> = {};
      if (this.options.scrollRestoration && this.history.state) {
        overrideOptions.scrollTo = this.history.state.scrollPos;
      }

      this.load(window.location.href, overrideOptions).catch(() => {});
    });
  }

  storeHistory(): void {
    this.history.state = {
      scrollPos: [window.scrollX, window.scrollY],
    };
  }

  /**
   * Fire Pjax related events.
   */
  fire(type: 'send' | 'error' | 'success' | 'complete', detail: EventDetail): void {
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
    requestInfo: RequestInfo,
    overrideOptions?: Partial<Options>
  ) => Promise<void> = switchDOM;

  preparePage: (
    switchesResult: SwitchesResult | null,
    overrideOptions?: Partial<Options>
  ) => Promise<void> = preparePage;

  weakLoad: (
    requestInfo: RequestInfo,
    overrideOptions?: Partial<Options>
  ) => Promise<void> = weakLoad;

  /**
   * Load a URL in Pjax way. Navigate normally on errors except AbortError.
   */
  async load(requestInfo: RequestInfo, overrideOptions: Partial<Options> = {}): Promise<void> {
    try {
      await this.weakLoad(requestInfo, overrideOptions);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e;
      window.location.assign(typeof requestInfo === 'string' ? requestInfo : requestInfo.url);
    }
  }
}

export default Pjax;
