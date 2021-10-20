import wrap, { BaseTest } from 'playwright-fixtures';
import expect from 'expect';
import FakeTimers from '@sinonjs/fake-timers';
import onfetch from 'onfetch';

import type Pjax from '#';
import Switches from '#utils/Switches';

const noopAsyncFunc = async (): Promise<void> => {};

class MockedPjax implements Pjax {
  static switches = Switches;

  history!: Pjax['history'];

  location!: Pjax['location'];

  abortController = null;

  options: Pjax['options'] = {
    defaultTrigger: false,
    selectors: [],
    switches: {},
    scripts: '',
    scrollTo: false,
    scrollRestoration: false,
    cache: 'default',
    timeout: 0,
    hooks: {},
  };

  constructor(options: Partial<Pjax['options']> = {}) {
    Object.assign(this.options, options);
  }

  storeHistory = noopAsyncFunc;

  preparePage = noopAsyncFunc;

  fire = noopAsyncFunc;

  switchDOM = noopAsyncFunc;

  weakLoad = noopAsyncFunc;

  load = noopAsyncFunc;

  static reload = (): void => {};
}

// Playwright like test runner.
const wrappedTest = wrap(
  Object.assign(it as BaseTest, {
    describe,
    beforeAll: before,
    afterAll: after,
  }),
);

const rootTest = wrappedTest.extend<{ MockedPjax: typeof Pjax, uid: `test_${string}` }>({
  MockedPjax: async (context, use) => use(MockedPjax),
  uid: (_, use) => use(`test_${Math.random().toFixed(12).slice(2)}`),
});

rootTest.beforeAll(async () => {
  await onfetch.useServiceWorker();
});

declare module 'expect/build/types' {
  interface Matchers<R> {
    toHaveBeenScrolledToAround(element: Element): R;
    toHaveBeenScrolledToAround(left: number, top: number): R;
    toHaveBeenScrolledToAround(top: number): R;
  }
}

expect.extend({
  toHaveBeenScrolledToAround(
    received: unknown,
    eleOrLeftOrTop: Element | number,
    optTop?: number,
  ) {
    let scrollPort: Element;
    if (received instanceof Window) {
      scrollPort = received.document.documentElement;
    } else if (received instanceof Element) {
      scrollPort = received;
    } else {
      return {
        message: () => `expected ${String(received)} not of type Window nor of type Element`,
        pass: false,
      };
    }
    let pass = true;
    let message = '';
    if (eleOrLeftOrTop instanceof Element) {
      const rect = eleOrLeftOrTop.getBoundingClientRect();
      const scrollRect = scrollPort.getBoundingClientRect();
      const check = (
        diff: number,
        type: string,
      ) => {
        pass = Math.abs(diff) <= 5;
        message += `${message ? ';' : 'expected content'} scrolled ${diff} px from the ${type} edge of the target element, ${pass ? '' : 'not '}to be around the element`;
      };
      check(rect.left - scrollRect.left - scrollPort.scrollLeft, 'left');
      if (pass) check(rect.top - scrollRect.top - scrollPort.scrollTop, 'top');
    } else {
      const [left, top] = optTop !== undefined ? [eleOrLeftOrTop, optTop] : [null, eleOrLeftOrTop];
      const compare = (
        actual: number,
        expected: number,
        type: string,
      ) => {
        pass = Math.abs(actual - expected) <= 5;
        message += `${message ? ';' : 'expected content'} scrolled ${actual} px from its ${type} edge, ${pass ? '' : 'not '}to be around ${expected} px`;
      };
      const { scrollLeft, scrollTop } = scrollPort;
      if (left !== null) compare(scrollLeft, left, 'left');
      if (pass) compare(scrollTop, top, 'top');
    }
    return {
      message: () => message,
      pass,
    };
  },
});

export { rootTest as test };
export { expect, FakeTimers, onfetch };
