import type Pjax from '..';

export default class MockedPjax implements Pjax {
  history;

  location;

  abortController = null;

  options: Pjax.Options = {
    defaultTrigger: false,
    selectors: [],
    switches: {},
    scripts: '',
    scrollTo: false,
    scrollRestoration: false,
    cacheMode: 'default',
    timeout: 0,
  };

  constructor(options: Partial<Pjax.Options> = {}) {
    Object.assign(this.options, options);
  }

  preparePage = jest.fn();

  switchDOM = jest.fn();

  weakLoadURL = jest.fn();

  fire = jest.fn();

  loadURL = jest.fn();

  storeScrollPosition = jest.fn();
}
