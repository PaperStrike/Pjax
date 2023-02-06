import LazyHistory from './libs/LazyHistory';

import Switches from './utils/Switches';
import DefaultTrigger from './utils/DefaultTrigger';

import switchDOM from './switchDOM';
import preparePage from './preparePage';
import weakLoad from './weakLoad';

export type Switch<T extends Element = Element>
  = (oldEle: T, newEle: T) => (Promise<void> | void);

export type Hook<T> = (input: T) => T | void | Promise<T | void>;

export interface Hooks {
  request?: Hook<Request>;
  response?: Hook<Response>;
  document?: Hook<Document>;
  switchesResult?: Hook<SwitchesResult>;
}

export interface TriggerOptions {
  enable?: boolean,
  exclude?: string,
}

export interface Options {
  defaultTrigger: boolean | TriggerOptions,
  selectors: string[],
  switches: Record<string, Switch>,
  scripts: string,
  scrollTo: number | [number, number] | boolean,
  scrollRestoration: boolean,
  cache: RequestCache,
  timeout: number,
  hooks: Hooks,
}

export interface SwitchesResult {
  focusCleared: boolean;
}

interface State {
  scrollPos?: [number, number];
}

export interface History {
  state: State | null;
  pull(): void;
}

export interface EventDetail {
  signal?: AbortSignal | null;
  request?: Request;
  response?: Response;
  timeout?: Options['timeout'];
  timeoutID?: number;
  switches?: Options['switches'];
  switchesResult?: SwitchesResult;
  error?: unknown;
}

class Pjax {
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
    switches: {},
    scripts: 'script[data-pjax]',
    scrollTo: true,
    scrollRestoration: true,
    cache: 'default',
    timeout: 0,
    hooks: {},
  };

  readonly history: History = new LazyHistory('pjax');

  readonly location = new URL(window.location.href);

  /**
   * Pjax navigation abort controller.
   */
  abortController: AbortController | null = null;

  constructor(options: Partial<Options> = {}) {
    Object.assign(this.options, options);

    const { defaultTrigger } = this.options;
    if (defaultTrigger === true || (defaultTrigger !== false && defaultTrigger.enable !== false)) {
      new DefaultTrigger(this).register();
    }

    window.addEventListener('popstate', (event) => {
      /**
       * The main reason why we write the LazyHistory library is right here:
       * `window.history.state` is ALREADY changed on popstate events and
       * we can't update the previous state anymore. (For scroll position, etc.)
       * As continuously updating `window.history.state` causes performance issues,
       * using a custom library seems to be the only choice.
       */

      // Ignore non-Pjax history entries.
      if (!(event.state && 'pjax' in event.state)) return;

      // Store history state and then update.
      this.storeHistory();
      this.history.pull();

      const overrideOptions: Partial<Options> = {};

      if (this.history.state?.scrollPos) {
        overrideOptions.scrollTo = this.history.state.scrollPos;

        // Read current scroll restoration behaviour.
        const restoration = window.history.scrollRestoration;

        // Use manual scroll restoration.
        if (restoration !== 'manual') {
          window.history.scrollRestoration = 'manual';

          // Restore original scroll restoration behaviour.
          setTimeout(() => {
            window.history.scrollRestoration = restoration;
          });
        }
      }

      this.load(window.location.href, overrideOptions).catch(() => {});
    });
  }

  storeHistory(): void {
    const state: State = {};

    // Store scroll position if required.
    if (this.options.scrollRestoration) {
      state.scrollPos = [window.scrollX, window.scrollY];
    }

    this.history.state = state;
  }

  /**
   * Fire Pjax related events.
   */
  fire(type: 'send' | 'receive' | 'error' | 'success' | 'complete', detail: EventDetail): void {
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
