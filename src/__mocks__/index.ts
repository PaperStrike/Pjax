import type Pjax from '..';
import type { Options } from '..';

export default class MockedPjax implements Pjax {
  history!: Pjax['history'];

  location!: Pjax['location'];

  abortController = null;

  options: Options = {
    defaultTrigger: false,
    selectors: [],
    switches: {},
    scripts: '',
    scrollTo: false,
    scrollRestoration: false,
    cache: 'default',
    timeout: 0,
  };

  constructor(options: Partial<Options> = {}) {
    Object.assign(this.options, options);
  }

  preparePage = jest.fn();

  switchDOM = jest.fn();

  weakLoad = jest.fn();

  fire = jest.fn();

  load = jest.fn();

  storeHistory = jest.fn();
}
