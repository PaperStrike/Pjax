import wrap, { BaseTest } from 'playwright-fixtures';
import expect from 'expect';
import FakeTimers from '@sinonjs/fake-timers';
import onfetch from 'onfetch';

import type Pjax from '#';
import Switches from '#utils/Switches';

onfetch.useServiceWorker();

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

const rootTest = wrappedTest.extend<{ MockedPjax: typeof Pjax }>({
  MockedPjax: async (context, use) => use(MockedPjax),
});

export { rootTest as test };
export { expect, FakeTimers, onfetch };
