import { onInit, done } from 'wrightplay';
import 'mocha';
import wrap, { BaseTest } from 'playwright-fixtures';
import { expect } from 'expect';
import FakeTimers from '@sinonjs/fake-timers';
import onfetch from 'onfetch';

import type Pjax from '../src';
import Switches from '../src/utils/Switches';

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

mocha.setup({
  ui: 'bdd',
  reporter: 'spec',
  color: true,
});

onInit(() => {
  mocha.run((failures) => {
    done(failures > 0 ? 1 : 0);
  });
});

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
  await Promise.all([
    window.navigator.serviceWorker.register('/sw.js'),
    onfetch.useServiceWorker(),
  ]);
});

export { rootTest as test };
export { expect, FakeTimers, onfetch };
