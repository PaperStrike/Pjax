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

  location = new URL(window.location.href);

  fire = () => {};

  switchDOM = switchDOM;
}

test('partial document response', async () => {
  nock('https://partial')
    .get('/')
    .reply(200, '<body class="partial"></body>');

  const pjax = new SimplePjax();
  pjax.options.selectors = ['body'];

  await pjax.switchDOM('https://partial');
  expect(document.body.className).toBe('partial');
  expect(pjax.location.href).toBe('https://partial/');
});

test('empty body response', async () => {
  nock('https://empty')
    .get('/')
    .reply(200);

  const pjax = new SimplePjax();

  await pjax.switchDOM('https://empty');
  expect(document.body.children).toHaveLength(0);
  expect(pjax.location.href).toBe('https://empty/');
});

test('redirect request and preserve hash', async () => {
  nock('https://from')
    .get('/')
    .reply(302, undefined, {
      Location: 'https://to/',
    });
  nock('https://to')
    .get('/')
    .reply(200, '<body class="redirected"></body>');

  const pjax = new SimplePjax();
  pjax.options.selectors = ['body'];

  await pjax.switchDOM('https://from/#foo');

  expect(document.body.className).toBe('redirected');
  expect(pjax.location.href).toBe('https://to/#foo');
});

test('request headers', async () => {
  let nockReqHeaders;
  const getHeader = (name) => nockReqHeaders[name.toLowerCase()].join();
  nock('https://headers')
    .get('/')
    .reply(function replyHeaders() {
      /**
       * @this {nock.ReplyFnContext}
       */

      nockReqHeaders = { ...this.req.headers };
      return [200];
    });

  const pjax = new SimplePjax();

  await pjax.switchDOM('https://headers');

  expect(getHeader('X-Requested-With')).toBe('Fetch');
  expect(getHeader('X-Pjax')).toBe('true');
  expect(getHeader('X-Pjax-Selectors')).toBe(JSON.stringify(pjax.options.selectors));
});

test('throw on abort', async () => {
  nock('https://delay')
    .get('/')
    .delay(500)
    .replyWithError('Not Aborted.');

  const pjax = new SimplePjax();
  const abortController = new AbortController();
  pjax.abortController = abortController;

  const abortPromise = pjax.switchDOM('https://delay');
  abortController.abort();
  await expect(abortPromise).rejects.toMatchObject({ name: 'AbortError' });
});

test('throw on aborted signal', async () => {
  nock('https://delay')
    .get('/')
    .delay(500)
    .replyWithError('Not Aborted.');

  const pjax = new SimplePjax();
  const abortController = new AbortController();
  pjax.abortController = abortController;
  abortController.abort();

  await expect(pjax.switchDOM('https://delay'))
    .rejects.toMatchObject({ name: 'AbortError' });
});

test('do abort on timeout while pending', async () => {
  jest.useFakeTimers();
  nock('https://delay')
    .get('/')
    .delay(500)
    .replyWithError('Not Aborted.');

  const pjax = new SimplePjax();
  pjax.abortController = new AbortController();

  const timeoutPromise = pjax.switchDOM('https://delay', {
    timeout: 50,
  });

  jest.runAllTimers();
  await expect(timeoutPromise).rejects.toMatchObject({ name: 'AbortError' });
  expect(pjax.abortController.signal.aborted).toBe(true);
});

test('do not abort on timeout while not pending', async () => {
  jest.useFakeTimers();
  nock('https://resolve')
    .get('/')
    .reply(200);

  const pjax = new SimplePjax();
  pjax.abortController = new AbortController();

  await expect(pjax.switchDOM('https://resolve', {
    timeout: 50,
  })).resolves.not.toThrow();

  jest.runAllTimers();
  expect(pjax.abortController.signal.aborted).toBe(false);
});
