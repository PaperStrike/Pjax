import 'cross-fetch/polyfill';
import nock from 'nock';

import MockedPjax, { Options } from '..';
import switchDOM from '../switchDOM';

/**
 * Fix nock memory leak - May 17, 2021
 * https://github.com/nock/nock#memory-issues-with-jest
 * https://github.com/nock/nock/issues/2057#issuecomment-702401375
 */
beforeEach(() => {
  if (!nock.isActive()) {
    nock.activate();
  }
});

afterEach(() => {
  nock.restore();
});

jest.mock('..');
class Pjax extends MockedPjax {
  /**
   * Proxy to absolute URLs.
   * For node-fetch, upstream of cross-fetch, doesn't support
   * both relative URLs and base configuration. - Aug 17, 2021
   * @see https://github.com/node-fetch/node-fetch/issues/481
   */
  switchDOM = (
    requestInfo: RequestInfo,
    overrideOptions?: Partial<Options>,
  ): Promise<void> => {
    if (typeof requestInfo === 'string') {
      return switchDOM.bind(this)(new URL(requestInfo, document.URL).href, overrideOptions);
    }
    const absoluteRequest = new Request(new URL(requestInfo.url, document.URL).href, requestInfo);
    return switchDOM.bind(this)(absoluteRequest, overrideOptions);
  };
}

test('partial document response', async () => {
  nock(window.location.origin)
    .get('/partial')
    .reply(200, '<body class="partial"></body>');

  const pjax = new Pjax({
    selectors: ['body'],
  });

  await pjax.switchDOM('/partial');
  expect(document.body.className).toBe('partial');
  expect(window.location.pathname).toBe('/partial');
});

test('empty body response', async () => {
  nock(window.location.origin)
    .get('/empty')
    .reply(200);

  const pjax = new Pjax();

  await pjax.switchDOM('/empty');
  expect(document.body.children).toHaveLength(0);
  expect(window.location.pathname).toBe('/empty');
});

test('redirect request and preserve hash', async () => {
  nock(window.location.origin)
    .get('/from')
    .reply(302, undefined, {
      Location: '/to',
    });
  nock(window.location.origin)
    .get('/to')
    .reply(200, '<body class="redirected"></body>');

  const pjax = new Pjax({
    selectors: ['body'],
  });

  await pjax.switchDOM('/from#foo');

  expect(document.body.className).toBe('redirected');
  expect(window.location.pathname).toBe('/to');
  expect(window.location.hash).toBe('#foo');
});

describe('pushState', () => {
  test('is called when URL not changed', async () => {
    nock(window.location.origin)
      .get('/simple')
      .reply(200);

    const pjax = new Pjax();

    await pjax.switchDOM('/simple');
    expect(window.location.pathname).toBe('/simple');
  });

  test('is not called when URL already changed', async () => {
    nock(window.location.origin)
      .get('/simple')
      .reply(200);

    const pjax = new Pjax();
    window.history.pushState({}, '', '/simple');

    const pushStateSpy = jest.spyOn(window.history, 'pushState');

    await pjax.switchDOM('/simple');
    expect(pushStateSpy).not.toHaveBeenCalled();

    pushStateSpy.mockRestore();
  });
});

test('request headers', async () => {
  const sentHeaders = new Headers();
  nock(window.location.origin)
    .get('/headers')
    .reply(function replyHeaders() {
      Object.entries(this.req.headers).forEach(([name, value]) => sentHeaders.append(name, value));
      return [200];
    });

  const pjax = new Pjax();

  await pjax.switchDOM('/headers');

  expect(sentHeaders.get('X-Requested-With')).toBe('Fetch');
  expect(sentHeaders.get('X-Pjax')).toBe('true');
  expect(sentHeaders.get('X-Pjax-Selectors')).toBe(JSON.stringify(pjax.options.selectors));
});

test('throw on abort', async () => {
  nock(window.location.origin)
    .get('/delay')
    .delay(500)
    .replyWithError('Not Aborted.');

  const pjax = new Pjax();
  const abortController = new AbortController();
  pjax.abortController = abortController;

  const abortPromise = pjax.switchDOM('/delay');
  abortController.abort();
  await expect(abortPromise).rejects.toMatchObject({ name: 'AbortError' });
});

test('throw on aborted signal', async () => {
  nock(window.location.origin)
    .get('/delay')
    .delay(500)
    .replyWithError('Not Aborted.');

  const pjax = new Pjax();
  const abortController = new AbortController();
  pjax.abortController = abortController;
  abortController.abort();

  await expect(pjax.switchDOM('/delay'))
    .rejects.toMatchObject({ name: 'AbortError' });
});

test('do abort on timeout while pending', async () => {
  jest.useFakeTimers();
  nock(window.location.origin)
    .get('/delay')
    .delay(500)
    .replyWithError('Not Aborted.');

  const pjax = new Pjax({
    timeout: 50,
  });
  pjax.abortController = new AbortController();

  const timeoutPromise = pjax.switchDOM('/delay');

  jest.advanceTimersByTime(100);
  await expect(timeoutPromise).rejects.toMatchObject({ name: 'AbortError' });
  expect(pjax.abortController.signal.aborted).toBe(true);
});

test('do not abort on timeout while not pending', async () => {
  jest.useFakeTimers();
  nock(window.location.origin)
    .get('/resolve')
    .reply(200);

  const pjax = new Pjax({
    timeout: 50,
  });
  pjax.abortController = new AbortController();

  const resolvePromise = pjax.switchDOM('/resolve');

  // Advance 1ms for nock delay.
  jest.advanceTimersByTime(1);
  await expect(resolvePromise).resolves.not.toThrow();

  jest.advanceTimersByTime(100);
  expect(pjax.abortController.signal.aborted).toBe(false);
});
