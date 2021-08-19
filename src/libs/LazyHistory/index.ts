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
export interface HistoryState {
  [name: string]: unknown;
}

class LazyHistory<State> {
  /**
   * The index of current state.
   */
  declare private index: number;

  /**
   * The key used in `window.history.state` and session storage.
   */
  declare key: string;

  /**
   * The current state.
   */
  declare state: State | null;

  constructor(key: string) {
    this.key = key;

    this.pull();
  }

  /**
   * Keep up with current browser history entry.
   */
  pull(): void {
    // Get new state index.
    const historyState = window.history.state as HistoryState | null;
    const pulledIndex = historyState?.[this.key] as number | undefined;

    // Return if up-to-date.
    if (pulledIndex !== undefined && this.index === pulledIndex) return;

    // Get stored states.
    const stateListStr = window.sessionStorage.getItem(this.key);
    const stateList = stateListStr ? JSON.parse(stateListStr) as (State | null)[] : [];

    // Store current state.
    stateList[this.index] = this.state;
    window.sessionStorage.setItem(this.key, JSON.stringify(stateList));

    if (pulledIndex === undefined) {
      this.index = stateList.length;
      this.state = null;
      window.history.replaceState({
        ...historyState,
        [this.key]: this.index,
      }, document.title);
    } else {
      this.index = pulledIndex;
      this.state = stateListStr ? stateList[pulledIndex] : null;
    }
  }
}

export default LazyHistory;
