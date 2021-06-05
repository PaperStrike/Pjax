import fetch, { Request, Response } from 'node-fetch';
import nock from 'nock';

import switchDOM from '../switchDOM';

if (!global.fetch) global.fetch = fetch;
if (!global.Request) global.Request = Request;
if (!global.Response) global.Response = Response;

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

class SimplePjax {
  options = {
    selectors: ['div.pjax', 'div.container'],
  };

  fire = () => {};

  switchDOM = switchDOM;
}

test('partial document response', async () => {
  nock(window.location.origin)
    .get('/partial')
    .reply(200, '<body class="partial"></body>');

  const pjax = new SimplePjax();
  pjax.options.selectors = ['body'];

  await pjax.switchDOM('/partial');
  expect(document.body.className).toBe('partial');
  expect(window.location.pathname).toBe('/partial');
});

test('empty body response', async () => {
  nock(window.location.origin)
    .get('/empty')
    .reply(200);

  const pjax = new SimplePjax();

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

  const pjax = new SimplePjax();
  pjax.options.selectors = ['body'];

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

    const pjax = new SimplePjax();

    await pjax.switchDOM('/simple');
    expect(window.location.pathname).toBe('/simple');
  });

  test('is not called when URL already changed', async () => {
    nock(window.location.origin)
      .get('/simple')
      .reply(200);

    const pjax = new SimplePjax();
    window.history.pushState({}, '', '/simple');

    const pushStateSpy = jest.spyOn(window.history, 'pushState');

    await pjax.switchDOM('/simple');
    expect(pushStateSpy).not.toHaveBeenCalled();

    pushStateSpy.mockRestore();
  });
});

test('request headers', async () => {
  let nockReqHeaders;
  const getHeader = (name) => nockReqHeaders[name.toLowerCase()].join();
  nock(window.location.origin)
    .get('/headers')
    .reply(function replyHeaders() {
      /**
       * @this {nock.ReplyFnContext}
       */

      nockReqHeaders = { ...this.req.headers };
      return [200];
    });

  const pjax = new SimplePjax();

  await pjax.switchDOM('/headers');

  expect(getHeader('X-Requested-With')).toBe('Fetch');
  expect(getHeader('X-Pjax')).toBe('true');
  expect(getHeader('X-Pjax-Selectors')).toBe(JSON.stringify(pjax.options.selectors));
});

test('throw on abort', async () => {
  nock(window.location.origin)
    .get('/delay')
    .delay(500)
    .replyWithError('Not Aborted.');

  const pjax = new SimplePjax();
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

  const pjax = new SimplePjax();
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

  const pjax = new SimplePjax();
  pjax.abortController = new AbortController();

  const timeoutPromise = pjax.switchDOM('/delay', {
    timeout: 50,
  });

  jest.advanceTimersByTime(100);
  await expect(timeoutPromise).rejects.toMatchObject({ name: 'AbortError' });
  expect(pjax.abortController.signal.aborted).toBe(true);
});

test('do not abort on timeout while not pending', async () => {
  jest.useFakeTimers();
  nock(window.location.origin)
    .get('/resolve')
    .reply(200);

  const pjax = new SimplePjax();
  pjax.abortController = new AbortController();

  const resolvePromise = pjax.switchDOM('/resolve', {
    timeout: 50,
  });

  // Advance 1ms for nock delay.
  jest.advanceTimersByTime(1);
  await expect(resolvePromise).resolves.not.toThrow();

  jest.advanceTimersByTime(100);
  expect(pjax.abortController.signal.aborted).toBe(false);
});
