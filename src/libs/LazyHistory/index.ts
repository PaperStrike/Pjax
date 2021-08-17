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

/**
 * A valid history state object.
 */
export interface State {
  [name: string]: unknown;
}

class LazyHistory {
  /**
   * Used to generate unique keys.
   */
  private count = 0;

  /**
   * The prefix of the generated key.
   */
  declare idPrefix: string;

  /**
   * The key used in `window.history.state`.
   */
  declare historyKey: string;

  /**
   * The session key reflecting the current state.
   */
  declare sessionKey: string;

  /**
   * The current state.
   */
  declare state: State;

  constructor(idPrefix: string, historyKey: string = idPrefix) {
    this.idPrefix = idPrefix;
    this.historyKey = historyKey;

    // Initialize current history entry.
    window.history.replaceState(this.sign(), document.title);
  }

  /**
   * Save current state to session storage.
   */
  private save() {
    window.sessionStorage.setItem(this.sessionKey, JSON.stringify(this.state));
  }

  /**
   * Prepare a new session key and attach to current or given state.
   */
  private sign(state: State | null = window.history.state as State | null): State {
    if (this.count > 0) this.save();

    // Generate a new key.
    const sessionKey = `${this.idPrefix}_${this.count}`;
    this.count += 1;

    // Generate attached state.
    const SignedState = {
      ...state || {},
      [this.historyKey]: sessionKey,
    };

    this.sessionKey = sessionKey;
    this.state = SignedState;

    return SignedState;
  }

  /**
   * Push to history entry.
   */
  push(state: State, title: string, url: string): void {
    window.history.pushState(this.sign(state), title, url);
  }

  /**
   * Keep up with current browser history entry.
   */
  pull(): void {
    this.save();

    const sessionKey = (window.history.state as State | null)
      ?.[this.historyKey] as string | undefined;
    if (!sessionKey) {
      // Initialize if haven't.
      window.history.replaceState(this.sign(), document.title);
    } else {
      this.sessionKey = sessionKey;
      const savedState = window.sessionStorage.getItem(sessionKey);
      this.state = savedState ? JSON.parse(savedState) as State : {};
    }
  }
}

export default LazyHistory;
