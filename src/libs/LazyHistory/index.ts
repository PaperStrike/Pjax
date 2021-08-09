/**
 * Lazy Session History API
 * ===
 * Access the associated data of a history entry even after user navigations.
 *
 * On page navigation events (like popstate), `window.history.state` has already been changed and
 * we can't update the previous state anymore. To leave a last mark on the leaving page, we have to
 * either keep updating the state continuously - which usually causes performance issues,
 * or make use of other API.
 *
 * Internally, this module uses **session storage** to store data, and uses browsers' original
 * history state as keys to identify session storage items.
 */

declare module LazyHistory {
  /**
   * A valid history state object.
   */
  export interface State {
    [name: string]: any;
  }

  export interface SignedState extends State {}
}

class LazyHistory {
  /**
   * The prefix of the generated key.
   */
  idPrefix: string;

  /**
   * Used to generate unique keys.
   */
  count: number = 0;

  /**
   * The key used in `window.history.state`.
   */
  historyKey: string;

  /**
   * The session key reflecting the current state.
   */
  sessionKey: string;

  /**
   * The current state.
   */
  state: LazyHistory.State;

  constructor(idPrefix: string, historyKey: string = idPrefix) {
    this.idPrefix = idPrefix;
    this.historyKey = historyKey;

    // Initialize current history entry.
    window.history.replaceState(this.#sign(), document.title);
  }

  /**
   * Save current state to session storage.
   */
  #save() {
    window.sessionStorage.setItem(this.sessionKey, JSON.stringify(this.state));
  }

  /**
   * Prepare a new session key and attach to current or given state.
   */
  #sign(state: LazyHistory.State = window.history.state): LazyHistory.SignedState {
    this.#save();

    // Generate a new key.
    const sessionKey = `${this.idPrefix}_${this.count}`;
    this.count += 1;

    // Generate attached state.
    const attached = {
      ...state || {},
      [this.historyKey]: sessionKey,
    };

    this.sessionKey = sessionKey;
    this.state = attached;

    return attached;
  }

  /**
   * Push to history entry.
   */
  push(state: LazyHistory.State, title: string, url: string) {
    window.history.pushState(this.#sign(state), title, url);
  }

  /**
   * Keep up with current browser history entry.
   */
  pull() {
    this.#save();

    const sessionKey = window.history.state?.[this.historyKey];
    if (!sessionKey) {
      // Initialize if haven't.
      window.history.replaceState(this.#sign(), document.title);
    } else {
      this.sessionKey = sessionKey;
      const savedState = window.sessionStorage.getItem(sessionKey);
      this.state = savedState ? JSON.parse(savedState) : {};
    }
  }
}

export default LazyHistory;
