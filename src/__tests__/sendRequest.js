import fetch, { Request, Response } from 'node-fetch';
import nock from 'nock';

import sendRequest from '../sendRequest';

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

const pjaxInit = {
  options: {
    selectors: ['div.pjax', 'div.container'],
  },
  status: {
    abortController: null,
  },
};

test('test fetch request', async () => {
  nock('https://example')
    .get('/')
    .reply(200);

  const pjax = { ...pjaxInit };

  const response = await sendRequest.bind(pjax)(new Request('https://example'));

  expect(pjaxInit.status.request).toBeDefined();
  expect(pjax.status.abortController).toBeTruthy();
  expect(response.ok).toBe(true);
});

test('request headers are sent properly', async () => {
  nock('https://headers')
    .get('/')
    .reply(function replyHeaders() {
      /**
       * @this {nock.ReplyFnContext}
       */
      return [200, this.req.headers];
    });

  const pjax = { ...pjaxInit };

  const nockReqHeaders = await sendRequest
    .bind(pjax)(new Request('https://headers'))
    .then((res) => res.json());
  const getHeader = (name) => nockReqHeaders[name.toLowerCase()].join();

  expect(pjaxInit.status.request).toBeDefined();
  expect(pjax.status.abortController).toBeTruthy();

  expect(getHeader('X-Requested-With')).toBe('Fetch');
  expect(getHeader('X-Pjax')).toBe('true');
  expect(getHeader('X-Pjax-Selectors')).toBe(JSON.stringify(pjax.options.selectors));
});

test('fetch timeout is handled properly', async () => {
  nock('https://delay')
    .get('/')
    .delay(500)
    .replyWithError('Not Aborted.');

  const pjax = { ...pjaxInit };

  await expect(sendRequest.bind(pjax)(new Request('https://delay'), {
    timeout: 50,
  })).rejects.toThrow();

  expect(pjaxInit.status.request).toBeDefined();
  expect(pjaxInit.status.abortController.signal.aborted).toBe(true);
});
